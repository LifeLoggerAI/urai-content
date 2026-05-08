import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { z } from 'zod';

const canonicalContentItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: z.string().min(1),
  status: z.enum(['live', 'demo', 'prototype', 'planned', 'internal', 'archived']),
  visibility: z.enum(['public', 'demo', 'internal']),
  updatedAt: z.string().datetime(),
  tags: z.array(z.string()),
  relatedSystem: z.string().min(1),
  sections: z.array(z.object({ heading: z.string(), body: z.string() })).default([]),
  cta: z.object({ label: z.string(), href: z.string() }).optional(),
  path: z.string().optional()
});

export type CatalogItem = z.infer<typeof canonicalContentItemSchema>;

const contentFiles = [
  'pages/home.json',
  'pages/privacy.json',
  'demo/weekly-scrolls.json',
  'demo/life-map-events.json',
  'demo/council-reflections.json',
  'sprites/sprite-packs.json'
] as const;

function findContentRoot(): string {
  const candidates = [
    resolve(process.cwd(), 'content'),
    resolve(process.cwd(), '..', '..', 'content')
  ];

  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error('Unable to locate canonical content directory. Run the web app from the repo root or apps/web.');
  }

  return found;
}

function readJsonFile(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [value];
}

export function listCatalogItems(): CatalogItem[] {
  const contentRoot = findContentRoot();
  return contentFiles
    .flatMap((file) => toArray(readJsonFile(join(contentRoot, file))))
    .map((item) => canonicalContentItemSchema.parse(item))
    .filter((item) => item.visibility === 'public' || item.visibility === 'demo')
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export function getCatalogItemBySlug(slug: string): CatalogItem | null {
  const normalized = normalizeSlug(slug);
  return listCatalogItems().find((item) => normalizeSlug(item.slug) === normalized) ?? null;
}

export function normalizeSlug(slug: string): string {
  if (!slug || slug === '/') return '/';
  return `/${slug.replace(/^\/+|\/+$/g, '')}`;
}

export function summarizeCatalogItem(item: CatalogItem) {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    status: item.status,
    visibility: item.visibility,
    updatedAt: item.updatedAt,
    tags: item.tags,
    relatedSystem: item.relatedSystem,
    cta: item.cta ?? null
  };
}
