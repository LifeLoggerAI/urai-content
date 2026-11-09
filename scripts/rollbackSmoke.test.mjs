import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const script = resolve(here, 'rollbackSmoke.ts');
const stub = resolve(here, 'fixtures/rollbackFetch.mjs');
const allowedOrigin = 'https://candidate.example.test';
const a = 'a'.repeat(40);
const b = 'b'.repeat(40);

function goodFixture() {
  return {
    '/api/version': { body: { service: 'urai-content-web', commitSha: a } },
    '/api/health': { body: { service: 'urai-content-web', ok: true, status: 'healthy', persistence: { productionSafe: true } } },
    expectedRequests: ['/api/version', '/api/health'],
  };
}

function execute({ fixture = goodFixture(), envOverride = {}, args = [], expectedExit = 0 } = {}) {
  const env = { ...process.env, URAI_ROLLBACK_FIXTURE: JSON.stringify(fixture),
    URAI_CONTENT_BASE_URL: allowedOrigin, URAI_EXPECTED_RELEASE_SHA: a, ...envOverride };
  if (env.URAI_CONTENT_BASE_URL === null) delete env.URAI_CONTENT_BASE_URL;
  if (env.URAI_EXPECTED_RELEASE_SHA === null) delete env.URAI_EXPECTED_RELEASE_SHA;
  const p = spawnSync(process.execPath, ['--experimental-strip-types', '--import', stub, script, ...args],
    { env, cwd: resolve(here, '..'), encoding: 'utf8', timeout: 15000 });
  assert.equal(p.error, undefined, `spawn error: ${p.error}`);
  assert.equal(p.status, expectedExit, `wanted=${expectedExit} got=${p.status}\nSTDOUT:\n${p.stdout}\nSTDERR:\n${p.stderr}`);
  if (expectedExit === 0) assert.match(p.stdout, /PASS_CONTENT_ROLLBACK_SMOKE exactSha=/);
  else assert.match(p.stderr, /FAIL_CONTENT_ROLLBACK_SMOKE/);
  return p;
}

const cases = [
  { name: 'valid exact SHA, service, and healthy runtime succeeds', expectedExit: 0 },
  { name: 'valid CLI syntax without env values succeeds', expectedExit: 0,
    envOverride: { URAI_CONTENT_BASE_URL: null, URAI_EXPECTED_RELEASE_SHA: null },
    args: [`--base-url=${allowedOrigin}`, `--expected-sha=${a}`] },
  { name: 'wrong commit SHA fails', expectedExit: 1, mutate: f => { f['/api/version'].body.commitSha = b; } },
  { name: 'wrong SHA with expected only in notes fails (R9 false positive)', expectedExit: 1,
    mutate: f => { f['/api/version'].body = { service: 'urai-content-web', commitSha: b, notes: a }; } },
  { name: 'degraded HTTP 200 health fails (R9 false positive)', expectedExit: 1,
    mutate: f => { f['/api/health'].body = { service: 'urai-content-web', ok: false, status: 'degraded', persistence: { productionSafe: false } }; } },
  { name: 'omitted expected SHA fails (R9 false positive)', expectedExit: 1,
    envOverride: { URAI_EXPECTED_RELEASE_SHA: null } },
  { name: 'documented legacy rollback-url flag fails instead of being ignored (R9 false positive)', expectedExit: 1,
    args: ['--rollback-url=https://previous.example.test'], envOverride: { URAI_EXPECTED_RELEASE_SHA: null } },
  { name: 'wrong service with expected SHA only in notes fails (R9 false positive)', expectedExit: 1,
    mutate: f => { f['/api/version'].body = { service: 'unrelated', commitSha: b, notes: a }; } },
  { name: 'wrong service with correct SHA fails', expectedExit: 1,
    mutate: f => { f['/api/version'].body.service = 'unrelated'; } },
  { name: 'null commit SHA fails', expectedExit: 1,
    mutate: f => { f['/api/version'].body.commitSha = null; } },
  { name: 'invalid uppercase expected SHA fails', expectedExit: 1,
    envOverride: { URAI_EXPECTED_RELEASE_SHA: 'A'.repeat(40) } },
  { name: 'invalid short expected SHA fails', expectedExit: 1,
    envOverride: { URAI_EXPECTED_RELEASE_SHA: 'abc' } },
  { name: 'conflicting CLI and environment SHA fails', expectedExit: 1,
    args: [`--expected-sha=${b}`] },
  { name: 'duplicate CLI SHA arguments fail', expectedExit: 1,
    envOverride: { URAI_EXPECTED_RELEASE_SHA: null }, args: [`--expected-sha=${a}`, `--expected-sha=${a}`] },
  { name: 'unknown CLI argument fails', expectedExit: 1, args: ['--silently-ignore=1'] },
  { name: 'non-HTTPS origin fails', expectedExit: 1, envOverride: { URAI_CONTENT_BASE_URL: 'http://candidate.example.test' } },
  { name: 'local IPv4 origin fails', expectedExit: 1, envOverride: { URAI_CONTENT_BASE_URL: 'https://127.0.0.1' } },
  { name: 'origin with path fails', expectedExit: 1, envOverride: { URAI_CONTENT_BASE_URL: `${allowedOrigin}/api/version` } },
  { name: 'origin with query fails', expectedExit: 1, envOverride: { URAI_CONTENT_BASE_URL: `${allowedOrigin}?x=1` } },
  { name: 'redirect response fails', expectedExit: 1,
    mutate: f => { f['/api/version'].redirected = true; } },
  { name: 'HTTP non-200 version fails', expectedExit: 1,
    mutate: f => { f['/api/version'].status = 503; } },
  { name: 'HTTP non-200 health fails', expectedExit: 1,
    mutate: f => { f['/api/health'].status = 503; } },
  { name: 'non-JSON version fails', expectedExit: 1,
    mutate: f => { f['/api/version'].contentType = 'text/html'; } },
  { name: 'oversized unadvertised version response fails', expectedExit: 1,
    mutate: f => { f['/api/version'].body.notes = 'x'.repeat(18_000); } },
  { name: 'oversized advertised content-length fails', expectedExit: 1,
    mutate: f => { f['/api/version'].contentLength = '20000'; } },
  { name: 'malformed version JSON fails', expectedExit: 1,
    mutate: f => { f['/api/version'].raw = '{not-json'; } },
  { name: 'healthy status but false persistence proof fails', expectedExit: 1,
    mutate: f => { f['/api/health'].body.persistence.productionSafe = false; } },
  { name: 'wrong health service fails', expectedExit: 1,
    mutate: f => { f['/api/health'].body.service = 'other-service'; } },
  { name: 'missing health persistence object fails', expectedExit: 1,
    mutate: f => { delete f['/api/health'].body.persistence; } },
  { name: 'missing baseline URL fails', expectedExit: 1, envOverride: { URAI_CONTENT_BASE_URL: null } },
];

for (const c of cases) {
  test(c.name, () => {
    const f = goodFixture();
    delete f.expectedRequests;
    c.mutate?.(f);
    execute({ fixture: f, envOverride: c.envOverride, args: c.args, expectedExit: c.expectedExit });
  });
}
