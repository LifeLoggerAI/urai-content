import 'server-only';
import type { ContentItem } from '../../../../../src/schemas/content';
import { listCatalogItems, getCatalogItemBySlug, normalizeSlug, summarizeCatalogItem, type CatalogItem } from '@/lib/catalog';
import { getCatalogSourceDescription, getCatalogSourceMode } from './catalogSource';
import { createRuntimeContentService, getRuntimeContentMode } from './service';

export type RuntimeCatalogSummary = ReturnType<typeof summarizeCatalogItem>;

function bodyToSummary(body: string): string {
  const firstParagraph = body.split(/\n\s*\n/).find((paragraph) => paragraph.trim().length > 0)?.trim();
  if (!firstParagraph) return 'Canonical URAI Content item.';
  return firstParagraph.length > 220 ? `${firstParagraph.slice(0, 217)}...` : firstParagraph;
}

function contentItemToCatalogItem(item: ContentItem): CatalogItem {
  return {
    id: item.id,
    title: item.title,
    slug: normalizeSlug(item.slug),
    summary: bodyToSummary(item.body),
    status: item.status === 'published' ? 'live' : item.status === 'archived' ? 'archived' : 'prototype',
    visibility: item.visibility === 'public' ? 'public' : item.visibility === 'unlisted' ? 'demo' : 'internal',
    updatedAt: item.updatedAt,
    tags: item.tags,
    relatedSystem: item.sourceLabel,
    sections: [{ heading: 'Body', body: item.body }]
  };
}

function isPublicRuntimeContent(item: ContentItem): boolean {
  return item.status === 'published' && (item.visibility === 'public' || item.visibility === 'unlisted');
}

async function listFirestoreCatalogItems(): Promise<CatalogItem[]> {
  const service = createRuntimeContentService();
  const items = await service.searchContent('', 'public');
  const unlistedItems = await service.searchContent('', 'unlisted');

  return [...items, ...unlistedItems]
    .filter(isPublicRuntimeContent)
    .map(contentItemToCatalogItem)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export async function listRuntimeCatalogSummaries(): Promise<{
  source: ReturnType<typeof getCatalogSourceMode>;
  sourceDescription: string;
  items: RuntimeCatalogSummary[];
}> {
  if (getRuntimeContentMode() === 'firestore') {
    const items = await listFirestoreCatalogItems();
    return {
      source: getCatalogSourceMode(),
      sourceDescription: getCatalogSourceDescription(),
      items: items.map(summarizeCatalogItem)
    };
  }

  return {
    source: getCatalogSourceMode(),
    sourceDescription: getCatalogSourceDescription(),
    items: listCatalogItems().map(summarizeCatalogItem)
  };
}

export async function getRuntimeCatalogItemBySlug(slug: string): Promise<{
  source: ReturnType<typeof getCatalogSourceMode>;
  sourceDescription: string;
  item: CatalogItem | null;
}> {
  if (getRuntimeContentMode() === 'firestore') {
    const normalized = normalizeSlug(slug);
    const items = await listFirestoreCatalogItems();
    return {
      source: getCatalogSourceMode(),
      sourceDescription: getCatalogSourceDescription(),
      item: items.find((item) => normalizeSlug(item.slug) === normalized) ?? null
    };
  }

  return {
    source: getCatalogSourceMode(),
    sourceDescription: getCatalogSourceDescription(),
    item: getCatalogItemBySlug(slug)
  };
}
