import type { MetadataRoute } from 'next';
import { webEnv } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/admin/',
        '/api',
        '/api/',
        '/dashboard',
        '/dashboard/',
        '/reviewer',
        '/reviewer/',
        '/creator/dashboard',
        '/creator/app',
        '/creator/app/',
        '/internal',
        '/internal/'
      ]
    },
    sitemap: `${webEnv.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
    host: webEnv.NEXT_PUBLIC_SITE_URL
  };
}
