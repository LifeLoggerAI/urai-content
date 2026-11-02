import type {
  ContentItem,
  CreatorSubmission,
  ExportTemplate,
  MarketplaceItem,
  ModerationQueueItem,
  NarratorPrompt,
  PublishingRelease,
  RitualTemplate,
  StoryTemplate,
  TelemetryEvent,
  UserContentEntitlement
} from '../schemas/content.js';
import type { ContentRepository, CreatorSubmissionQueueOptions } from './types.js';
import {
  contentItemSchema, parseRuntimeContentRecord, creatorSubmissionSchema, exportTemplateSchema,
  marketplaceItemSchema, moderationQueueSchema, narratorPromptSchema, publishingReleaseSchema,
  ritualTemplateSchema, storyTemplateSchema, telemetryEventSchema, userContentEntitlementSchema,
} from '../schemas/content.js';
import { decodePageCursor, encodePageCursor, normalizePageLimit, type PageRequest, type PageResult } from '../query/pagination.js';
import { finalizeContentDeletionPurge, recordProviderDeletionReceipt, restoreContentDeletion } from '../privacy/deletionLifecycle.js';
import {
  assertContentDeletionBinding, assertDeletionOperationsEnabled, checksumContentRecords,
  deletionOperationTime,
  prepareContentSoftDeletion, type ContentDeletionRepositoryOptions, type ContentProviderDeletionReceipt,
  type SoftDeleteContentRequest, type StoredContentDeletion,
} from './deletionPersistence.js';

export class InMemoryContentRepository implements ContentRepository {
  constructor(private readonly options: ContentDeletionRepositoryOptions = {}) {}
  private readonly deletions = new Map<string, StoredContentDeletion>();
  private readonly tombstones = new Map<string, StoredContentDeletion>();
  private readonly content = new Map<string, ContentItem>();
  private readonly versions = new Map<string, Array<{ version: number; snapshot: ContentItem }>>();
  private readonly moderation: ModerationQueueItem[] = [];
  private readonly releases: PublishingRelease[] = [];
  private readonly telemetry: TelemetryEvent[] = [];
  private readonly entitlements = new Map<string, UserContentEntitlement[]>();
  private readonly narrator = new Map<string, NarratorPrompt>();
  private readonly story = new Map<string, StoryTemplate>();
  private readonly ritual = new Map<string, RitualTemplate>();
  private readonly marketplace = new Map<string, MarketplaceItem>();
  private readonly creatorSubs = new Map<string, CreatorSubmission>();
  private readonly exportTemplates = new Map<string, ExportTemplate>();

