import type { MetadataRoute } from 'next';
import { webEnv } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/', '/creator/dashboard']
    },
    sitemap: `${webEnv.NEXT_PUBLIC_SITE_URL}/sitemap.xml`
  };
}
