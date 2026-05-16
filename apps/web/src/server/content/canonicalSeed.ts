import 'server-only';
import type { ContentItem, ContentRepository } from './types';
import { listCatalogItems, normalizeSlug, type CatalogItem } from '@/lib/catalog';

function canonicalStatusToWorkflowStatus(status: CatalogItem['status']): ContentItem['status'] {
  if (status === 'archived') return 'archived';
  if (status === 'live' || status === 'demo') return 'published';
  if (status === 'prototype') return 'review';
  return 'draft';
}

function canonicalVisibilityToContentVisibility(visibility: CatalogItem['visibility']): ContentItem['visibility'] {
  if (visibility === 'internal') return 'private';
  if (visibility === 'demo') return 'unlisted';
  return 'public';
}

function inferContentType(item: CatalogItem): ContentItem['contentType'] {
  const tags = new Set(item.tags.map((tag) => tag.toLowerCase()));
  const slug = normalizeSlug(item.slug);

  if (tags.has('ritual') || slug.includes('ritual')) return 'ritual';
  if (tags.has('story') || slug.includes('story')) return 'story';
  if (tags.has('marketplace') || slug.includes('marketplace')) return 'marketplace';
  if (tags.has('export') || slug.includes('export')) return 'export';
  return 'narrator';
}

function renderBody(item: CatalogItem): string {
  const sections = item.sections.map((section) => `${section.heading}\n\n${section.body}`).join('\n\n');
  return [item.summary, sections].filter(Boolean).join('\n\n');
}

export function catalogItemToContentItem(item: CatalogItem): ContentItem {
  return {
    id: item.id,
    slug: normalizeSlug(item.slug),
    title: item.title,
    body: renderBody(item),
    tags: item.tags,
    locale: 'en-US',
    status: canonicalStatusToWorkflowStatus(item.status),
    visibility: canonicalVisibilityToContentVisibility(item.visibility),
    createdBy: 'canonical-json',
    updatedAt: item.updatedAt,
    createdAt: item.updatedAt,
    sourceLabel: item.relatedSystem,
    whyShownCopy: `Canonical ${item.visibility} content from ${item.relatedSystem}.`,
    safetyNotes: ['non-clinical', 'canonical-json-seed'],
    contentType: inferContentType(item)
  };
}

export function listCanonicalSeedContentItems(): ContentItem[] {
  return listCatalogItems().map(catalogItemToContentItem);
}

export async function seedCanonicalContent(repository: ContentRepository): Promise<{ count: number; ids: string[] }> {
  const items = listCanonicalSeedContentItems();

  for (const item of items) {
    await repository.upsertContent(item);
    await repository.addVersion(item.id, item);
  }

  return {
    count: items.length,
    ids: items.map((item) => item.id)
  };
}
