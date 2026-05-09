import { describe, expect, it } from 'vitest';
import { getCatalogItemBySlug, listCatalogItems, normalizeSlug, summarizeCatalogItem } from '../src/lib/catalog';

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

  it('finds the root home item and privacy item by slug', () => {
    expect(getCatalogItemBySlug('/')?.id).toBe('page-home');
    expect(getCatalogItemBySlug('privacy')?.id).toBe('page-privacy');
  });

  it('returns null for missing or non-public content', () => {
    expect(getCatalogItemBySlug('missing-content-item')).toBeNull();
  });

  it('summarizes catalog items without sections', () => {
    const item = getCatalogItemBySlug('/');
    expect(item).not.toBeNull();

    const summary = summarizeCatalogItem(item!);
    expect(summary).toMatchObject({
      id: 'page-home',
      slug: '/',
      visibility: 'public'
    });
    expect('sections' in summary).toBe(false);
  });
});
