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

export interface ContentRepository {
  upsertContent(item: ContentItem): Promise<void>;
  getContent(id: string): Promise<ContentItem | null>;
  listContent(): Promise<ContentItem[]>;
  deleteContent(id: string): Promise<void>;
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
  upsertExportTemplate(item: ExportTemplate): Promise<void>;
}
