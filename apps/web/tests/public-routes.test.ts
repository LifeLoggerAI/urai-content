import { describe, expect, it } from 'vitest';
import { implementedPublicRoutes } from '../src/lib/publicRoutes';

const plannedPublicRoutes = [
  '/',
  '/about',
  '/content',
  '/stories',
  '/rituals',
  '/narrator',
  '/voice-packs',
  '/marketplace',
  '/creator',
  '/pricing',
  '/licensing',
  '/exports',
  '/demo',
  '/roadmap',
  '/versions',
  '/privacy',
  '/terms',
  '/contact'
] as const;

describe('implemented public routes', () => {
  it('tracks the planned public route shell surface', () => {
    expect(implementedPublicRoutes).toEqual(plannedPublicRoutes);
  });

  it('does not contain duplicate routes', () => {
    expect(new Set(implementedPublicRoutes).size).toBe(implementedPublicRoutes.length);
  });
});
