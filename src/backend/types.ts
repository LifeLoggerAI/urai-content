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
import type { PageRequest, PageResult } from '../query/pagination.js';
import type { SoftDeleteContentRequest, StoredContentDeletion, ContentProviderDeletionReceipt } from './deletionPersistence.js';

export type CreatorSubmissionQueueOptions = { status?: CreatorSubmission['status']; limit?: number };

export interface ContentRepository {
  upsertContent(item: ContentItem): Promise<void>;
  saveContentRevision(item: ContentItem): Promise<number>;
  getContent(id: string): Promise<ContentItem | null>;
  listContent(): Promise<ContentItem[]>;
  listContentPage(request?: PageRequest): Promise<PageResult<ContentItem>>;
  getContentBySlug(slug: string): Promise<ContentItem | null>;
  deleteContent(id: string): Promise<void>;
  softDeleteContent(request: SoftDeleteContentRequest): Promise<StoredContentDeletion>;
  restoreDeletedContent(contentId: string, ownerId: string, restoredAt: string): Promise<StoredContentDeletion>;
  recordContentProviderDeletionReceipt(contentId: string, system: string, receipt: ContentProviderDeletionReceipt): Promise<StoredContentDeletion>;
  purgeDeletedContent(contentId: string, purgedAt: string): Promise<StoredContentDeletion>;
  addVersion(contentId: string, snapshot: ContentItem): Promise<number>;
  listVersions(contentId: string): Promise<Array<{ version: number; snapshot: ContentItem }>>;
  logModeration(item: ModerationQueueItem): Promise<void>;
  logRelease(release: PublishingRelease): Promise<void>;
  addTelemetry(event: TelemetryEvent): Promise<void>;
  listTelemetry(limit?: number): Promise<TelemetryEvent[]>;
  listEntitlements(userId: string): Promise<UserContentEntitlement[]>;
  upsertNarratorPrompt(prompt: NarratorPrompt): Promise<void>;
  upsertStoryTemplate(template: StoryTemplate): Promise<void>;
  upsertRitualTemplate(template: RitualTemplate): Promise<void>;
  upsertMarketplaceItem(item: MarketplaceItem): Promise<void>;
  upsertCreatorSubmission(item: CreatorSubmission): Promise<void>;
  getCreatorSubmission(id: string): Promise<CreatorSubmission | null>;
  listCreatorSubmissions(creatorId: string): Promise<CreatorSubmission[]>;
  listCreatorSubmissionQueue(options?: CreatorSubmissionQueueOptions): Promise<CreatorSubmission[]>;
  upsertExportTemplate(item: ExportTemplate): Promise<void>;
}
