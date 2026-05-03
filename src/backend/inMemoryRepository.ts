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
import type { ContentRepository } from './types.js';

export class InMemoryContentRepository implements ContentRepository {
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

  async upsertContent(item: ContentItem): Promise<void> { this.content.set(item.id, item); }
  async getContent(id: string): Promise<ContentItem | null> { return this.content.get(id) ?? null; }
  async listContent(): Promise<ContentItem[]> { return [...this.content.values()]; }
  async deleteContent(id: string): Promise<void> { this.content.delete(id); }
  async addVersion(contentId: string, snapshot: ContentItem): Promise<number> {
    const versions = this.versions.get(contentId) ?? [];
    const version = versions.length + 1;
    versions.push({ version, snapshot });
    this.versions.set(contentId, versions);
    return version;
  }
  async listVersions(contentId: string): Promise<Array<{ version: number; snapshot: ContentItem }>> { return this.versions.get(contentId) ?? []; }
  async logModeration(item: ModerationQueueItem): Promise<void> { this.moderation.push(item); }
  async logRelease(release: PublishingRelease): Promise<void> { this.releases.push(release); }
  async addTelemetry(event: TelemetryEvent): Promise<void> { this.telemetry.push(event); }
  async listTelemetry(limit = 100): Promise<TelemetryEvent[]> { return this.telemetry.slice(-limit); }
  async listEntitlements(userId: string): Promise<UserContentEntitlement[]> { return this.entitlements.get(userId) ?? []; }
  async upsertNarratorPrompt(prompt: NarratorPrompt): Promise<void> { this.narrator.set(prompt.id, prompt); }
  async upsertStoryTemplate(template: StoryTemplate): Promise<void> { this.story.set(template.id, template); }
  async upsertRitualTemplate(template: RitualTemplate): Promise<void> { this.ritual.set(template.id, template); }
  async upsertMarketplaceItem(item: MarketplaceItem): Promise<void> { this.marketplace.set(item.id, item); }
  async upsertCreatorSubmission(item: CreatorSubmission): Promise<void> { this.creatorSubs.set(item.id, item); }
  async upsertExportTemplate(item: ExportTemplate): Promise<void> { this.exportTemplates.set(item.id, item); }

  seedEntitlement(entry: UserContentEntitlement): void {
    const current = this.entitlements.get(entry.userId) ?? [];
    current.push(entry);
    this.entitlements.set(entry.userId, current);
  }
}
