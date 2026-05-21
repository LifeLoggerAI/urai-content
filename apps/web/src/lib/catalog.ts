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

const embeddedCatalogItems: CatalogItem[] = [
  {
    id: 'page-home',
    title: 'URAI Content Home',
    slug: '/',
    summary: 'URAI public content hub for launch-safe product, privacy, demo, and data ownership surfaces.',
    status: 'live',
    visibility: 'public',
    updatedAt: '2026-05-16T00:00:00.000Z',
    tags: ['public', 'home', 'urai'],
    relatedSystem: 'urai-content',
    sections: [
      {
        heading: 'Public launch surface',
        body: 'This embedded fallback keeps the deployed web app available when the canonical content directory is not bundled by the deployment provider.'
      }
    ],
    cta: { label: 'Join the Waitlist', href: '/waitlist' }
  },
  {
    id: 'page-privacy',
    title: 'URAI Privacy',
    slug: '/privacy',
    summary: 'URAI privacy principles for consent-first passive personal intelligence and user-controlled data.',
    status: 'live',
    visibility: 'public',
    updatedAt: '2026-05-16T00:00:00.000Z',
    tags: ['privacy', 'consent', 'public'],
    relatedSystem: 'urai-privacy',
    sections: [
      {
        heading: 'Consent-first design',
        body: 'URAI public content describes privacy, user control, and non-diagnostic reflection without exposing private internal content.'
      }
    ]
  },
  {
    id: 'demo-weekly-scrolls',
    title: 'Weekly Scroll Demo',
    slug: '/demo/weekly-scrolls',
    summary: 'Public-safe sample of weekly memory and reflection content for the URAI demo catalog.',
    status: 'demo',
    visibility: 'demo',
    updatedAt: '2026-05-16T00:00:00.000Z',
    tags: ['demo', 'weekly-scroll'],
    relatedSystem: 'urai-demo',
    sections: [
      {
        heading: 'Demo content',
        body: 'Sample demo entry for testing catalog APIs without requiring file-system content during hosted builds.'
      }
    ],
    cta: { label: 'Request Demo', href: '/demo' }
  },
  {
    id: 'demo-life-map-events',
    title: 'Life Map Events Demo',
    slug: '/demo/life-map-events',
    summary: 'Public-safe sample of symbolic life map events for the URAI demo catalog.',
    status: 'demo',
    visibility: 'demo',
    updatedAt: '2026-05-16T00:00:00.000Z',
    tags: ['demo', 'life-map'],
    relatedSystem: 'urai-demo',
    sections: [
      {
        heading: 'Life map sample',
        body: 'Demo-only life map catalog content for hosted route and API verification.'
      }
    ]
  },
  {
    id: 'demo-council-reflections',
    title: 'Council Reflections Demo',
    slug: '/demo/council-reflections',
    summary: 'Public-safe sample of Council reflection content for the URAI demo catalog.',
    status: 'demo',
    visibility: 'demo',
    updatedAt: '2026-05-16T00:00:00.000Z',
    tags: ['demo', 'council'],
    relatedSystem: 'urai-demo',
    sections: [
      {
        heading: 'Council sample',
        body: 'Demo-only Council reflection content for hosted route and API verification.'
      }
    ]
  }
];

function findContentRoot(): string | null {
  const candidates = [
    resolve(process.cwd(), 'content'),
    resolve(process.cwd(), '..', '..', 'content')
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function readJsonFile(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [value];
}

function loadFileBackedCatalogItems(contentRoot: string): CatalogItem[] {
  return contentFiles
    .flatMap((file) => toArray(readJsonFile(join(contentRoot, file))))
    .map((item) => canonicalContentItemSchema.parse(item));
}

export function listCatalogItems(): CatalogItem[] {
  const contentRoot = findContentRoot();
  const items = contentRoot ? loadFileBackedCatalogItems(contentRoot) : embeddedCatalogItems;

  return items
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