  private activeDeletion(id: string): boolean { return !!this.deletions.get(id) && this.deletions.get(id)!.tombstone.state !== 'restored'; }
  async upsertContent(item: ContentItem): Promise<void> {
    const parsed = contentItemSchema.parse(item);
    if (this.activeDeletion(parsed.id)) throw new Error('Content is deleted; explicit restore is required');
    this.content.set(parsed.id, structuredClone(parsed));
  }
  async getContent(id: string): Promise<ContentItem | null> {
    return this.activeDeletion(id) ? null : structuredClone(this.content.get(id) ?? null);
  }
  async listContentPage(request: PageRequest = {}): Promise<PageResult<ContentItem>> {
    const limit = normalizePageLimit(request.limit);
    const cursor = request.cursor ? decodePageCursor(request.cursor) : null;
    if (cursor && cursor.sortValue !== cursor.id) throw new Error('Invalid content pagination cursor');
    const rows = [...this.content.values()]
      .sort((a, b) => Buffer.compare(Buffer.from(a.id), Buffer.from(b.id)))
      .filter((item) => !cursor || Buffer.compare(Buffer.from(item.id), Buffer.from(cursor.id)) > 0)
      .slice(0, limit + 1);
    const scanned = rows.slice(0, limit);
    const last = scanned.at(-1);
    return { items: structuredClone(scanned.filter((item) => !this.activeDeletion(item.id))),
      nextCursor: rows.length > limit && last ? encodePageCursor({ sortValue: last.id, id: last.id }) : null };
  }
  async listContent(): Promise<ContentItem[]> {
    const page = await this.listContentPage({ limit: 100 });
    if (page.nextCursor) throw new Error('Content collection exceeds bounded read; use listContentPage');
    return page.items;
  }
  async getContentBySlug(slug: string): Promise<ContentItem | null> {
    const rows = [...this.content.values()].filter((item) => item.slug === slug && !this.activeDeletion(item.id));
    if (rows.length > 1) throw new Error('Ambiguous content slug');
    return structuredClone(rows[0] ?? null);
  }
  async deleteContent(): Promise<void> { throw new Error('Hard content deletion is disabled; use receipt-bound soft deletion'); }
  async softDeleteContent(request: SoftDeleteContentRequest): Promise<StoredContentDeletion> {
    assertDeletionOperationsEnabled(this.options);
    deletionOperationTime(this.options, request.requestedAt);
    const item = this.content.get(request.entityId);
    if (!item || this.activeDeletion(item.id)) throw new Error('Content item unavailable for deletion');
    if (this.tombstones.has(request.tombstoneId)) throw new Error('Content deletion tombstone already exists');
    const stored = prepareContentSoftDeletion(item, request);
    this.deletions.set(item.id, structuredClone(stored));
    this.tombstones.set(request.tombstoneId, structuredClone(stored));
    return structuredClone(stored);
  }
  private retainedDeletion(contentId: string): StoredContentDeletion {
    const stored = this.deletions.get(contentId);
    const item = this.content.get(contentId);
    if (!stored || stored.tombstone.state !== 'retained_for_restore' || !item) throw new Error('Active content deletion not found');
    assertContentDeletionBinding(item, stored, contentId, stored.tombstone.tombstoneId);
    return stored;
  }
  private saveDeletion(contentId: string, stored: StoredContentDeletion): StoredContentDeletion {
    this.deletions.set(contentId, structuredClone(stored));
    this.tombstones.set(stored.tombstone.tombstoneId, structuredClone(stored));
    return structuredClone(stored);
  }
  async restoreDeletedContent(contentId: string, ownerId: string, restoredAt: string): Promise<StoredContentDeletion> {
    assertDeletionOperationsEnabled(this.options);
    const stored = this.retainedDeletion(contentId);
    if (stored.tombstone.ownerId !== ownerId) throw new Error('Content restore owner mismatch');
    restoreContentDeletion(stored.tombstone, deletionOperationTime(this.options, restoredAt));
    return this.saveDeletion(contentId, { ...stored, tombstone: restoreContentDeletion(stored.tombstone, restoredAt) });
  }
  async recordContentProviderDeletionReceipt(contentId: string, system: string, receipt: ContentProviderDeletionReceipt): Promise<StoredContentDeletion> {
    assertDeletionOperationsEnabled(this.options);
    deletionOperationTime(this.options, receipt.confirmedAt);
    const stored = this.retainedDeletion(contentId);
    return this.saveDeletion(contentId, { ...stored, tombstone: recordProviderDeletionReceipt(stored.tombstone, system, receipt) });
  }
  async purgeDeletedContent(contentId: string, purgedAt: string): Promise<StoredContentDeletion> {
    assertDeletionOperationsEnabled(this.options);
    deletionOperationTime(this.options, purgedAt);
    const stored = this.retainedDeletion(contentId);
    const versions = this.versions.get(contentId) ?? [];
    if (versions.length > 100) throw new Error('Content purge exceeds bounded revision batch');
    const deleted = checksumContentRecords({ content: this.content.get(contentId), versions });
    const purged = { ...stored, tombstone: finalizeContentDeletionPurge(stored.tombstone, purgedAt, deleted) };
    this.content.delete(contentId);
    this.versions.delete(contentId);
    return this.saveDeletion(contentId, purged);
  }
  private writeRevision(contentId: string, snapshot: ContentItem, persistContent = false): number {
    const parsed = parseRuntimeContentRecord(snapshot);
    if (parsed.id !== contentId) throw new Error('Content revision identity mismatch');
    if (this.activeDeletion(contentId)) throw new Error('Content is deleted; explicit restore is required');
    const versions = this.versions.get(contentId) ?? [];
    const version = (versions.at(-1)?.version ?? 0) + 1;
    if (!Number.isSafeInteger(version)) throw new Error('Content revision counter exhausted');
    if (persistContent) this.content.set(contentId, structuredClone(parsed));
    versions.push({ version, snapshot: structuredClone(parsed) });
    this.versions.set(contentId, versions);
    return version;
  }
  async saveContentRevision(item: ContentItem): Promise<number> { return this.writeRevision(item.id, item, true); }
  async addVersion(contentId: string, snapshot: ContentItem): Promise<number> { return this.writeRevision(contentId, snapshot); }
  async listVersions(contentId: string): Promise<Array<{ version: number; snapshot: ContentItem }>> {
    if (this.activeDeletion(contentId)) return [];
    const rows = this.versions.get(contentId) ?? [];
    if (rows.length > 100) throw new Error('Content history exceeds bounded read');
    return structuredClone(rows);
  }
  async logModeration(item: ModerationQueueItem): Promise<void> { this.moderation.push(moderationQueueSchema.parse(item)); }
  async logRelease(release: PublishingRelease): Promise<void> { this.releases.push(publishingReleaseSchema.parse(release)); }
  async addTelemetry(event: TelemetryEvent): Promise<void> { this.telemetry.push(telemetryEventSchema.parse(event)); }
  async listTelemetry(limit = 100): Promise<TelemetryEvent[]> { return structuredClone([...this.telemetry].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, normalizePageLimit(limit, 100))); }
  async listEntitlements(userId: string): Promise<UserContentEntitlement[]> { const rows = this.entitlements.get(userId) ?? []; if (rows.length > 100) throw new Error('Entitlements exceed bounded read'); return structuredClone(rows); }
  async upsertNarratorPrompt(prompt: NarratorPrompt): Promise<void> { this.narrator.set(prompt.id, narratorPromptSchema.parse(prompt)); }
  async upsertStoryTemplate(template: StoryTemplate): Promise<void> { this.story.set(template.id, storyTemplateSchema.parse(template)); }
  async upsertRitualTemplate(template: RitualTemplate): Promise<void> { this.ritual.set(template.id, ritualTemplateSchema.parse(template)); }
  async upsertMarketplaceItem(item: MarketplaceItem): Promise<void> { this.marketplace.set(item.id, marketplaceItemSchema.parse(item)); }
  async upsertCreatorSubmission(item: CreatorSubmission): Promise<void> { this.creatorSubs.set(item.id, creatorSubmissionSchema.parse(item)); }
  async upsertExportTemplate(item: ExportTemplate): Promise<void> { this.exportTemplates.set(item.id, exportTemplateSchema.parse(item)); }

  async getCreatorSubmission(id: string): Promise<CreatorSubmission | null> { return structuredClone(this.creatorSubs.get(id) ?? null); }
  async listCreatorSubmissions(creatorId: string): Promise<CreatorSubmission[]> {
    const rows = [...this.creatorSubs.values()].filter((item) => item.creatorId === creatorId).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    if (rows.length > 100) throw new Error('Creator submissions exceed bounded read');
    return structuredClone(rows);
  }
  async listCreatorSubmissionQueue(options: CreatorSubmissionQueueOptions = {}): Promise<CreatorSubmission[]> {
    return structuredClone([...this.creatorSubs.values()].filter((item) => !options.status || item.status === options.status)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).slice(0, normalizePageLimit(options.limit, 50)));
  }

  seedEntitlement(entry: UserContentEntitlement): void {
    const current = this.entitlements.get(entry.userId) ?? [];
    current.push(userContentEntitlementSchema.parse(entry));
    this.entitlements.set(entry.userId, current);
  }
}
