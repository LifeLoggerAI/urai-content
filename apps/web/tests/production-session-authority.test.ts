import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getRequestSession } from '../src/server/auth/session';

const fixture = vi.hoisted(() => ({
  configured: true,
  verifyIdToken: vi.fn(),
  getUser: vi.fn()
}));

vi.mock('server-only', () => ({}));
vi.mock('../src/server/firebase/admin', () => ({
  isFirebaseAdminConfigured: () => fixture.configured,
  getFirebaseAdminAuth: () => ({ verifyIdToken: fixture.verifyIdToken, getUser: fixture.getUser })
}));

const activeRoles = ['user', 'creator', 'studio', 'admin', 'internalAdmin', 'enterprise', 'licensingPartner', 'foundation'];
const bearerRequest = () => new Request('https://uraicontent.com/api/admin/content', {
  headers: { authorization: 'Bearer source-test-token', 'x-urai-user-id': 'forged-admin', 'x-urai-role': 'internalAdmin' }
});
const headerRequest = (role: string) => new Request('https://uraicontent.com/api/admin/content', {
  headers: { 'x-urai-user-id': 'forged-owner', 'x-urai-role': role }
});
const token = (role = 'creator') => ({
  uid: 'verified-owner', role, entitlements: ['catalog:motion', 'withdrawn-grant', 7]
});
const account = (role = 'creator') => ({
  uid: 'verified-owner', disabled: false, customClaims: { role, entitlements: ['catalog:motion', 'new-grant', 9] }
});

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('URAI_ENABLE_HEADER_AUTH', '1');
  fixture.configured = true;
  fixture.verifyIdToken.mockReset();
  fixture.getUser.mockReset();
  fixture.verifyIdToken.mockResolvedValue(token());
  fixture.getUser.mockResolvedValue(account());
});
afterEach(() => vi.unstubAllEnvs());

