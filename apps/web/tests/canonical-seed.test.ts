import { describe, expect, it } from 'vitest';
import { InMemoryContentRepository } from '../src/server/content/inMemoryRepository';
import {
  catalogItemToContentItem,
  listCanonicalSeedContentItems,
  seedCanonicalContent
} from '../src/server/content/canonicalSeed';
import type { CatalogItem } from '../src/lib/catalog';

function makeCatalogItem(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: 'page-demo',
    title: 'Demo Page',
    slug: '/demo-page',
    summary: 'A demo summary.',
    status: 'live',
    visibility: 'public',
    updatedAt: '2026-05-01T00:00:00.000Z',
    tags: ['story'],
    relatedSystem: 'URAI Content',
    sections: [{ heading: 'Section', body: 'Body copy.' }],
    ...overrides
  };
}

describe('canonical content seeding', () => {
  it('maps canonical public live content to published ContentItem records', () => {
    const item = catalogItemToContentItem(makeCatalogItem());

    expect(item).toMatchObject({
      id: 'page-demo',
      slug: '/demo-page',
      title: 'Demo Page',
      status: 'published',
      visibility: 'public',
      contentType: 'story',
      createdBy: 'canonical-json',
      sourceLabel: 'URAI Content'
    });
    expect(item.body).toContain('A demo summary.');
    expect(item.body).toContain('Section');
    expect(item.safetyNotes).toContain('canonical-json-seed');
  });

  it('maps demo and internal visibility safely', () => {
    expect(catalogItemToContentItem(makeCatalogItem({ visibility: 'demo' })).visibility).toBe('unlisted');
    expect(catalogItemToContentItem(makeCatalogItem({ visibility: 'internal' })).visibility).toBe('private');
  });

  it('maps canonical lifecycle statuses to workflow statuses', () => {
    expect(catalogItemToContentItem(makeCatalogItem({ status: 'live' })).status).toBe('published');
    expect(catalogItemToContentItem(makeCatalogItem({ status: 'demo' })).status).toBe('published');
    expect(catalogItemToContentItem(makeCatalogItem({ status: 'prototype' })).status).toBe('review');
    expect(catalogItemToContentItem(makeCatalogItem({ status: 'planned' })).status).toBe('draft');
    expect(catalogItemToContentItem(makeCatalogItem({ status: 'internal' })).status).toBe('draft');
    expect(catalogItemToContentItem(makeCatalogItem({ status: 'archived' })).status).toBe('archived');
  });

  it('loads canonical seed items from the repository content tree', () => {
    const items = listCanonicalSeedContentItems();

    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.safetyNotes.includes('canonical-json-seed'))).toBe(true);
  });

  it('upserts canonical content and versions into a repository', async () => {
    const repo = new InMemoryContentRepository();
    const result = await seedCanonicalContent(repo);

    expect(result.count).toBeGreaterThan(0);
    const content = await repo.getContent(result.ids[0]!);
    expect(content).not.toBeNull();
    expect(await repo.listVersions(result.ids[0]!)).toHaveLength(1);
  });
});
