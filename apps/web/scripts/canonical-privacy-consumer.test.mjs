import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// Load the actual pinned TypeScript bytes with Node's own transform. Only
// server-only's build guard and Auth SDK I/O are replaced by explicit fixtures.
// No canonical provider, cloud runtime or physical device is represented here.
function sourceModule(relative, replacements = []) {
  let source = readFileSync(new URL(relative, import.meta.url), 'utf8').replace("import 'server-only';", '');
  for (const [from, to] of replacements) {
    assert(source.includes(from), 'test fixture must match the actual source import');
    source = source.replace(from, to);
  }
  const js = stripTypeScriptTypes(source, { mode: 'transform' });
  return 'data:text/javascript;base64,' + Buffer.from(js).toString('base64');
}
const consumerUrl = sourceModule('../src/server/privacy/canonicalConsent.ts');
const consumer = await import(consumerUrl);
const rolesUrl = sourceModule('../src/server/auth/roles.ts');
const state = { configured: true, uid: 'fixture-owner', role: 'creator', calls: 0, revoked: false };
globalThis.__uraiPrivacyConsumerAuthFixture = state;
const sessionUrl = sourceModule('../src/server/auth/session.ts', [
  ["import type { AuthRole, AuthSession } from './roles';", ''],
  ["import { isKnownAuthRole } from './roles';", `import { isKnownAuthRole } from '${rolesUrl}';`],
  ["import { getFirebaseAdminAuth, isFirebaseAdminConfigured } from '../firebase/admin';", `
    const state = globalThis.__uraiPrivacyConsumerAuthFixture;
    const isFirebaseAdminConfigured = () => state.configured;
    const getFirebaseAdminAuth = () => ({
      verifyIdToken: async (_token, checkRevoked) => {
        if (!checkRevoked || state.revoked) throw new Error('fixture-revoked');
        return { uid: state.uid, role: state.role, entitlements: ['fixture-grant'] };
      },
      getUser: async (uid) => ({ uid, disabled: false, customClaims: { role: state.role, entitlements: ['fixture-grant'] } })
    });`],
  ["import { contentRequestConsentPurpose, evaluateContentCanonicalConsent } from '../privacy/canonicalConsent';",
    `import { contentRequestConsentPurpose, evaluateContentCanonicalConsent } from '${consumerUrl}';`]
]);
const { getRequestSession } = await import(sessionUrl);
const originalFetch = globalThis.fetch;
const priorEnv = Object.fromEntries(['NODE_ENV', 'URAI_CONTENT_PRIVACY_PROJECT_ID', 'URAI_CONTENT_PRIVACY_REGION']
  .map((key) => [key, process.env[key]]));
const request = (path = '/api/creator/submissions', bearer = 'synthetic-token') => new Request('https://fixture.invalid' + path,
  { headers: bearer ? { authorization: 'Bearer ' + bearer } : {} });
const reply = (init, patch = {}) => {
  const data = JSON.parse(init.body).data;
  return new Response(JSON.stringify({ result: {
    ...data, allowed: true, reason: 'ALLOWED', requiredTier: 'C1', policyVersion: '1.0.0',
    evaluatedAt: new Date().toISOString(), decisionEventId: 'synthetic-decision', ...patch
  } }));
};
beforeEach(() => {
  process.env.NODE_ENV = 'production';
  process.env.URAI_CONTENT_PRIVACY_PROJECT_ID = 'synthetic-private-project';
  process.env.URAI_CONTENT_PRIVACY_REGION = 'us-central1';
  Object.assign(state, { configured: true, uid: 'fixture-owner', role: 'creator', calls: 0, revoked: false });
  globalThis.fetch = async (_url, init) => { state.calls++; return reply(init); };
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries(priorEnv)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});

