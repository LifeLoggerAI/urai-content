import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContentItem } from '../../../src/schemas/content';

const serviceMocks = vi.hoisted(() => ({
  searchPublishedContent: vi.fn()
}));

vi.mock('../src/server/content/service', () => ({
  getRuntimeContentMode: () => 'firestore',
  createRuntimeContentService: () => ({
    searchPublishedContent: serviceMocks.searchPublishedContent
  })
}));

import { getRuntimeCatalogItemBySlug, listRuntimeCatalogSummaries } from '../src/server/content/runtimeCatalog';

function makeContentItem(overrides: Partial<ContentItem>): ContentItem {
  const now = new Date().toISOString();

  return {
    id: 'content-1',
    slug: 'content-one',
    title: 'Content One',
    body: 'Published content body.',
    tags: ['runtime'],
    locale: 'en-US',
    status: 'published',
    visibility: 'public',
    createdBy: 'admin',
    updatedAt: now,
    createdAt: now,
    sourceLabel: 'runtime-catalog-test',
    whyShownCopy: 'Because this is public content.',
    safetyNotes: ['non-clinical'],
    contentType: 'narrator',
    ...overrides
  };
}

describe('runtime catalog Firestore mode', () => {
  beforeEach(() => {
    serviceMocks.searchPublishedContent.mockReset();
    serviceMocks.searchPublishedContent.mockImplementation(async (_query: string, visibility: ContentItem['visibility']) => {
      if (visibility === 'public') {
        return [
          makeContentItem({ id: 'published-public', slug: 'published-public', title: 'Published Public' })
        ];
      }

      if (visibility === 'unlisted') {
        return [
          makeContentItem({
            id: 'published-unlisted',
            slug: 'published-unlisted',
            title: 'Published Unlisted',
            visibility: 'unlisted'
          })
        ];
      }

      return [];
    });
  });

  it('lists only content returned by the published-content service guard', async () => {
    const catalog = await listRuntimeCatalogSummaries();

    expect(catalog.source).toBe('firestore-ready');
    expect(serviceMocks.searchPublishedContent).toHaveBeenCalledWith('', 'public');
    expect(serviceMocks.searchPublishedContent).toHaveBeenCalledWith('', 'unlisted');
    expect(catalog.items.map((item) => item.id)).toEqual(['published-public', 'published-unlisted']);
  });

  it('finds Firestore-backed content detail through the published-content service guard', async () => {
    const catalog = await getRuntimeCatalogItemBySlug('published-unlisted');

    expect(catalog.source).toBe('firestore-ready');
    expect(catalog.item?.id).toBe('published-unlisted');
    expect(catalog.item?.visibility).toBe('demo');
  });
});
