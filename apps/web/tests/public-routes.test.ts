import { describe, expect, it } from 'vitest';
import { implementedPublicRoutes } from '../src/lib/publicRoutes';

describe('implemented public routes', () => {
  it('tracks the currently implemented public surface', () => {
    expect(implementedPublicRoutes).toEqual([
      '/',
      '/about',
      '/content',
      '/roadmap',
      '/privacy',
      '/pricing',
      '/contact'
    ]);
  });

  it('does not include protected routes in the public manifest', () => {
    expect(implementedPublicRoutes.some((route) => route.startsWith('/admin'))).toBe(false);
    expect(implementedPublicRoutes.some((route) => route.startsWith('/dashboard'))).toBe(false);
  });
});
