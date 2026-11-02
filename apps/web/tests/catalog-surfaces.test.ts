import { describe, expect, it } from 'vitest';
import { mediaCatalogSurfaces, selectMediaCatalogItems } from '../src/lib/catalogSurfaces';

describe('adopted media catalog surfaces', () => {
  it('keeps every adopted named collection reachable', () => {
    expect(mediaCatalogSurfaces.map((surface) => surface.name)).toEqual(['Motion', 'Cinema', 'Music', 'Visuals', 'Drops', 'Series']);
    expect(new Set(mediaCatalogSurfaces.map((surface) => surface.route)).size).toBe(6);
  });

  it('selects only public published records with the exact collection tag', () => {
    const rows = [
      { id: 'accepted', tags: [' Motion '], status: 'live', visibility: 'public' },
      { id: 'other', tags: ['cinema'], status: 'live', visibility: 'public' },
      { id: 'private', tags: ['motion'], status: 'live', visibility: 'internal' },
      { id: 'unlisted', tags: ['motion'], status: 'live', visibility: 'demo' },
      { id: 'demo', tags: ['motion'], status: 'demo', visibility: 'demo' },
      { id: 'draft', tags: ['motion'], status: 'prototype', visibility: 'public' },
      { id: 'substring', tags: ['emotion'], status: 'live', visibility: 'public' }
    ];
    expect(selectMediaCatalogItems(rows, mediaCatalogSurfaces[0]).map((item) => item.id)).toEqual(['accepted']);
  });
});
