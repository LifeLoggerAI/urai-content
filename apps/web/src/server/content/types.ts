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

export type { ContentRepository, CreatorSubmissionQueueOptions } from '../../../../../src/backend/types.js';
export { FIRESTORE_COLLECTIONS } from '../../../../../src/backend/firebaseRepository.contract.js';
