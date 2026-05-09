import type { MetadataRoute } from 'next';
import { webEnv } from '@/lib/env';

const routes = ['/', '/about', '/content', '/roadmap', '/privacy', '/pricing', '/contact'];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return routes.map((route) => ({
    url: `${webEnv.NEXT_PUBLIC_SITE_URL}${route === '/' ? '' : route}`,
    lastModified: now,
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : 0.7
  }));
}
