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
    // Anonymous Firestore direct details now require an explicitly indexed
    // and approved public record. Published-unlisted is held until a separate
    // reviewed link-share grant exists.
    serviceMocks.listPublishedCatalogPage.mockResolvedValue({ items: rows.filter(item => item.visibility === 'public'), nextCursor: null });
    serviceMocks.getPublishedContentBySlug.mockImplementation(async (slug: string) => rows.find((item) => item.visibility === 'public' && item.slug === '/' + slug.replace(/^\//, '')) ?? null);
  });

  it('lists only content returned by the published-content service guard', async () => {
    const catalog = await listRuntimeCatalogSummaries();

    expect(catalog.source).toBe('firestore-ready');
    expect(serviceMocks.listPublishedCatalogPage).toHaveBeenCalledWith({});
    expect(catalog.nextCursor).toBeNull();
    expect(catalog.items.map((item) => item.id)).toEqual(['published-public']);
    expect(JSON.stringify(catalog)).not.toContain('published-unlisted');
  });

  it('holds unlisted Firestore-backed direct details without independent publication authorization', async () => {
    const catalog = await getRuntimeCatalogItemBySlug('published-unlisted');
    expect(catalog.source).toBe('firestore-ready');
    expect(catalog.item).toBeNull();
    expect(serviceMocks.getPublishedContentBySlug).toHaveBeenCalledWith('published-unlisted');
  });

  it('still maps a separately approved public item through the public content service', async () => {
    const catalog = await getRuntimeCatalogItemBySlug('published-public');
    expect(catalog.item?.id).toBe('published-public');
    expect(catalog.item?.visibility).toBe('public');
  });
});
