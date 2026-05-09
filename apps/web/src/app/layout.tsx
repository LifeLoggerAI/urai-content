import type { Metadata } from 'next';
import './globals.css';
import { webEnv } from '@/lib/env';

export const metadata: Metadata = {
  metadataBase: new URL(webEnv.NEXT_PUBLIC_SITE_URL),
  title: {
    default: 'URAI Content',
    template: '%s | URAI Content'
  },
  description: 'The publishing and media engine for the URAI Emotional OS.',
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'URAI Content',
    description: 'The publishing and media engine for the URAI Emotional OS.',
    url: webEnv.NEXT_PUBLIC_SITE_URL,
    siteName: 'URAI Content',
    type: 'website'
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
