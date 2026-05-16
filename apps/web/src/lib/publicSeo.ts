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
  return route
    .slice(1)
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function makeSeo(route: ImplementedPublicRoute, title = titleizeRoute(route), description?: string): PublicSeoMetadata {
  const finalDescription =
    description ??
    `Explore ${title} on the URAI public site, a privacy-first personal intelligence platform for passive life data, emotional timelines, cognitive mirrors, and user-controlled data.`;

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
    'URAI — A Privacy-First Life Operating System',
    'URAI helps you understand your life through passive, privacy-first personal intelligence, emotional timelines, cognitive mirrors, and user-controlled data ownership.'
  ),
  '/about': makeSeo(
    '/about',
    'About URAI Labs',
    'Learn why URAI Labs is building a passive, privacy-first life operating system for personal intelligence and user-owned data.'
  ),
  '/product': makeSeo(
    '/product',
    'Product',
    'Explore URAI features including passive capture, Cognitive Mirror, Emotional Timeline, Memory Map, Council Companion, and data ownership.'
  ),
  '/how-it-works': makeSeo(
    '/how-it-works',
    'How URAI Works',
    'See how URAI turns permission-based life signals into private reflections, emotional timelines, and user-controlled insights.'
  ),
  '/privacy': makeSeo(
    '/privacy',
    'Privacy',
    'URAI privacy principles: consent-first access, user control, transparency, export/delete controls, and non-medical reflection.'
  ),
  '/data-ownership': makeSeo(
    '/data-ownership',
    'Data Ownership',
    'Learn how URAI approaches user-controlled data, optional data participation, transparency, and consent.'
  ),
  '/demo': makeSeo(
    '/demo',
    'Demo',
    'Preview URAI with public-safe sample data across Cognitive Mirror, Emotional Timeline, Memory Map, and Council reflections.'
  ),
  '/waitlist': makeSeo(
    '/waitlist',
    'Waitlist',
    'Join the URAI waitlist for early access to passive personal intelligence, Cognitive Mirror, Emotional Timeline, and data ownership tools.'
  ),
  '/terms': makeSeo(
    '/terms',
    'Terms and Disclaimer',
    'URAI legal and safety disclaimer covering non-medical insights, crisis support boundaries, and optional data participation.'
  ),
  '/contact': makeSeo(
    '/contact',
    'Contact',
    'Contact URAI Labs for demo access, investor interest, partnerships, research collaboration, press, or general questions.'
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
