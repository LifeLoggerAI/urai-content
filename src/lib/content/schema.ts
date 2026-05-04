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
  path: z.string().optional()
});

export type CanonicalContentItem = z.infer<typeof contentItemSchema>;