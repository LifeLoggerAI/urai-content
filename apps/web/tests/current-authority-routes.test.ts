import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authority = vi.hoisted(() => ({
  decoded: { uid: 'user-1', role: 'admin', entitlements: ['withdrawn'] },
  current: { uid: 'user-1', disabled: false, customClaims: { role: 'user' } },
  getUser: vi.fn(),
  queue: vi.fn(),
  write: vi.fn(),
  read: vi.fn()
}));
vi.mock('../src/server/firebase/admin', () => ({
  isFirebaseAdminConfigured: () => true,
  getFirebaseAdminAuth: () => ({
    verifyIdToken: async () => authority.decoded,
    getUser: authority.getUser
  })
}));
vi.mock('../src/server/content/service', () => ({
  getRuntimePersistenceStatus: () => ({ writable: true }),
  createRuntimeContentRepository: () => ({
    listCreatorSubmissionQueue: authority.queue,
    upsertCreatorSubmission: authority.write,
    getCreatorSubmission: authority.read
  })
}));

// These fixtures exercise Auth/role authority, using explicit synthetic
// canonical consent. The real consumer protocol/lifecycle has its own suite.
vi.mock('../src/server/privacy/canonicalConsent', () => ({
  contentRequestConsentPurpose: () => 'memory.storage',
  evaluateContentCanonicalConsent: async () => true
}));

import { GET as adminQueue } from '../src/app/api/admin/creator-submissions/route';
import { POST as createSubmission } from '../src/app/api/creator/submissions/route';
import { GET as ownedSubmission } from '../src/app/api/creator/submissions/[id]/route';

const adminRequest = () => new Request('https://uraicontent.com/api/admin/creator-submissions', {
  headers: { authorization: 'Bearer issued-before-role-withdrawal', 'x-urai-user-id': 'header-admin', 'x-urai-role': 'admin' }
});
const creatorRequest = () => new Request('https://uraicontent.com/api/creator/submissions', {
  method: 'POST',
  headers: { authorization: 'Bearer issued-before-role-withdrawal', 'content-type': 'application/json' },
  body: JSON.stringify({ creatorId: 'user-1', title: 'Source fixture', body: 'Reviewed nonprivate fixture.' })
});

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('URAI_ENABLE_HEADER_AUTH', '1');
  authority.decoded = { uid: 'user-1', role: 'admin', entitlements: ['withdrawn'] };
  authority.current = { uid: 'user-1', disabled: false, customClaims: { role: 'user' } };
  authority.getUser.mockReset().mockImplementation(async () => authority.current);
  authority.queue.mockReset().mockResolvedValue([]);
  authority.write.mockReset().mockResolvedValue(undefined);
  authority.read.mockReset().mockResolvedValue({ id: 'owned-1', creatorId: 'user-1', body: 'Private source fixture' });
});
afterEach(() => vi.unstubAllEnvs());

describe('current user authority in real private handlers', () => {
  it('rejects a withdrawn admin token before reading another creator queue', async () => {
    expect((await adminQueue(adminRequest())).status).toBe(401);
    expect(authority.queue).not.toHaveBeenCalled();
  });

  it('rejects a withdrawn creator token before creating a submission', async () => {
    authority.decoded.role = 'creator';
    expect((await createSubmission(creatorRequest())).status).toBe(401);
    expect(authority.write).not.toHaveBeenCalled();
  });

  it('fails closed after a successful bearer verification if current authority cannot be read', async () => {
    authority.getUser.mockRejectedValue(new Error('private-current-authority-detail'));
    expect((await adminQueue(adminRequest())).status).toBe(401);
    expect(authority.queue).not.toHaveBeenCalled();
  });

  it('awaits current authority before admitting a privileged handler', async () => {
    let release!: (value: typeof authority.current) => void;
    let started!: () => void;
    const lookupStarted = new Promise<void>((resolve) => { started = resolve; });
    authority.getUser.mockImplementation(() => {
      started();
      return new Promise((resolve) => { release = resolve; });
    });
    const pending = adminQueue(adminRequest());
    await lookupStarted;
    expect(authority.queue).not.toHaveBeenCalled();
    release(authority.current);
    expect((await pending).status).toBe(401);
    expect(authority.queue).not.toHaveBeenCalled();
  });

  it('retains the established server operations for a current admin and creator', async () => {
    authority.current.customClaims.role = 'admin';
    expect((await adminQueue(adminRequest())).status).toBe(200);
    expect(authority.queue).toHaveBeenCalled();
    authority.current.customClaims.role = 'creator';
    authority.decoded.role = 'creator';
    expect((await createSubmission(creatorRequest())).status).toBe(201);
    expect(authority.write).toHaveBeenCalled();
  });

  it('denies a disabled owner before reading or revealing a private submission', async () => {
    authority.current.disabled = true;
    expect((await ownedSubmission(adminRequest(), { params: Promise.resolve({ id: 'owned-1' }) })).status).toBe(401);
    expect(authority.read).not.toHaveBeenCalled();
  });

  it('does not read a private submission after current user lookup fails', async () => {
    authority.getUser.mockRejectedValue(new Error('private-current-authority-detail'));
    expect((await ownedSubmission(adminRequest(), { params: Promise.resolve({ id: 'missing-or-private' }) })).status).toBe(401);
    expect(authority.read).not.toHaveBeenCalled();
  });

  it('preserves current server owner reads and denies another owner', async () => {
    authority.decoded.role = 'user';
    expect((await ownedSubmission(adminRequest(), { params: Promise.resolve({ id: 'owned-1' }) })).status).toBe(200);
    authority.read.mockResolvedValue({ id: 'other-1', creatorId: 'other-user', body: 'Private source fixture' });
    expect((await ownedSubmission(adminRequest(), { params: Promise.resolve({ id: 'other-1' }) })).status).toBe(403);
  });
});

