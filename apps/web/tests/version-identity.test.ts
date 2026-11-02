import { afterEach, expect, it, vi } from 'vitest';
import { GET } from '../src/app/api/version/route';
afterEach(() => vi.unstubAllEnvs());

it('returns the embedded build identity and rejects runtime SHA substitution', async () => {
  vi.stubEnv('URAI_CONTENT_BUILD_SHA', '9f6c6135362a911d84628606480e9c3e0c7a8f5a');
  vi.stubEnv('GITHUB_SHA', '988ca4f7f38b1ce86e4d3f426361b5866fd23e0d');
  vi.stubEnv('VERCEL_GIT_COMMIT_SHA', '988ca4f7f38b1ce86e4d3f426361b5866fd23e0d');
  const response = GET();
  expect((await response.json()).commitSha).toBe('9f6c6135362a911d84628606480e9c3e0c7a8f5a');
  expect(response.headers.get('cache-control')).toBe('no-store');
});
it('reports unknown when no build identity exists even if runtime SHA is supplied', async () => {
  vi.stubEnv('URAI_CONTENT_BUILD_SHA', '');
  vi.stubEnv('GITHUB_SHA', '988ca4f7f38b1ce86e4d3f426361b5866fd23e0d');
  vi.stubEnv('VERCEL_GIT_COMMIT_SHA', '988ca4f7f38b1ce86e4d3f426361b5866fd23e0d');
  expect((await GET().json()).commitSha).toBeNull();
});
