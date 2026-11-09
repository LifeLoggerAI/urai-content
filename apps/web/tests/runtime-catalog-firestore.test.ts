import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContentItem } from '../../../src/schemas/content';

const serviceMocks = vi.hoisted(() => ({
  listPublishedCatalogPage: vi.fn(),
  getPublishedContentBySlug: vi.fn()
}));

vi.mock('../src/server/content/service', () => ({
  getRuntimeContentMode: () => 'firestore',
  createRuntimeContentService: () => ({
    listPublishedCatalogPage: serviceMocks.listPublishedCatalogPage,
    getPublishedContentBySlug: serviceMocks.getPublishedContentBySlug
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
    serviceMocks.listPublishedCatalogPage.mockReset();
    serviceMocks.getPublishedContentBySlug.mockReset();
    const rows = [
      makeContentItem({ id: 'published-public', slug: '/published-public', title: 'Published Public' }),
      makeContentItem({ id: 'published-unlisted', slug: '/published-unlisted', title: 'Published Unlisted', visibility: 'unlisted' }),
    ];
    // Anonymous catalog listing is public-only. Direct slug reads may still
    // resolve published unlisted demo records when a caller knows the link.
    serviceMocks.listPublishedCatalogPage.mockResolvedValue({ items: rows.filter(item => item.visibility === 'public'), nextCursor: null });
    serviceMocks.getPublishedContentBySlug.mockImplementation(async (slug: string) => rows.find((item) => item.slug === '/' + slug.replace(/^\//, '')) ?? null);
  });

  it('lists only content returned by the published-content service guard', async () => {
    const catalog = await listRuntimeCatalogSummaries();

    expect(catalog.source).toBe('firestore-ready');
    expect(serviceMocks.listPublishedCatalogPage).toHaveBeenCalledWith({});
    expect(catalog.nextCursor).toBeNull();
    expect(catalog.items.map((item) => item.id)).toEqual(['published-public']);
    expect(JSON.stringify(catalog)).not.toContain('published-unlisted');
  });

  it('finds Firestore-backed content detail through the published-content service guard', async () => {
    const catalog = await getRuntimeCatalogItemBySlug('published-unlisted');

    expect(catalog.source).toBe('firestore-ready');
    expect(catalog.item?.id).toBe('published-unlisted');
    expect(catalog.item?.visibility).toBe('demo');
    expect(serviceMocks.getPublishedContentBySlug).toHaveBeenCalledWith('published-unlisted');
  });
});
