import 'server-only';
import type { z } from 'zod';
import {
  contentItemSchema,
  creatorSubmissionSchema,
  exportTemplateSchema,
  marketplaceItemSchema,
  moderationQueueSchema,
  narratorPromptSchema,
  publishingReleaseSchema,
  ritualTemplateSchema,
  storyTemplateSchema,
  telemetryEventSchema,
  userContentEntitlementSchema
} from './schemas';

export type ContentItem = z.output<typeof contentItemSchema>;
export type ContentWorkflowStatus = ContentItem['status'];
export type ContentVisibility = ContentItem['visibility'];
export type ContentType = ContentItem['contentType'];

export type ModerationQueueItem = z.output<typeof moderationQueueSchema>;
export type PublishingRelease = z.output<typeof publishingReleaseSchema>;
export type NarratorPrompt = z.output<typeof narratorPromptSchema>;
export type StoryTemplate = z.output<typeof storyTemplateSchema>;
export type RitualTemplate = z.output<typeof ritualTemplateSchema>;
export type MarketplaceItem = z.output<typeof marketplaceItemSchema>;
export type CreatorSubmission = z.output<typeof creatorSubmissionSchema>;
export type ExportTemplate = z.output<typeof exportTemplateSchema>;
export type TelemetryEvent = z.output<typeof telemetryEventSchema>;
export type UserContentEntitlement = z.output<typeof userContentEntitlementSchema>;

export type CreatorSubmissionQueueOptions = {
  status?: CreatorSubmission['status'];
  limit?: number;
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
  getCreatorSubmission(id: string): Promise<CreatorSubmission | null>;
  listCreatorSubmissions(creatorId: string): Promise<CreatorSubmission[]>;
  listCreatorSubmissionQueue(options?: CreatorSubmissionQueueOptions): Promise<CreatorSubmission[]>;
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
