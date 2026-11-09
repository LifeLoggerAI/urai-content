import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  role: 'admin', withdrawn: false, disabled: false, revoked: false,
  withdrawalPoint: '' as 'read' | 'write' | 'log' | '',
  withdrawAtAuthRead: 0,
  reads: vi.fn(), writes: vi.fn(), logs: vi.fn(), authReads: vi.fn()
}));
const privateSubmission = { id: 'owned-1', creatorId: 'actor-1', title: 'Private fixture', body: 'PRIVATE_SOURCE_FIXTURE', status: 'submitted' };

// This suite isolates Auth withdrawal at existing read/write/log boundaries.
// Canonical service protocol and withdrawal are exercised by the native
// canonical-privacy-consumer source suite, using its labeled synthetic I/O.
vi.mock('../src/server/privacy/canonicalConsent', () => ({
  contentRequestConsentPurpose: () => 'memory.storage',
  evaluateContentCanonicalConsent: async () => true
}));

vi.mock('../src/server/firebase/admin', () => ({
  isFirebaseAdminConfigured: () => true,
  getFirebaseAdminAuth: () => ({
    verifyIdToken: async () => {
      if (state.revoked) throw Object.assign(new Error('private-auth-error'), { code: 'auth/id-token-revoked' });
      return { uid: 'actor-1', role: state.role };
    },
    getUser: async () => { state.authReads(); if (state.withdrawAtAuthRead && state.authReads.mock.calls.length >= state.withdrawAtAuthRead) state.withdrawn = true; return { uid: 'actor-1', disabled: state.disabled, customClaims: state.withdrawn ? {} : { role: state.role } }; }
  })
}));
vi.mock('../src/server/content/service', () => {
  const end = (point: 'read' | 'write' | 'log') => { if (state.withdrawalPoint === point) state.withdrawn = true; };
  return {
    getRuntimePersistenceStatus: () => ({ writable: true, mode: 'firestore' }),
    createRuntimeContentRepository: () => ({
      listCreatorSubmissionQueue: async () => { state.reads(); end('read'); return [privateSubmission]; },
      listCreatorSubmissions: async () => { state.reads(); end('read'); return [privateSubmission]; },
      getCreatorSubmission: async () => { state.reads(); end('read'); return privateSubmission; },
      upsertCreatorSubmission: async () => { state.writes(); end('write'); },
      createCreatorSubmission: async () => { state.writes(); end('write'); },
      // One mocked durable operation now commits both the status and audit.
      // Real transactional interruption acceptance remains an emulator gate.
      moderateCreatorSubmission: async () => { state.writes(); state.logs(); end('write'); },
      logModeration: async () => { state.logs(); end('log'); }
    })
  };
});

import { GET as ownerDetail } from '../src/app/api/creator/submissions/[id]/route';
import { GET as creatorList, POST as creatorCreate } from '../src/app/api/creator/submissions/route';
import { GET as adminQueue } from '../src/app/api/admin/creator-submissions/route';
import { GET as adminDetail } from '../src/app/api/admin/creator-submissions/[id]/route';
import { POST as moderate } from '../src/app/api/admin/creator-submissions/[id]/moderate/route';

