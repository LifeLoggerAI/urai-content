import { describe, expect, it } from 'vitest';
import { catalogItemApiPath, getCatalogItemBySlug, listCatalogItems, normalizeSlug, summarizeCatalogItem } from '../src/lib/catalog';

describe('web catalog loader', () => {
  it('loads public and demo canonical content items', () => {
    const items = listCatalogItems();

    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.visibility === 'public' || item.visibility === 'demo')).toBe(true);
    expect(items.map((item) => item.slug)).toEqual([...items.map((item) => item.slug)].sort((a, b) => a.localeCompare(b)));
  });

  it('normalizes root and nested slugs', () => {
    expect(normalizeSlug('')).toBe('/');
    expect(normalizeSlug('/')).toBe('/');
    expect(normalizeSlug('privacy')).toBe('/privacy');
    expect(normalizeSlug('/privacy/')).toBe('/privacy');
  });

  it('builds the same content API route with or without a leading slash', () => {
    expect(catalogItemApiPath('celestial-ui-pack')).toBe('/api/content/celestial-ui-pack');
    expect(catalogItemApiPath('/celestial-ui-pack')).toBe('/api/content/celestial-ui-pack');
    expect(catalogItemApiPath('/privacy/')).toBe('/api/content/privacy');
    expect(catalogItemApiPath('/')).toBe('/api/content');
    expect(catalogItemApiPath('')).toBe('/api/content');
  });

  it('finds the root home item and privacy item by slug', () => {
    expect(getCatalogItemBySlug('/')?.id).toBe('page-home');
    expect(getCatalogItemBySlug('privacy')?.id).toBe('page-privacy');
  });

  it('returns null for missing or non-public content', () => {
    expect(getCatalogItemBySlug('missing-content-item')).toBeNull();
  });

  it('discloses the unavailable demo sprite without a deliverable path', () => {
    const item = getCatalogItemBySlug('celestial-ui-pack');
    expect(item).toMatchObject({ status: 'demo', assetAvailability: 'unavailable' });
    expect(item?.summary).toContain('unavailable');
    expect(item).not.toHaveProperty('path');
    expect(summarizeCatalogItem(item!)).toMatchObject({ assetAvailability: 'unavailable' });
  });

  it('summarizes catalog items without sections', () => {
    const item = getCatalogItemBySlug('/');
    expect(item).not.toBeNull();

    const summary = summarizeCatalogItem(item!);
    expect(summary).toMatchObject({
      id: 'page-home',
      slug: '/',
      visibility: 'demo'
    });
    expect('sections' in summary).toBe(false);
  });
});
