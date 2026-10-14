import { cookies } from 'next/headers';
import { CONTENT_SESSION_COOKIE, getBrowserSession } from '@/server/auth/browserSession';
import { BrowserSessionLogout } from '@/components/BrowserSessionLogout';
import { ContentDataExport } from '@/components/ContentDataExport';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Account and privacy', robots: { index: false, follow: false } };

export default async function DashboardSettingsPage() {
  const jar = await cookies();
  const session = await getBrowserSession(jar.get(CONTENT_SESSION_COOKIE)?.value);
  if (!session) return <main id="main-content" className="page-shell">
    <h1>Sign in to manage your account</h1>
    <p>Account settings require a current authenticated session.</p>
    <a className="button" href={process.env.NEXT_PUBLIC_URAI_APP_URL || 'https://urai.app'}>Open UrAi</a>
  </main>;
  return <main id="main-content" className="page-shell" data-content-authenticated="true">
    <h1>Account and privacy</h1>
    <p>Your current account role: {session.role}</p>
    <nav aria-label="Account and privacy controls">
      <a className="button" href="/dashboard">Your Content</a>{' '}
      <a className="button" href="/privacy">Privacy and data handling</a>{' '}
      <a className="button" href="/data-ownership">Data ownership</a>{' '}
      <a className="button" href="/contact">Contact privacy support</a>
    </nav>
    <ContentDataExport expectedUid={session.uid} projectMatches={Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PROJECT_ID === process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)} />
    <BrowserSessionLogout />
  </main>;
}