describe('production session authority', () => {
  for (const flag of ['unset', '0', '1']) {
    for (const role of activeRoles) {
      it('denies forged ' + role + ' headers with production flag ' + flag, async () => {
        if (flag === 'unset') delete process.env.URAI_ENABLE_HEADER_AUTH;
        else vi.stubEnv('URAI_ENABLE_HEADER_AUTH', flag);
        await expect(getRequestSession(headerRequest(role))).resolves.toBeNull();
        expect(fixture.verifyIdToken).not.toHaveBeenCalled();
        expect(fixture.getUser).not.toHaveBeenCalled();
      });
    }
  }

  for (const role of activeRoles) {
    it('allows current active matching ' + role + ' membership without trusting forged headers', async () => {
      fixture.verifyIdToken.mockResolvedValue(token(role));
      fixture.getUser.mockResolvedValue(account(role));
      await expect(getRequestSession(bearerRequest())).resolves.toEqual({
        uid: 'verified-owner', role, entitlements: ['catalog:motion']
      });
      expect(fixture.verifyIdToken).toHaveBeenCalledWith('source-test-token', true);
      expect(fixture.getUser).toHaveBeenCalledWith('verified-owner');
    });
  }

  for (const code of ['auth/id-token-revoked', 'auth/user-disabled', 'auth/id-token-expired']) {
    it('rejects ' + code + ' before current-account lookup or header fallback', async () => {
      fixture.verifyIdToken.mockRejectedValue(Object.assign(new Error('synthetic-auth-error'), { code }));
      await expect(getRequestSession(bearerRequest())).resolves.toBeNull();
      expect(fixture.verifyIdToken).toHaveBeenCalledWith('source-test-token', true);
      expect(fixture.getUser).not.toHaveBeenCalled();
    });
  }

  for (const [name, value] of [
    ['disabled account', { ...account(), disabled: true }],
    ['missing account state', { uid: 'verified-owner', customClaims: account().customClaims }],
    ['foreign account identity', { ...account(), uid: 'foreign-owner' }],
    ['missing account identity', { disabled: false, customClaims: account().customClaims }],
    ['removed membership claims', { uid: 'verified-owner', disabled: false }],
    ['array membership claims', { ...account(), customClaims: [] }],
    ['null membership claims', { ...account(), customClaims: null }]
  ] as const) {
    it('rejects ' + name + ' after verification', async () => {
      fixture.getUser.mockResolvedValue(value);
      await expect(getRequestSession(bearerRequest())).resolves.toBeNull();
      expect(fixture.getUser).toHaveBeenCalledWith('verified-owner');
    });
  }

  it('rejects a stale elevated token after current role demotion', async () => {
    fixture.verifyIdToken.mockResolvedValue(token('admin'));
    fixture.getUser.mockResolvedValue(account('user'));
    await expect(getRequestSession(bearerRequest())).resolves.toBeNull();
  });
  it('requires refreshed matching claims before a new elevated role', async () => {
    fixture.verifyIdToken.mockResolvedValue(token('user'));
    fixture.getUser.mockResolvedValue(account('admin'));
    await expect(getRequestSession(bearerRequest())).resolves.toBeNull();
  });

  for (const [name, claims] of [
    ['missing role', {}],
    ['unknown role', { role: 'owner' }],
    ['anonymous membership', { role: 'anonymous' }],
    ['unknown role array', { roles: ['owner'] }]
  ] as const) {
    it('rejects current ' + name, async () => {
      fixture.getUser.mockResolvedValue({ ...account(), customClaims: claims });
      await expect(getRequestSession(bearerRequest())).resolves.toBeNull();
    });
  }

  for (const code of ['auth/user-not-found', 'auth/internal-error']) {
    it('fails closed on current-account ' + code, async () => {
      fixture.getUser.mockRejectedValue(Object.assign(new Error('synthetic-account-error'), { code }));
      await expect(getRequestSession(bearerRequest())).resolves.toBeNull();
      expect(fixture.getUser).toHaveBeenCalledWith('verified-owner');
    });
  }

  it('intersects current entitlements with verified token grants and removes duplicates', async () => {
    fixture.getUser.mockResolvedValue({ ...account(), customClaims: {
      role: 'creator', entitlements: ['new-grant', 'catalog:motion', 'catalog:motion', 7]
    } });
    await expect(getRequestSession(bearerRequest())).resolves.toEqual({
      uid: 'verified-owner', role: 'creator', entitlements: ['catalog:motion']
    });
  });
  it('does not retain old entitlements when current membership has none', async () => {
    fixture.getUser.mockResolvedValue({ ...account(), customClaims: { role: 'creator' } });
    await expect(getRequestSession(bearerRequest())).resolves.toEqual({
      uid: 'verified-owner', role: 'creator', entitlements: []
    });
  });
  it('accepts canonical matching role arrays without accepting unknown values', async () => {
    fixture.verifyIdToken.mockResolvedValue({ uid: 'verified-owner', roles: ['owner', 'creator'] });
    fixture.getUser.mockResolvedValue({ ...account(), customClaims: { roles: ['owner', 'creator'] } });
    await expect(getRequestSession(bearerRequest())).resolves.toEqual({
      uid: 'verified-owner', role: 'creator', entitlements: []
    });
  });

  it('does not access Auth without configured service authority', async () => {
    fixture.configured = false;
    await expect(getRequestSession(bearerRequest())).resolves.toBeNull();
    expect(fixture.verifyIdToken).not.toHaveBeenCalled();
    expect(fixture.getUser).not.toHaveBeenCalled();
  });
  it('preserves explicit non-production fixture fallback', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    await expect(getRequestSession(headerRequest('creator'))).resolves.toEqual({
      uid: 'forged-owner', role: 'creator'
    });
    expect(fixture.verifyIdToken).not.toHaveBeenCalled();
    expect(fixture.getUser).not.toHaveBeenCalled();
  });
  it('denies non-production fixture fallback when disabled', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('URAI_ENABLE_HEADER_AUTH', '0');
    await expect(getRequestSession(headerRequest('admin'))).resolves.toBeNull();
  });
  it('never falls back to fixture headers after a rejected Bearer token', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    fixture.verifyIdToken.mockRejectedValue(new Error('synthetic-token-rejection'));
    await expect(getRequestSession(bearerRequest())).resolves.toBeNull();
    expect(fixture.getUser).not.toHaveBeenCalled();
  });
});
