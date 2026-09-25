import 'server-only';
import { z } from 'zod';

export const runtimeContentContractVersion = '1.0.0';

export const contentItemSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  tags: z.array(z.string()),
  locale: z.string().default('en-US'),
  status: z.enum(['draft', 'review', 'approved', 'published', 'archived']),
  visibility: z.enum(['public', 'private', 'unlisted']),
  createdBy: z.string(),
  updatedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  sourceLabel: z.string(),
  whyShownCopy: z.string(),
  safetyNotes: z.array(z.string()),
  contentType: z.enum(['narrator', 'story', 'ritual', 'export', 'marketplace'])
});

export const creatorSubmissionSchema = z.object({
  id: z.string().min(1),
  creatorId: z.string().min(1),
  title: z.string().min(1).max(160),
  body: z.string().min(1).max(20000),
  contentType: z.enum(['story', 'ritual', 'narrator', 'marketplace', 'export']).default('story'),
  tags: z.array(z.string().min(1).max(64)).max(24).default([]),
  locale: z.string().min(2).max(32).default('en-US'),
  status: z.enum(['submitted', 'approved', 'rejected', 'changes_requested']),
  submittedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  moderationNotes: z.string().max(4000).nullable().optional(),
  moderatedAt: z.string().datetime().optional(),
  moderatedBy: z.string().nullable().optional(),
  sourceContentItemId: z.string().min(1).optional(),
  migrationSource: z.string().optional()
});

export const moderationQueueSchema = z.object({
  id: z.string().min(1),
  entityId: z.string().min(1),
  entityType: z.enum(['contentItem', 'marketplaceItem', 'creatorSubmission']),
  status: z.enum(['pending', 'approved', 'rejected', 'changes_requested']).default('pending'),
  reviewerId: z.string().nullable().optional(),
  decisionNotes: z.string().optional(),
  decision: z.enum(['submitted', 'approved', 'rejected', 'changes_requested']).optional(),
  notes: z.string().nullable().optional(),
  moderatedAt: z.string().datetime().optional(),
  moderatedBy: z.string().optional()
});

export const publishingReleaseSchema = z.object({
  id: z.string().min(1),
  contentItemIds: z.array(z.string().min(1)),
  releasedAt: z.string().datetime(),
  releasedBy: z.string().min(1),
  changelog: z.string()
});

export const narratorPromptSchema = z.object({
  id: z.string().min(1),
  tone: z.enum(['cinematic', 'calm', 'reflective', 'grounded']),
  prompt: z.string(),
  quietHoursSafe: z.boolean(),
  reflectionScript: z.string(),
  accessibilityCaption: z.string()
});

export const storyTemplateSchema = z.object({
  id: z.string().min(1),
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
  id: z.string().min(1),
  name: z.string(),
  instructions: z.array(z.string()),
  safetyClass: z.enum(['gentle', 'standard', 'sensitive']),
  eligibilitySignals: z.array(z.string()),
  reducedMotionAlternative: z.string()
});

export const marketplaceItemSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  creatorId: z.string(),
  moderationStatus: z.enum(['pending', 'approved', 'rejected']),
  tier: z.enum(['free', 'pro', 'paid']),
  priceUsd: z.number().nonnegative(),
  entitlementKey: z.string()
});

export const exportTemplateSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['weekly-recap', 'pdf-card', 'png-card', 'srt', 'capcut']),
  title: z.string(),
  sections: z.array(z.string()),
  failureRetryCopy: z.string()
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
  metadata: z.object({
    contentVersion: z.string().max(80).optional(),
    locale: z.string().max(32).optional(),
    surface: z.string().max(80).optional(),
    lifecycleStatus: z.enum(['draft','review','approved','published','archived']).optional(),
    contentType: z.enum(['narrator','story','ritual','export','marketplace']).optional(),
    sourceSystem: z.string().max(80).optional(),
    experimentKey: z.string().max(120).optional()
  }).strict().default({})
});

export const userContentEntitlementSchema = z.object({
  userId: z.string().min(1),
  entitlementKey: z.string().min(1),
  grantedBy: z.enum(['subscription', 'purchase', 'admin']),
  grantedAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable()
});

export const contentVersionRecordSchema = z.object({
  contentId: z.string().min(1),
  version: z.number().int().positive(),
  snapshot: contentItemSchema
});

export function parseRuntimeRecord<S extends z.ZodTypeAny>(schema: S, collection: string, value: unknown): z.output<S> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error('Invalid ' + collection + ' record: ' + result.error.issues.map((issue) => issue.path.join('.') + ' ' + issue.message).join('; '));
  }
  return result.data;
}
