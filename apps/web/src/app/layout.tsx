import type { Metadata } from 'next';
import './globals.css';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';
import { SiteFooter, SiteHeader } from '@/components/PublicPage';
import { webEnv } from '@/lib/env';
import { defaultSeo } from '@/lib/publicSiteContent';

export const metadata: Metadata = {
  metadataBase: new URL(webEnv.NEXT_PUBLIC_SITE_URL),
  title: {
    default: defaultSeo.title,
    template: '%s | URAI'
  },
  description: defaultSeo.description,
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: defaultSeo.title,
    description: defaultSeo.description,
    url: webEnv.NEXT_PUBLIC_SITE_URL,
    siteName: 'URAI',
    type: 'website'
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AnalyticsTracker />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
