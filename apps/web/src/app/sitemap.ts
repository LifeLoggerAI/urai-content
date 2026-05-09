import type { MetadataRoute } from 'next';
import { implementedPublicRoutes } from '@/lib/publicRoutes';
import { webEnv } from '@/lib/env';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return implementedPublicRoutes.map((route) => ({
    url: `${webEnv.NEXT_PUBLIC_SITE_URL}${route === '/' ? '' : route}`,
    lastModified: now,
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : 0.7
  }));
}
