import { implementedPublicRoutes, type ImplementedPublicRoute } from './publicRoutes';

export type PublicSeoMetadata = {
  route: ImplementedPublicRoute;
  title: string;
  description: string;
  canonical: ImplementedPublicRoute;
  openGraph: {
    title: string;
    description: string;
  };
};

function titleizeRoute(route: ImplementedPublicRoute): string {
  if (route === '/') return 'URAI';

  const title = route
    .slice(1)
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return title.trim().length >= 4 ? title : `URAI ${title}`;
}

function makeSeo(route: ImplementedPublicRoute, title = titleizeRoute(route), description?: string): PublicSeoMetadata {
  const finalDescription =
    description ??
    `Explore ${title} in URAI, a private personal-intelligence experience for memory, reflection, relationships, and user-controlled data.`;

  return {
    route,
    title,
    description: finalDescription,
    canonical: route,
    openGraph: {
      title,
      description: finalDescription
    }
  };
}

const overrides: Partial<Record<ImplementedPublicRoute, PublicSeoMetadata>> = {
  '/': makeSeo(
    '/',
    'URAI — Your private world',
    'URAI brings memory, reflection, relationships, and personal context into a private experience designed to stay understandable and under your control.'
  ),
  '/about': makeSeo(
    '/about',
    'About URAI Labs',
    'Learn why URAI Labs is building private personal intelligence that returns useful context and control to the person living the life.'
  ),
  '/product': makeSeo(
    '/product',
    'Product',
    'Explore URAI experiences including the Cognitive Mirror, Emotional Timeline, Life Map, Council, and user-controlled data permissions.'
  ),
  '/how-it-works': makeSeo(
    '/how-it-works',
    'How URAI Works',
    'See how permissioned life signals can become private reflections, timelines, memory experiences, and user-controlled insights.'
  ),
  '/privacy': makeSeo(
    '/privacy',
    'Privacy',
    'Review URAI privacy principles for consent, transparency, access, export, deletion, and non-medical personal reflection.'
  ),
  '/data-ownership': makeSeo(
    '/data-ownership',
    'Data Control',
    'Learn how URAI approaches permissions, provenance, user-controlled data, optional participation, transparency, and consent.'
  ),
  '/demo': makeSeo(
    '/demo',
    'URAI Experience',
    'Explore a public-safe URAI experience without exposing real private user data.'
  ),
  '/waitlist': makeSeo(
    '/waitlist',
    'Early Access',
    'Join URAI early access for a private personal-intelligence experience built around memory, reflection, relationships, and user control.'
  ),
  '/terms': makeSeo(
    '/terms',
    'Terms and Disclaimer',
    'Review URAI legal and safety boundaries for non-medical insights, crisis support, optional participation, and product use.'
  ),
  '/contact': makeSeo(
    '/contact',
    'Contact',
    'Contact URAI Labs about product access, investment, partnerships, research, press, or general questions.'
  )
};

export const publicSeoMetadata: Record<ImplementedPublicRoute, PublicSeoMetadata> =
  Object.fromEntries(
    implementedPublicRoutes.map((route) => [route, overrides[route] ?? makeSeo(route)])
  ) as Record<ImplementedPublicRoute, PublicSeoMetadata>;

export function getPublicSeoMetadata(route: ImplementedPublicRoute): PublicSeoMetadata {
  return publicSeoMetadata[route];
}

export function listPublicSeoMetadata(): PublicSeoMetadata[] {
  return implementedPublicRoutes.map((route) => getPublicSeoMetadata(route));
}
