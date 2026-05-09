export const implementedPublicRoutes = [
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

export type ImplementedPublicRoute = (typeof implementedPublicRoutes)[number];
