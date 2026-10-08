import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const catalog = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock('../src/server/content/runtimeCatalog', () => ({ listRuntimeCatalogSummaries: catalog.list }));

import { CatalogBrowser } from '../src/components/CatalogBrowser';
import { mediaCatalogSurfaces } from '../src/lib/catalogSurfaces';

const publicItem = { id: 'public', title: 'Published music', summary: 'Reviewed public record.', slug: '/music-record', tags: ['music'], status: 'live', visibility: 'public' };

describe('runtime catalog browsing', () => {
  beforeEach(() => catalog.list.mockReset());

  it('renders published matching records and keeps drafts, private and unlisted records out of public browsing', async () => {
    catalog.list.mockResolvedValue({ items: [
      publicItem,
      { ...publicItem, id: 'private', title: 'private-record', visibility: 'internal' },
      { ...publicItem, id: 'unlisted', title: 'unlisted-record', visibility: 'demo' },
      { ...publicItem, id: 'draft', title: 'draft-record', status: 'prototype', visibility: 'public' }
    ], nextCursor: null });
    const html = renderToStaticMarkup(await CatalogBrowser({ surface: mediaCatalogSurfaces[2] }));
    expect(html).toContain('Published music');
    expect(html).not.toContain('private-record');
    expect(html).not.toContain('unlisted-record');
    expect(html).not.toContain('draft-record');
    const all = renderToStaticMarkup(await CatalogBrowser({}));
    expect(all).not.toContain('unlisted-record');
    expect(all).not.toContain('draft-record');
  });

  it('passes the real cursor to the existing backend and preserves collection navigation', async () => {
    catalog.list.mockResolvedValue({ items: [], nextCursor: 'next&value/=' });
    const html = renderToStaticMarkup(await CatalogBrowser({ surface: mediaCatalogSurfaces[0], searchParams: Promise.resolve({ cursor: 'previous' }) }));
    expect(catalog.list).toHaveBeenCalledWith({ cursor: 'previous' });
    expect(html).toContain('/motion?cursor=next%26value%2F%3D');
    expect(html).toContain('No published motion items');
    expect(html).toContain('aria-current="page"');
  });

  it('renders a sanitized accessible runtime error without claiming an empty successful catalog', async () => {
    catalog.list.mockRejectedValue(new Error('private-provider-detail'));
    const html = renderToStaticMarkup(await CatalogBrowser({}));
    expect(html).toContain('role="alert"');
    expect(html).not.toContain('private-provider-detail');
    expect(html).not.toContain('No published');
  });
});
