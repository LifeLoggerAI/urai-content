import { z } from 'zod';

export const statusSchema = z.enum(['live', 'demo', 'prototype', 'planned', 'internal', 'archived']);
export const visibilitySchema = z.enum(['public', 'demo', 'internal']);

export const contentItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: z.string().min(1),
  status: statusSchema,
  visibility: visibilitySchema,
  updatedAt: z.string().datetime(),
  tags: z.array(z.string()),
  relatedSystem: z.string().min(1),
  sections: z.array(z.object({ heading: z.string(), body: z.string() })).default([]),
  cta: z.object({ label: z.string(), href: z.string() }).optional(),
  assetAvailability: z.enum(['ready', 'unavailable']).optional(),
  path: z.string().optional()
}).superRefine((item, context) => {
  if (item.assetAvailability === 'unavailable' && item.path !== undefined) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['path'], message: 'Unavailable assets must omit their deliverable path.' });
  }
  if (item.assetAvailability === 'ready' && !item.path) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['path'], message: 'Ready assets require a deliverable path.' });
  }
});

export type CanonicalContentItem = z.infer<typeof contentItemSchema>;

export const spritePreviewSchema = z.object({
  id: z.string().min(1),
  spriteId: z.string().min(1),
  assetAvailability: z.enum(['ready', 'unavailable']).default('ready'),
  previewPath: z.string().min(1).optional()
}).superRefine((preview, context) => {
  if (preview.assetAvailability === 'unavailable' && preview.previewPath !== undefined) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['previewPath'], message: 'Unavailable previews must omit their deliverable path.' });
  }
  if (preview.assetAvailability === 'ready' && !preview.previewPath) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['previewPath'], message: 'Ready previews require a deliverable path.' });
  }
});
