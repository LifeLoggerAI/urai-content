import { describe, expect, it } from 'vitest';

import { implementedPublicRoutes } from '../src/lib/publicRoutes';
import { listPublicSeoMetadata, publicSeoMetadata } from '../src/lib/publicSeo';

describe('public SEO metadata contracts', () => {
  it('defines SEO metadata for every implemented public route', () => {
    expect(Object.keys(publicSeoMetadata).sort()).toEqual([...implementedPublicRoutes].sort());
  });

  it('uses canonical URLs that match implemented routes', () => {
    const routeSet = new Set(implementedPublicRoutes);

    for (const metadata of listPublicSeoMetadata()) {
      expect(routeSet.has(metadata.canonical)).toBe(true);
      expect(metadata.canonical).toBe(metadata.route);
    }
  });

  it('provides launch-safe titles and descriptions', () => {
    for (const metadata of listPublicSeoMetadata()) {
      expect(metadata.title.trim().length).toBeGreaterThanOrEqual(4);
      expect(metadata.description.trim().length).toBeGreaterThanOrEqual(40);
      expect(metadata.description).not.toMatch(/lorem|todo|placeholder|coming soon/i);
      expect(metadata.openGraph.title.trim().length).toBeGreaterThanOrEqual(4);
      expect(metadata.openGraph.description.trim().length).toBeGreaterThanOrEqual(30);
    }
  });
});
