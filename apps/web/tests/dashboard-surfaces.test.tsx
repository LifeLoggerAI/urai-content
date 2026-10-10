import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const authority = vi.hoisted(() => ({ snapshot: vi.fn(), session: vi.fn(), get: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: authority.get }) }));
vi.mock('../src/server/content/dashboard', () => ({ getDashboardSnapshot: authority.snapshot }));
vi.mock('../src/server/auth/browserSession', () => ({ CONTENT_SESSION_COOKIE: '__Host-urai-content-session', getBrowserSession: authority.session }));
import Dashboard from '../src/app/dashboard/page';
import Settings from '../src/app/dashboard/settings/page';
import { trackPublicEvent } from '../src/components/AnalyticsTracker';

describe('guarded dashboard surfaces', () => {
  beforeEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); authority.get.mockReturnValue({ value: 'server-cookie' }); });
  it('renders signed-out pages without authenticated data or logout controls', async () => {
    authority.snapshot.mockResolvedValue(null); authority.session.mockResolvedValue(null);
    for (const page of [Dashboard, Settings]) {
      const html = renderToStaticMarkup(await page());
      expect(html).toContain('Sign in');
      expect(html).not.toContain('data-content-authenticated');
      expect(html).not.toContain('Sign out');
      expect(html).not.toContain('server-cookie');
    }
    expect(authority.snapshot).toHaveBeenCalledWith('server-cookie');
    expect(authority.session).toHaveBeenCalledWith('server-cookie');
  });
  it('renders only admitted owned grants and keeps session identity off client markup', async () => {
    authority.snapshot.mockResolvedValue({ session: { uid: 'private-uid', role: 'member' }, entitlements: [{ entitlementKey: 'owned-grant', expiresAt: null }] });
    authority.session.mockResolvedValue({ uid: 'private-uid', role: 'member' });
    const html = renderToStaticMarkup(await Dashboard());
    expect(html).toContain('data-content-authenticated="true"');
    expect(html).toContain('owned-grant'); expect(html).toContain('/dashboard/settings');
    expect(html).not.toContain('private-uid'); expect(html).not.toContain('server-cookie');
    const settings = renderToStaticMarkup(await Settings());
    expect(settings).toContain('current account role: member'); expect(settings).toContain('/data-ownership');
    expect(settings).not.toContain('private-uid'); expect(settings).not.toContain('server-cookie');
  });
  it.each(['/dashboard', '/dashboard/settings', '/admin', '/admin/queue', '/settings/privacy', '/login'])('suppresses public tracking on %s', pathname => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); vi.stubGlobal('window', { location: { pathname } });
    trackPublicEvent('page_view', { path: pathname }); trackPublicEvent('cta_clicked'); expect(fetch).not.toHaveBeenCalled();
  });
  it('preserves allowed public tracking and denies unknown event names', () => {
    const fetch = vi.fn().mockResolvedValue({}); vi.stubGlobal('fetch', fetch); vi.stubGlobal('window', { location: { pathname: '/content' } });
    trackPublicEvent('page_view', { path: '/content' }); trackPublicEvent('private_account_event');
    expect(fetch).toHaveBeenCalledTimes(1); expect(fetch.mock.calls[0][0]).toBe('/api/analytics');
  });
});
