import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  configured: true,
  tokenAccepted: true,
  authAccepted: true,
  repositoryCalls: vi.fn(),
  seedCalls: vi.fn(),
  dbCalls: vi.fn()
}));

vi.mock('../src/server/firebase/admin', () => ({
  isFirebaseAdminConfigured: () => state.configured,
  getFirebaseAdminDb: () => { state.dbCalls(); return {}; }
}));
vi.mock('../src/server/firebase/adminEnv', () => ({
  verifySeedToken: () => state.tokenAccepted
}));
vi.mock('../src/server/auth/requestSession', () => ({
  getRequestSession: async () => state.authAccepted ? { uid: 'synthetic-admin' } : null,
  getAuthFailureBody: (reason: string) => ({ error: reason }),
  getAuthFailureStatus: (reason: string) => reason === 'unauthenticated' ? 401 : 403
}));
vi.mock('../src/server/auth/authorization', () => ({
  requireAdmin: (session: unknown) => session ? { ok: true as const } : { ok: false as const, reason: 'unauthenticated' }
}));
vi.mock('../src/server/firebase/contentRepository', () => ({
  createFirestoreContentRepository: () => { state.repositoryCalls(); return {}; }
}));
vi.mock('../src/server/content/canonicalSeed', () => ({
  seedCanonicalContent: async () => { state.seedCalls(); return { count: 1, ids: ['synthetic-canonical'] }; }
}));

import { POST } from '../src/app/api/admin/seed/canonical-content/route';

function request(body?: unknown) {
  return new Request('https://uraicontent.test/api/admin/seed/canonical-content', {
    method: 'POST',
    headers: { authorization: 'Bearer synthetic', ...(body ? { 'content-type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
}
beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test');
  state.configured = true;
  state.tokenAccepted = true;
  state.authAccepted = true;
  state.dbCalls.mockClear(); state.repositoryCalls.mockClear(); state.seedCalls.mockClear();
});
afterEach(() => vi.unstubAllEnvs());

describe('canonical Admin seed write bypass protection', () => {
  it.each(['production', 'development', 'test', 'staging', ''])('denies persistent seed under runtime %s', async runtime => {
    vi.stubEnv('NODE_ENV', runtime);
    const response = await POST(request({ dryRun: false }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'private_mutation_fence_unavailable' });
    expect(state.dbCalls).not.toHaveBeenCalled();
    expect(state.repositoryCalls).not.toHaveBeenCalled();
    expect(state.seedCalls).not.toHaveBeenCalled();
  });
  it('preserves authenticated dry-run without touching the repository', async () => {
    const response = await POST(request({ dryRun: true }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ dryRun: true });
    expect(state.dbCalls).not.toHaveBeenCalled();
    expect(state.seedCalls).not.toHaveBeenCalled();
  });
  it('keeps Firebase configuration as a prerequisite to dry-run', async () => {
    state.configured = false;
    const response = await POST(request({ dryRun: true }));
    expect(response.status).toBe(409);
    expect(state.seedCalls).not.toHaveBeenCalled();
  });
  it('does not admit unauthorized callers even in dry-run', async () => {
    state.tokenAccepted = false; state.authAccepted = false;
    const response = await POST(request({ dryRun: true }));
    expect(response.status).toBe(401);
    expect(state.seedCalls).not.toHaveBeenCalled();
  });
});
