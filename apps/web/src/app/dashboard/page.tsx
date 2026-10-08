import { cookies } from 'next/headers';
import { CONTENT_SESSION_COOKIE } from '@/server/auth/browserSession';
import { getDashboardSnapshot } from '@/server/content/dashboard';
import { BrowserSessionLogout } from '@/components/BrowserSessionLogout';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your Content', robots: { index: false, follow: false } };

export default async function DashboardPage() {
  const jar = await cookies();
  const snapshot = await getDashboardSnapshot(jar.get(CONTENT_SESSION_COOKIE)?.value);
  if (!snapshot) return <main id="main-content" className="page-shell">
    <h1>Sign in to your Content account</h1>
    <p>Your private library requires a current authenticated session.</p>
    <a className="button" href={process.env.NEXT_PUBLIC_URAI_APP_URL || 'https://urai.app'}>Open UrAi</a>
  </main>;
  return <main id="main-content" className="page-shell" data-content-authenticated="true">
    <h1>Your Content</h1>
    <nav aria-label="Account navigation"><a className="button" href="/dashboard/settings">Account and privacy</a></nav>
    <section aria-labelledby="content-access-title">
      <h2 id="content-access-title">Your content access</h2>
      {snapshot.entitlements.length ? <ul>{snapshot.entitlements.map(entry => <li key={entry.entitlementKey}>
        <strong>{entry.entitlementKey}</strong>
        <span> — {entry.expiresAt ? 'Expires ' + new Date(entry.expiresAt).toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'No scheduled expiry'}</span>
      </li>)}</ul> : <p>No content grants are currently recorded for your account.</p>}
      <a className="button" href="/content">Browse the archive</a>
    </section>
    <BrowserSessionLogout />
  </main>;
}