function request(body?: unknown): Request {
  return new Request('https://uraicontent.com/api/creator/submissions/owned-1', {
    method: body ? 'POST' : 'GET', headers: { authorization: 'Bearer issued-token', ...(body ? { 'content-type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
}
const context = () => ({ params: Promise.resolve({ id: 'owned-1' }) });
beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'production');
  Object.assign(state, { role: 'admin', withdrawn: false, disabled: false, revoked: false, withdrawalPoint: '', withdrawAtAuthRead: 0 });
  state.reads.mockReset(); state.writes.mockReset(); state.logs.mockReset(); state.authReads.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

describe('private output and moderation after awaited work', () => {
  for (const [name, role, run] of [
    ['owner detail', 'user', () => ownerDetail(request(), context())],
    ['creator list', 'creator', () => creatorList(request())],
    ['admin queue', 'admin', () => adminQueue(request())],
    ['admin detail', 'admin', () => adminDetail(request(), context())]
  ] as const) {
    it(name + ' denies withdrawn membership before returning a pending private read', async () => {
      state.role = role; state.withdrawalPoint = 'read';
      const response = await run();
      expect(response.status).toBe(401);
      expect(JSON.stringify(await response.json())).not.toContain('PRIVATE_SOURCE_FIXTURE');
    });
    it(name + ' preserves the current authorized operation', async () => {
      state.role = role;
      const response = await run();
      expect(response.status).toBe(200);
      expect(JSON.stringify(await response.json())).toContain('PRIVATE_SOURCE_FIXTURE');
    });
  }

  it('rechecks owner Auth after pending route parameters before reading private data', async () => {
    state.role = 'user';
    let release!: (value: { id: string }) => void;
    const params = new Promise<{ id: string }>((resolve) => { release = resolve; });
    const pending = ownerDetail(request(), { params });
    await vi.waitFor(() => expect(state.authReads).toHaveBeenCalledTimes(2));
    state.disabled = true;
    release({ id: 'owned-1' });
    expect((await pending).status).toBe(401);
    expect(state.reads).not.toHaveBeenCalled();
  });
  it('rechecks moderation authority after reading its awaited JSON payload', async () => {
    const req = request({ decision: 'approved' });
    vi.spyOn(req, 'json').mockImplementation(async () => { state.withdrawn = true; return { decision: 'approved' }; });
    expect((await moderate(req, context())).status).toBe(401);
    expect(state.reads).not.toHaveBeenCalled(); expect(state.writes).not.toHaveBeenCalled(); expect(state.logs).not.toHaveBeenCalled();
  });
  it('denies moderation after withdrawal during a private read before any mutation', async () => {
    state.withdrawalPoint = 'read';
    expect((await moderate(request({ decision: 'approved' }), context())).status).toBe(401);
    expect(state.writes).not.toHaveBeenCalled(); expect(state.logs).not.toHaveBeenCalled();
  });
  it('blocks moderator persistence in production even when current admin has authority', async () => {
    state.withdrawalPoint = 'write';
    const response = await moderate(request({ decision: 'approved' }), context());
    expect(response.status).toBe(503);
    expect(state.writes).not.toHaveBeenCalled();
    expect(state.logs).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({ error: 'private_mutation_fence_unavailable' });
  });
  it('denies role withdrawal at the added pre-write Auth/C1 boundary without persisting', async () => {
    state.role = 'creator';
    // Production admission reads current account twice; its next read
    // belongs to the newly inserted recheck just before create-only write.
    state.withdrawAtAuthRead = 3;
    const response = await creatorCreate(request({ creatorId: 'actor-1', title: 'Private fixture', body: 'PRIVATE_SOURCE_FIXTURE' }));
    expect(response.status).toBe(401);
    expect(state.writes).not.toHaveBeenCalled();
    expect(JSON.stringify(await response.json())).not.toContain('PRIVATE_SOURCE_FIXTURE');
  });
  it('holds creator mutations when NODE_ENV is misconfigured as test but Firebase is real', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    state.role = 'creator';
    const response = await creatorCreate(request({ creatorId: 'actor-1', title: 'Private fixture', body: 'PRIVATE_SOURCE_FIXTURE' }));
    expect(response.status).toBe(503);
    expect(state.writes).not.toHaveBeenCalled();
  });
  it('holds moderation when NODE_ENV is misconfigured as development but Firebase is real', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const response = await moderate(request({ decision: 'approved' }), context());
    expect(response.status).toBe(503);
    expect(state.writes).not.toHaveBeenCalled();
    expect(state.logs).not.toHaveBeenCalled();
  });
  it('blocks private creator persistence in production without revealing the submitted body', async () => {
    state.role = 'creator'; state.withdrawalPoint = 'write';
    const response = await creatorCreate(request({ creatorId: 'actor-1', title: 'Private fixture', body: 'PRIVATE_SOURCE_FIXTURE' }));
    expect(response.status).toBe(503);
    expect(state.writes).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({ error: 'private_mutation_fence_unavailable' });
  });
});

