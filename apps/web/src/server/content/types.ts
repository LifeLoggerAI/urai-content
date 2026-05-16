import 'server-only';

export type ContentWorkflowStatus = 'draft' | 'review' | 'published' | 'archived';
export type ContentVisibility = 'public' | 'unlisted' | 'private';
export type ContentType = 'story' | 'ritual' | 'narrator' | 'marketplace' | 'export';

export type ContentItem = {
  id: string;
  slug: string;
  title: string;
  body: string;
  tags: string[];
  locale: string;
  status: ContentWorkflowStatus;
  visibility: ContentVisibility;
  createdBy: string;
  updatedAt: string;
  createdAt: string;
  sourceLabel: string;
  whyShownCopy: string;
  safetyNotes: string[];
  contentType: ContentType;
};

export type ModerationQueueItem = Record<string, unknown> & { id: string };
export type PublishingRelease = Record<string, unknown> & { id: string };
export type NarratorPrompt = Record<string, unknown> & { id: string };
export type StoryTemplate = Record<string, unknown> & { id: string };
export type RitualTemplate = Record<string, unknown> & { id: string };
export type MarketplaceItem = Record<string, unknown> & { id: string };
export type CreatorSubmission = Record<string, unknown> & { id: string };
export type ExportTemplate = Record<string, unknown> & { id: string };

export type TelemetryEvent = {
  event: string;
  userId?: string;
  entityId?: string;
  timestamp: string;
  metadata: Record<string, unknown>;
};

export type UserContentEntitlement = {
  userId: string;
  entitlementKey: string;
  grantedBy: string;
  grantedAt: string;
  expiresAt: string | null;
};

export type ContentRepository = {
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
};

export const FIRESTORE_COLLECTIONS = {
  contentItems: 'contentItems',
  contentVersions: 'contentVersions',
  moderationQueue: 'moderationQueue',
  publishingReleases: 'publishingReleases',
  telemetryEvents: 'telemetryEvents',
  userContentEntitlements: 'userContentEntitlements',
  narratorPrompts: 'narratorPrompts',
  storyTemplates: 'storyTemplates',
  ritualTemplates: 'ritualTemplates',
  marketplaceItems: 'marketplaceItems',
  creatorSubmissions: 'creatorSubmissions',
  exportTemplates: 'exportTemplates'
} as const;
