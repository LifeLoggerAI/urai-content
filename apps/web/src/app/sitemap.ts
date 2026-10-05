import type { MetadataRoute } from 'next';
import { publicPages } from '@/lib/publicSiteContent';
import { webEnv } from '@/lib/env';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [...Object.values(publicPages).map((page) => page.route), '/security', '/accessibility'];

  return [...new Set(routes)].map((route) => ({
    url: new URL(route, webEnv.NEXT_PUBLIC_SITE_URL).toString(),
    lastModified: now,
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : 0.7
  }));
}
