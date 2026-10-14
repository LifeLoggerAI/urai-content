import { createServer, type Server } from 'node:http';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { getDeploymentOrigin, verifyAnonymousReadBoundaries, verifyDeploymentIdentity } from '../scripts/deployment-identity';

const expectedSha = '9f6c6135362a911d84628606480e9c3e0c7a8f5a';
const servers: Server[] = [];
async function serve(identity: unknown, status = 200, contentType = 'application/json', location?: string) {
  const server = createServer((_request, response) => {
    response.statusCode = status;
    response.setHeader('content-type', contentType);
    if (location) response.setHeader('location', location);
    response.end(JSON.stringify(identity));
  });
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing test server address.');
  return `http://127.0.0.1:${address.port}`;
}
const identity = { service: 'urai-content-web', packageName: 'urai-content', environment: 'production', commitSha: expectedSha };
afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))));
});

describe('deployed Content identity over HTTP', () => {
  it('accepts only the requested service and full source identity', async () => {
    const origin = await serve(identity);
    await expect(verifyDeploymentIdentity(origin, expectedSha)).resolves.toEqual({ origin, service: 'urai-content-web', packageName: 'urai-content', commitSha: expectedSha });
  });
  it.each([
    { ...identity, service: 'other-service' },
    { ...identity, packageName: 'other-package' },
    { ...identity, commitSha: '988ca4f7f38b1ce86e4d3f426361b5866fd23e0d' },
    { ...identity, commitSha: null },
    { ...identity, environment: 'development' },
    null
  ])('rejects unrelated, stale, absent or nonproduction identity', async (served) => {
    await expect(verifyDeploymentIdentity(await serve(served), expectedSha)).rejects.toThrow();
  });
  it('rejects non-JSON and failing version responses', async () => {
    await expect(verifyDeploymentIdentity(await serve(identity, 200, 'text/html'), expectedSha)).rejects.toThrow('JSON');
    await expect(verifyDeploymentIdentity(await serve(identity, 503), expectedSha)).rejects.toThrow('503');
  });
  it('does not follow a redirect to a different deployment', async () => {
    const destination = await serve(identity);
    await expect(verifyDeploymentIdentity(await serve({}, 307, 'application/json', `${destination}/api/version`), expectedSha)).rejects.toThrow();
  });
  it('rejects incomplete expected SHA before HTTP access', async () => {
    await expect(verifyDeploymentIdentity('https://example.invalid', '9f6c6135')).rejects.toThrow('complete');
  });
  it.each(['http://example.invalid', 'https://user:password@example.invalid', 'https://example.invalid/path', 'https://example.invalid/?query=1', 'https://example.invalid/#fragment'])('rejects unsafe or ambiguous base origin %s', (origin) => {
    expect(() => getDeploymentOrigin(origin)).toThrow();
  });
  it('preserves HTTPS remote and local loopback route checks', () => {
    expect(getDeploymentOrigin('https://example.invalid')).toEqual({ origin:'https://example.invalid', remote:true });
    expect(getDeploymentOrigin('http://127.0.0.1:3000')).toEqual({ origin:'http://127.0.0.1:3000', remote:false });
  });
});

describe('anonymous deployed read boundaries', () => {
  async function serveBoundaries(denialStatus = 401, denialBody: unknown = { error:'unauthenticated' }, missingStatus = 404) {
    const server = createServer((request, response) => {
      const missing = request.url === '/__urai_content_unimplemented_route__';
      response.statusCode = missing ? missingStatus : denialStatus;
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify(missing ? { error:'not_found' } : denialBody));
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing test server address.');
    return `http://127.0.0.1:${address.port}`;
  }
  it('proves denial bodies on both private reads and fails unknown routes closed', async () => {
    await expect(verifyAnonymousReadBoundaries(await serveBoundaries())).resolves.toBeUndefined();
  });
  it.each([200, 403, 503])('does not substitute %i for anonymous authentication denial', async (status) => {
    await expect(verifyAnonymousReadBoundaries(await serveBoundaries(status))).rejects.toThrow('401');
  });
  it('rejects an unrelated body despite matching 401 status', async () => {
    await expect(verifyAnonymousReadBoundaries(await serveBoundaries(401, { error:'other-service' }))).rejects.toThrow('authentication denial');
  });
  it('rejects a wildcard 200 response for an unimplemented route', async () => {
    await expect(verifyAnonymousReadBoundaries(await serveBoundaries(401, { error:'unauthenticated' }, 200))).rejects.toThrow('404');
  });
});

describe('Next build identity capture', () => {
  const configPath = fileURLToPath(new URL('../next.config.mjs', import.meta.url));
  function loadConfig(values: Record<string, string>) {
    const env = { ...process.env };
    for (const key of ['URAI_CONTENT_BUILD_SHA', 'GITHUB_SHA', 'VERCEL_GIT_COMMIT_SHA']) delete env[key];
    return spawnSync(process.execPath, ['--input-type=module', '-e', 'const c=await import(process.argv[1]); console.log(JSON.stringify(c.default.env))', configPath], { env: { ...env, ...values }, encoding:'utf8' });
  }
  it('embeds the checkout identity for prebuilt deployment', () => {
    const result = loadConfig({ GITHUB_SHA:expectedSha, URAI_CONTENT_BUILD_SHA:expectedSha });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ URAI_CONTENT_BUILD_SHA:expectedSha });
  });
  it('keeps an unbound local build explicitly unknown', () => {
    const result = loadConfig({});
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ URAI_CONTENT_BUILD_SHA:'' });
  });
  it('refuses conflicting or truncated build identities', () => {
    expect(loadConfig({ GITHUB_SHA:expectedSha, VERCEL_GIT_COMMIT_SHA:'988ca4f7f38b1ce86e4d3f426361b5866fd23e0d' }).status).not.toBe(0);
    expect(loadConfig({ GITHUB_SHA:'9f6c6135' }).status).not.toBe(0);
  });
});
