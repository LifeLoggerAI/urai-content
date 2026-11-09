import { describe, expect, it, vi, afterEach } from 'vitest';
import { isPrivateContentMutationHeld, PRIVATE_MUTATION_HOLD_ERROR } from '../src/server/privacy/privateMutationHold';

afterEach(() => vi.unstubAllEnvs());

describe('Content private mutation production interlock', () => {
  it('blocks production private writes unconditionally', () => {
    expect(isPrivateContentMutationHeld('production')).toBe(true);
    expect(PRIVATE_MUTATION_HOLD_ERROR).toBe('private_mutation_fence_unavailable');
  });
  it('does not mistake preview/test execution for production', () => {
    expect(isPrivateContentMutationHeld('test')).toBe(false);
    expect(isPrivateContentMutationHeld('development')).toBe(false);
  });
  it('cannot be enabled through any legacy environment toggle', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('URAI_CONTENT_PRIVATE_MUTATIONS_ENABLED', 'true');
    vi.stubEnv('URAI_CONTENT_CONSENT_FENCE_VERIFIED', 'true');
    expect(isPrivateContentMutationHeld()).toBe(true);
  });
  it('fails closed when the server is running in production despite browser-provided claims', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(isPrivateContentMutationHeld()).toBe(true);
  });
});
