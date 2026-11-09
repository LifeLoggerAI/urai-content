// Validate the identity and health of a previously selected rollback deployment.
// This is a smoke check, not a provider rollback operation or complete release certification.
const SHA = /^[a-f0-9]{40}$/;
const MAX_JSON_BYTES = 16_384;
const EXPECTED_SERVICE = 'urai-content-web';

function readCliOption(name: string): string | undefined {
  const prefix = `--${name}=`;
  const matches = process.argv.slice(2).filter((arg) => arg.startsWith(prefix));
  if (matches.length > 1) throw new Error(`Duplicate --${name} option`);
  return matches[0]?.slice(prefix.length);
}

function readConfiguration(name: string, envName: string): string {
  const fromCli = readCliOption(name);
  const fromEnv = process.env[envName];
  if (fromCli !== undefined && fromEnv !== undefined && fromCli !== fromEnv) {
    throw new Error(`Conflicting --${name} and ${envName}`);
  }
  return fromCli ?? fromEnv ?? '';
}

function checkedOrigin(raw: string): string {
  if (!raw || raw.length > 400) throw new Error('Rollback base URL missing or too long');
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error('Rollback base URL must be a valid HTTPS origin'); }
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password ||
      url.search || url.hash || (url.pathname !== '/' && url.pathname !== '') ||
      (raw !== url.origin && raw !== `${url.origin}/`) ||
      url.hostname === 'localhost' || url.hostname.endsWith('.localhost') ||
      /^\d+\.\d+\.\d+\.\d+$/.test(url.hostname) || url.hostname.startsWith('[')) {
    throw new Error('Rollback base URL must be a public HTTPS origin without paths or credentials');
  }
  return url.origin;
}

async function fetchBoundedJson(origin: string, path: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${origin}${path}`, {
    method: 'GET',
    redirect: 'error',
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status !== 200 || response.redirected ||
      !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) {
    throw new Error(`${path} must return HTTP 200 JSON without redirects`);
  }
  const advertised = response.headers.get('content-length');
  if (advertised !== null && (!/^[0-9]{1,6}$/.test(advertised) || Number(advertised) > MAX_JSON_BYTES)) {
    throw new Error(`${path} has an invalid or oversized Content-Length`);
  }
  if (!response.body || typeof response.body.getReader !== 'function') {
    throw new Error(`${path} has no bounded response stream`);
  }
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) throw new Error('Invalid response chunk');
      total += value.byteLength;
      if (total > MAX_JSON_BYTES) throw new Error('Response exceeds 16 KiB');
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  if (total === 0) throw new Error(`${path} returned an empty body`);
  let parsed: unknown;
  try { parsed = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error(`${path} returned malformed JSON`); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${path} returned a non-object JSON value`);
  }
  return parsed as Record<string, unknown>;
}

async function main(): Promise<void> {
  const permitted = ['--base-url=', '--expected-sha='];
  const unknown = process.argv.slice(2).filter((arg) => !permitted.some((prefix) => arg.startsWith(prefix)));
  if (unknown.length) throw new Error(`Unsupported rollback argument(s): ${unknown.join(', ')}`);
  const origin = checkedOrigin(readConfiguration('base-url', 'URAI_CONTENT_BASE_URL'));
  const expectedSha = readConfiguration('expected-sha', 'URAI_EXPECTED_RELEASE_SHA');
  if (!SHA.test(expectedSha)) throw new Error('A specific 40-character lowercase rollback commit SHA is required');

  const version = await fetchBoundedJson(origin, '/api/version');
  if (version.service !== EXPECTED_SERVICE || version.commitSha !== expectedSha) {
    throw new Error('Rollback version does not match the exact service and commit SHA');
  }
  const health = await fetchBoundedJson(origin, '/api/health');
  const persistence = health.persistence;
  if (health.service !== EXPECTED_SERVICE || health.ok !== true || health.status !== 'healthy' ||
      !persistence || typeof persistence !== 'object' ||
      (persistence as Record<string, unknown>).productionSafe !== true) {
    throw new Error('Rollback service health is not healthy');
  }

  console.log(`PASS_CONTENT_ROLLBACK_SMOKE exactSha=${expectedSha} origin=${origin}`);
  console.log('Scope: endpoint smoke only; previous LIVE provider rollback, IAM and Rules require separate signed evidence.');
}

try {
  await main();
} catch (error) {
  console.error(`FAIL_CONTENT_ROLLBACK_SMOKE: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
