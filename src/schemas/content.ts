import { z } from 'zod';

export const workflowStatusSchema = z.enum(['draft', 'review', 'approved', 'published', 'archived']);
export const accessTierSchema = z.enum(['free', 'pro', 'paid']);

export const contentItemSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  tags: z.array(z.string()),
  locale: z.string().default('en-US'),
  status: workflowStatusSchema,
  visibility: z.enum(['public', 'private', 'unlisted']),
  createdBy: z.string(),
  updatedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  sourceLabel: z.string(),
  whyShownCopy: z.string(),
  safetyNotes: z.array(z.string()),
  contentType: z.enum(['narrator', 'story', 'ritual', 'export', 'marketplace'])
});

export const narratorPromptSchema = z.object({
  id: z.string(),
  tone: z.enum(['cinematic', 'calm', 'reflective', 'grounded']),
  prompt: z.string(),
  quietHoursSafe: z.boolean(),
  reflectionScript: z.string(),
  accessibilityCaption: z.string()
});

export const storyTemplateSchema = z.object({
  id: z.string(),
  era: z.string(),
  beats: z.array(z.object({
    title: z.string(),
    ttsText: z.string(),
    caption: z.string(),
    startMs: z.number().int().nonnegative(),
    endMs: z.number().int().nonnegative()
  })),
  capcutMarkers: z.array(z.object({ label: z.string(), timestampMs: z.number().int().nonnegative() }))
});

export const ritualTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  instructions: z.array(z.string()),
  safetyClass: z.enum(['gentle', 'standard', 'sensitive']),
  eligibilitySignals: z.array(z.string()),
  reducedMotionAlternative: z.string()
});

export const marketplaceItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  creatorId: z.string(),
  moderationStatus: z.enum(['pending', 'approved', 'rejected']),
  tier: accessTierSchema,
  priceUsd: z.number().nonnegative(),
  entitlementKey: z.string()
});

export const creatorSubmissionSchema = z.object({
  id: z.string(),
  creatorId: z.string(),
  contentItemId: z.string(),
  submittedAt: z.string().datetime(),
  notes: z.string(),
  status: z.enum(['pending', 'accepted', 'rejected'])
});

export const moderationQueueSchema = z.object({
  id: z.string(),
  entityId: z.string(),
  entityType: z.enum(['contentItem', 'marketplaceItem', 'creatorSubmission']),
  status: z.enum(['pending', 'approved', 'rejected']),
  reviewerId: z.string().nullable(),
  decisionNotes: z.string().optional()
});

export const publishingReleaseSchema = z.object({
  id: z.string(),
  contentItemIds: z.array(z.string()),
  releasedAt: z.string().datetime(),
  releasedBy: z.string(),
  changelog: z.string()
});

export const contentVersionSchema = z.object({
  id: z.string(),
  contentItemId: z.string(),
  version: z.number().int().positive(),
  snapshot: contentItemSchema,
  createdAt: z.string().datetime(),
  createdBy: z.string()
});

export const exportTemplateSchema = z.object({
  id: z.string(),
  type: z.enum(['weekly-recap', 'pdf-card', 'png-card', 'srt', 'capcut']),
  title: z.string(),
  sections: z.array(z.string()),
  failureRetryCopy: z.string()
});

export const userContentEntitlementSchema = z.object({
  userId: z.string(),
  entitlementKey: z.string(),
  grantedBy: z.enum(['subscription', 'purchase', 'admin']),
  grantedAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable()
});

export const telemetryEventSchema = z.object({
  event: z.enum([
    'content_viewed',
    'ritual_previewed',
    'ritual_added',
    'story_template_selected',
    'export_template_used',
    'marketplace_item_viewed',
    'marketplace_item_unlocked',
    'admin_content_published',
    'moderation_decision_saved'
  ]),
  userId: z.string().nullable(),
  entityId: z.string(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.string(), z.unknown()).default({})
});

export type ContentItem = z.infer<typeof contentItemSchema>;
export type NarratorPrompt = z.infer<typeof narratorPromptSchema>;
export type StoryTemplate = z.infer<typeof storyTemplateSchema>;
export type RitualTemplate = z.infer<typeof ritualTemplateSchema>;
export type MarketplaceItem = z.infer<typeof marketplaceItemSchema>;
export type CreatorSubmission = z.infer<typeof creatorSubmissionSchema>;
export type ModerationQueueItem = z.infer<typeof moderationQueueSchema>;
export type PublishingRelease = z.infer<typeof publishingReleaseSchema>;
export type ContentVersion = z.infer<typeof contentVersionSchema>;
export type ExportTemplate = z.infer<typeof exportTemplateSchema>;
export type UserContentEntitlement = z.infer<typeof userContentEntitlementSchema>;
export type TelemetryEvent = z.infer<typeof telemetryEventSchema>;
