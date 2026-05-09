export const implementedPublicRoutes = [
  '/',
  '/about',
  '/content',
  '/roadmap',
  '/privacy',
  '/pricing',
  '/contact'
] as const;

export type ImplementedPublicRoute = (typeof implementedPublicRoutes)[number];
