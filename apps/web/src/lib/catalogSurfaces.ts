export const mediaCatalogSurfaces = [
  { name: 'Motion', route: '/motion', tag: 'motion' },
  { name: 'Cinema', route: '/cinema', tag: 'cinema' },
  { name: 'Music', route: '/music', tag: 'music' },
  { name: 'Visuals', route: '/visuals', tag: 'visuals' },
  { name: 'Drops', route: '/drops', tag: 'drops' },
  { name: 'Series', route: '/series', tag: 'series' }
] as const;

export type MediaCatalogSurface = (typeof mediaCatalogSurfaces)[number];

export function selectMediaCatalogItems<T extends { tags: string[]; status: string; visibility: string }>(
  items: T[],
  surface: MediaCatalogSurface
): T[] {
  return items.filter((item) =>
    item.status === 'live' &&
    item.visibility === 'public' &&
    item.tags.some((tag) => tag.trim().toLowerCase() === surface.tag)
  );
}
