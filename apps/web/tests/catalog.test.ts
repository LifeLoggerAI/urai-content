import { describe, expect, it } from 'vitest';
import React from 'react';
import { catalogItemApiPath, getCatalogItemBySlug, listCatalogItems, normalizeSlug, summarizeCatalogItem } from '../src/lib/catalog';
import ContentPage from '../src/app/content/page';

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

  it('renders the slashless demo slug as a reachable API record link', () => {
    const hrefs: string[] = [];
    function visit(node: unknown): void {
      if (Array.isArray(node)) { node.forEach(visit); return; }
      if (!node || typeof node !== 'object' || !('props' in node)) return;
      const element = node as { type: unknown; props: { href?: string; children?: unknown } };
      if (element.type === 'a' && element.props.href) hrefs.push(element.props.href);
      visit(element.props.children);
    }
    // The Node test transform can use classic JSX; Next uses its own JSX runtime.
    const jsxHost = globalThis as typeof globalThis & { React?: typeof React };
    const previousReact = jsxHost.React;
    jsxHost.React = React;
    try { visit(ContentPage()); }
    finally {
      if (previousReact === undefined) delete jsxHost.React;
      else jsxHost.React = previousReact;
    }
    expect(hrefs).toContain('/api/content/celestial-ui-pack');
    expect(hrefs).toContain('/api/content');
    expect(hrefs).not.toContain('/api/contentcelestial-ui-pack');
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
      visibility: 'public'
    });
    expect('sections' in summary).toBe(false);
  });
});
