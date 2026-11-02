import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRequestSession } from '../src/server/auth/session';

const fixture = vi.hoisted(() => ({
  configured: true,
  verifyIdToken: vi.fn()
}));

vi.mock('server-only', () => ({}));
vi.mock('../src/server/firebase/admin', () => ({
  isFirebaseAdminConfigured: () => fixture.configured,
  getFirebaseAdminAuth: () => ({ verifyIdToken: fixture.verifyIdToken })
}));

const request = () => new Request('https://uraicontent.com/api/admin/content', {
  headers: {
    authorization: 'Bearer source-test-token',
    'x-urai-user-id': 'header-admin',
    'x-urai-role': 'admin'
  }
});

beforeEach(() => {
  fixture.configured = true;
  fixture.verifyIdToken.mockReset();
});

describe('bearer session revocation', () => {
  it('checks revocation before using the verified role and entitlements', async () => {
    fixture.verifyIdToken.mockResolvedValue({
      uid: 'verified-user', role: 'creator', entitlements: ['catalog:motion', 7]
    });

    await expect(getRequestSession(request())).resolves.toEqual({
      uid: 'verified-user', role: 'creator', entitlements: ['catalog:motion']
    });
    expect(fixture.verifyIdToken).toHaveBeenCalledWith('source-test-token', true);
  });

  it.each(['auth/id-token-revoked', 'auth/user-disabled', 'auth/id-token-expired'])(
    'rejects %s without falling back to elevated header credentials', async (code) => {
      fixture.verifyIdToken.mockRejectedValue(Object.assign(new Error('private-auth-detail'), { code }));

      await expect(getRequestSession(request())).resolves.toBeNull();
      expect(fixture.verifyIdToken).toHaveBeenCalledWith('source-test-token', true);
    }
  );

  it('does not verify a token without a configured service identity', async () => {
    fixture.configured = false;

    await expect(getRequestSession(request())).resolves.toBeNull();
    expect(fixture.verifyIdToken).not.toHaveBeenCalled();
  });
});
