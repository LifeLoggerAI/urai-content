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

export const publicSeoMetadata: Record<ImplementedPublicRoute, PublicSeoMetadata> = {
  '/': {
    route: '/',
    title: 'URAI Content',
    description: 'The publishing and media engine for the URAI Emotional OS.',
    canonical: '/',
    openGraph: {
      title: 'URAI Content',
      description: 'The publishing and media engine for the URAI Emotional OS.'
    }
  },
  '/about': {
    route: '/about',
    title: 'About URAI Content',
    description: 'Learn how URAI Content packages stories, rituals, narrator scripts, exports, and licensing for the URAI ecosystem.',
    canonical: '/about',
    openGraph: {
      title: 'About URAI Content',
      description: 'Learn how URAI Content supports the URAI ecosystem.'
    }
  },
  '/content': {
    route: '/content',
    title: 'Content Catalog',
    description: 'Explore public-safe URAI Content catalog records and canonical content surfaces.',
    canonical: '/content',
    openGraph: {
      title: 'Content Catalog',
      description: 'Explore public-safe URAI Content catalog records.'
    }
  },
  '/stories': {
    route: '/stories',
    title: 'Stories',
    description: 'Story templates and narrative systems for URAI Content.',
    canonical: '/stories',
    openGraph: {
      title: 'Stories',
      description: 'Story templates and narrative systems for URAI Content.'
    }
  },
  '/rituals': {
    route: '/rituals',
    title: 'Rituals',
    description: 'Ritual templates and emotional practice content for URAI Content.',
    canonical: '/rituals',
    openGraph: {
      title: 'Rituals',
      description: 'Ritual templates and emotional practice content for URAI Content.'
    }
  },
  '/narrator': {
    route: '/narrator',
    title: 'Narrator',
    description: 'Narrator prompt systems for URAI Content.',
    canonical: '/narrator',
    openGraph: {
      title: 'Narrator',
      description: 'Narrator prompt systems for URAI Content.'
    }
  },
  '/voice-packs': {
    route: '/voice-packs',
    title: 'Voice Packs',
    description: 'Voice pack surfaces for URAI Content.',
    canonical: '/voice-packs',
    openGraph: {
      title: 'Voice Packs',
      description: 'Voice pack surfaces for URAI Content.'
    }
  },
  '/marketplace': {
    route: '/marketplace',
    title: 'Marketplace',
    description: 'Marketplace readiness surface for URAI Content.',
    canonical: '/marketplace',
    openGraph: {
      title: 'Marketplace',
      description: 'Marketplace readiness surface for URAI Content.'
    }
  },
  '/creator': {
    route: '/creator',
    title: 'Creator',
    description: 'Creator program surface for URAI Content.',
    canonical: '/creator',
    openGraph: {
      title: 'Creator',
      description: 'Creator program surface for URAI Content.'
    }
  },
  '/pricing': {
    route: '/pricing',
    title: 'Pricing',
    description: 'Review planned URAI Content tiers, access levels, and production launch boundaries.',
    canonical: '/pricing',
    openGraph: {
      title: 'Pricing',
      description: 'Review planned URAI Content tiers and access levels.'
    }
  },
  '/licensing': {
    route: '/licensing',
    title: 'Licensing',
    description: 'Licensing surface for URAI Content.',
    canonical: '/licensing',
    openGraph: {
      title: 'Licensing',
      description: 'Licensing surface for URAI Content.'
    }
  },
  '/exports': {
    route: '/exports',
    title: 'Exports',
    description: 'Export pipeline surface for URAI Content.',
    canonical: '/exports',
    openGraph: {
      title: 'Exports',
      description: 'Export pipeline surface for URAI Content.'
    }
  },
  '/demo': {
    route: '/demo',
    title: 'Demo',
    description: 'Public demo route for URAI Content.',
    canonical: '/demo',
    openGraph: {
      title: 'Demo',
      description: 'Public demo route for URAI Content.'
    }
  },
  '/roadmap': {
    route: '/roadmap',
    title: 'Roadmap',
    description: 'Track URAI Content phases, blockers, and production-readiness evidence.',
    canonical: '/roadmap',
    openGraph: {
      title: 'Roadmap',
      description: 'Track URAI Content phases and production-readiness evidence.'
    }
  },
  '/versions': {
    route: '/versions',
    title: 'Versions',
    description: 'Version and phase status for URAI Content.',
    canonical: '/versions',
    openGraph: {
      title: 'Versions',
      description: 'Version and phase status for URAI Content.'
    }
  },
  '/privacy': {
    route: '/privacy',
    title: 'Privacy',
    description: 'Review URAI Content privacy, data-rights, and production launch boundaries.',
    canonical: '/privacy',
    openGraph: {
      title: 'Privacy',
      description: 'Review URAI Content privacy and data-rights boundaries.'
    }
  },
  '/terms': {
    route: '/terms',
    title: 'Terms',
    description: 'Terms surface for URAI Content.',
    canonical: '/terms',
    openGraph: {
      title: 'Terms',
      description: 'Terms surface for URAI Content.'
    }
  },
  '/contact': {
    route: '/contact',
    title: 'Contact',
    description: 'Contact URAI Content about partnerships, licensing, creator workflows, and launch readiness.',
    canonical: '/contact',
    openGraph: {
      title: 'Contact',
      description: 'Contact URAI Content about partnerships and launch readiness.'
    }
  }
};

export function getPublicSeoMetadata(route: ImplementedPublicRoute): PublicSeoMetadata {
  return publicSeoMetadata[route];
}

export function listPublicSeoMetadata(): PublicSeoMetadata[] {
  return implementedPublicRoutes.map((route) => getPublicSeoMetadata(route));
}
