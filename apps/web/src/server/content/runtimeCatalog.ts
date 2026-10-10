import 'server-only';
import type { ContentItem } from './types';
import { listCatalogItems, getCatalogItemBySlug, normalizeSlug, summarizeCatalogItem, type CatalogItem } from '@/lib/catalog';
import { getCatalogSourceDescription, getCatalogSourceMode } from './catalogSource';
import { createRuntimeContentService, getRuntimeContentMode } from './service';
import { paginateSorted, type PageRequest } from '../../../../../src/query/pagination.js';

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

export async function listRuntimeCatalogSummaries(request: PageRequest = {}): Promise<{
  source: ReturnType<typeof getCatalogSourceMode>;
  sourceDescription: string;
  items: RuntimeCatalogSummary[];
  nextCursor: string | null;
}> {
  if (getRuntimeContentMode() === 'firestore') {
    const page = await createRuntimeContentService().listPublishedCatalogPage(request);
    return {
      source: getCatalogSourceMode(),
      sourceDescription: getCatalogSourceDescription(),
      items: page.items.map(contentItemToCatalogItem).map(summarizeCatalogItem),
      nextCursor: page.nextCursor
    };
  }

  const page = paginateSorted(listCatalogItems().sort((a, b) => Buffer.compare(Buffer.from(a.id), Buffer.from(b.id))), { ...request, limit: request.limit ?? 100 }, (item) => ({ sortValue: item.id, id: item.id }));
  return {
    source: getCatalogSourceMode(),
    sourceDescription: getCatalogSourceDescription(),
    items: page.items.map(summarizeCatalogItem),
    nextCursor: page.nextCursor
  };
}

export async function getRuntimeCatalogItemBySlug(slug: string): Promise<{
  source: ReturnType<typeof getCatalogSourceMode>;
  sourceDescription: string;
  item: CatalogItem | null;
}> {
  if (getRuntimeContentMode() === 'firestore') {
    const item = await createRuntimeContentService().getPublishedContentBySlug(slug);
    return {
      source: getCatalogSourceMode(),
      sourceDescription: getCatalogSourceDescription(),
      item: item ? contentItemToCatalogItem(item) : null
    };
  }

  return {
    source: getCatalogSourceMode(),
    sourceDescription: getCatalogSourceDescription(),
    item: getCatalogItemBySlug(slug)
  };
}
