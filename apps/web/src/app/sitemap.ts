import type { MetadataRoute } from 'next';
import { publicPages } from '@/lib/publicSiteContent';
import { webEnv } from '@/lib/env';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return Object.values(publicPages).map((page) => ({
    url: new URL(page.route, webEnv.NEXT_PUBLIC_SITE_URL).toString(),
    lastModified: now,
    changeFrequency: page.route === '/' ? 'weekly' : 'monthly',
    priority: page.route === '/' ? 1 : 0.7
  }));
}