test('current canonical grant admits actual production creator-session consumer', async () => {
  assert.deepEqual(await getRequestSession(request()), { uid: state.uid, role: 'creator', entitlements: ['fixture-grant'] });
  assert.equal(state.calls, 1);
});
test('callable envelope binds subject/purpose/correlation and prevents redirects/caching', async () => {
  let invoked = false;
  const transport = async (url, init) => {
    invoked = true;
    assert.equal(url, 'https://us-central1-synthetic-private-project.cloudfunctions.net/evaluateCanonicalConsent');
    assert.equal(init.headers.authorization, 'Bearer synthetic-token');
    assert.equal(init.redirect, 'error'); assert.equal(init.cache, 'no-store'); assert.equal(init.credentials, 'omit');
    const data = JSON.parse(init.body).data;
    assert.equal(data.targetUid, 'fixture-owner'); assert.equal(data.purpose, 'memory.storage');
    assert.match(data.correlationId, /^[a-f0-9-]{36}$/);
    return reply(init);
  };
  assert.equal(await consumer.evaluateContentCanonicalConsent(request(), state.uid, 'memory.storage', transport), true);
  assert.equal(invoked, true);
});
for (const [name, patch] of [
  ['withdrawn consent', { allowed: false, reason: 'REVOKED' }],
  ['missing consent', { allowed: false, reason: 'MISSING_CONSENT' }],
  ['wrong subject', { targetUid: 'other-owner' }],
  ['wrong purpose', { purpose: 'data.export' }],
  ['wrong correlation', { correlationId: 'prior-decision' }],
  ['wrong policy', { policyVersion: 'prior-policy' }],
  ['wrong tier', { requiredTier: 'C7' }],
  ['missing audit decision', { decisionEventId: '' }],
  ['string allow', { allowed: 'true' }],
  ['contradictory reason', { reason: 'DENIED' }],
  ['stale response', { evaluatedAt: '2020-01-01T00:00:00.000Z' }],
  ['future response', { evaluatedAt: '2099-01-01T00:00:00.000Z' }]
]) test(name + ' denies before the private consumer can run', async () => {
  globalThis.fetch = async (_url, init) => reply(init, patch);
  assert.equal(await getRequestSession(request()), null);
});
for (const name of ['deletion tombstone', 'revoked caller', 'provider unavailable']) test(name + ' canonical error fails closed', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { status: 'FAILED_PRECONDITION', message: name } }), { status: 400 });
  assert.equal(await getRequestSession(request()), null);
});
test('revocation while canonical request awaits denies after successful consent reply', async () => {
  globalThis.fetch = async (_url, init) => { state.revoked = true; return reply(init); };
  assert.equal(await getRequestSession(request()), null);
});
test('role demotion while canonical request awaits denies the admitted session', async () => {
  globalThis.fetch = async (_url, init) => { state.role = 'user'; return reply(init); };
  assert.equal(await getRequestSession(request()), null);
});
test('changed subject while canonical request awaits cannot replace admitted owner', async () => {
  globalThis.fetch = async (_url, init) => { state.uid = 'different-incarnation'; return reply(init); };
  assert.equal(await getRequestSession(request()), null);
});
test('existing post-await recheck observes withdrawal and does not return stale private data', async () => {
  assert.notEqual(await getRequestSession(request()), null);
  globalThis.fetch = async (_url, init) => reply(init, { allowed: false, reason: 'REVOKED' });
  assert.equal(await getRequestSession(request()), null);
});
test('no binding performs no canonical dispatch and fails private admission', async () => {
  delete process.env.URAI_CONTENT_PRIVACY_PROJECT_ID;
  assert.equal(await getRequestSession(request()), null); assert.equal(state.calls, 0);
});
test('invalid binding cannot send token to arbitrary transport target', async () => {
  process.env.URAI_CONTENT_PRIVACY_PROJECT_ID = 'fixture.invalid/path';
  assert.equal(await getRequestSession(request()), null); assert.equal(state.calls, 0);
});
test('malformed or oversized canonical reply denies', async () => {
  for (const body of ['not-json', ' '.repeat(16_385)]) {
    globalThis.fetch = async () => new Response(body);
    assert.equal(await getRequestSession(request()), null);
  }
});
test('transport failure denies without propagating provider details', async () => {
  globalThis.fetch = async () => { throw new Error('private-provider-fixture-detail'); };
  assert.equal(await getRequestSession(request()), null);
});
test('public catalog/account recovery are not given unrelated processing-consent prerequisites', async () => {
  for (const path of ['/api/catalog', '/api/auth/session', '/api/admin/creator-submissions']) {
    assert.equal(consumer.contentRequestConsentPurpose(request(path)), null);
  }
});
test('all mounted creator collection/detail paths select the same canonical purpose', () => {
  for (const path of ['/api/creator/submissions', '/api/creator/submissions/', '/api/creator/submissions/fixture-id'])
    assert.equal(consumer.contentRequestConsentPurpose(request(path)), 'memory.storage');
});
