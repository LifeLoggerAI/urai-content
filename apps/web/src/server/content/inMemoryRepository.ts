import 'server-only';
import type {
  ContentItem,
  ContentRepository,
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
} from './types';

export class InMemoryContentRepository implements ContentRepository {
  private readonly content = new Map<string, ContentItem>();
  private readonly versions = new Map<string, Array<{ version: number; snapshot: ContentItem }>>();
  private readonly telemetry: TelemetryEvent[] = [];
  private readonly entitlements: UserContentEntitlement[] = [];
  private readonly narratorPrompts = new Map<string, NarratorPrompt>();
  private readonly storyTemplates = new Map<string, StoryTemplate>();
  private readonly ritualTemplates = new Map<string, RitualTemplate>();
  private readonly marketplaceItems = new Map<string, MarketplaceItem>();
  private readonly creatorSubmissions = new Map<string, CreatorSubmission>();
  private readonly exportTemplates = new Map<string, ExportTemplate>();
  private readonly moderationQueue: ModerationQueueItem[] = [];
  private readonly releases: PublishingRelease[] = [];

  async upsertContent(item: ContentItem): Promise<void> {
    this.content.set(item.id, item);
  }

  async getContent(id: string): Promise<ContentItem | null> {
    return this.content.get(id) ?? null;
  }

  async listContent(): Promise<ContentItem[]> {
    return [...this.content.values()];
  }

  async deleteContent(id: string): Promise<void> {
    this.content.delete(id);
  }

  async addVersion(contentId: string, snapshot: ContentItem): Promise<number> {
    const versions = this.versions.get(contentId) ?? [];
    const version = versions.length + 1;
    versions.push({ version, snapshot });
    this.versions.set(contentId, versions);
    return version;
  }

  async listVersions(contentId: string): Promise<Array<{ version: number; snapshot: ContentItem }>> {
    return [...(this.versions.get(contentId) ?? [])];
  }

  async logModeration(item: ModerationQueueItem): Promise<void> {
    this.moderationQueue.push(item);
  }

  async logRelease(release: PublishingRelease): Promise<void> {
    this.releases.push(release);
  }

  async addTelemetry(event: TelemetryEvent): Promise<void> {
    this.telemetry.push(event);
  }

  async listTelemetry(limit = 100): Promise<TelemetryEvent[]> {
    return [...this.telemetry].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit);
  }

  async listEntitlements(userId: string): Promise<UserContentEntitlement[]> {
    return this.entitlements.filter((item) => item.userId === userId);
  }

  async upsertNarratorPrompt(prompt: NarratorPrompt): Promise<void> { this.narratorPrompts.set(prompt.id, prompt); }
  async upsertStoryTemplate(template: StoryTemplate): Promise<void> { this.storyTemplates.set(template.id, template); }
  async upsertRitualTemplate(template: RitualTemplate): Promise<void> { this.ritualTemplates.set(template.id, template); }
  async upsertMarketplaceItem(item: MarketplaceItem): Promise<void> { this.marketplaceItems.set(item.id, item); }
  async upsertCreatorSubmission(item: CreatorSubmission): Promise<void> { this.creatorSubmissions.set(item.id, item); }
  async listCreatorSubmissions(creatorId: string): Promise<CreatorSubmission[]> {
    return [...this.creatorSubmissions.values()]
      .filter((item) => item.creatorId === creatorId)
      .sort((a, b) => String(b.submittedAt ?? b.updatedAt ?? '').localeCompare(String(a.submittedAt ?? a.updatedAt ?? '')));
  }
  async upsertExportTemplate(item: ExportTemplate): Promise<void> { this.exportTemplates.set(item.id, item); }
}