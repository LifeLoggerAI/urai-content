import { describe, expect, it, vi, afterEach } from 'vitest';
import { isPrivateContentMutationHeld, PRIVATE_MUTATION_HOLD_ERROR } from '../src/server/privacy/privateMutationHold';

afterEach(() => vi.unstubAllEnvs());

describe('Content private mutation persistence boundary', () => {
  it('blocks every production mode regardless of persistence', () => {
    for (const mode of ['firestore', 'memory', undefined] as const) {
      expect(isPrivateContentMutationHeld('production', mode)).toBe(true);
    }
    expect(PRIVATE_MUTATION_HOLD_ERROR).toBe('private_mutation_fence_unavailable');
  });
  it('admits only explicit development/test in-memory fixtures', () => {
    expect(isPrivateContentMutationHeld('test', 'memory')).toBe(false);
    expect(isPrivateContentMutationHeld('development', 'memory')).toBe(false);
  });
  it('blocks Firestore even if runtime is mislabeled development or test', () => {
    for (const runtime of ['test', 'development', 'production']) {
      expect(isPrivateContentMutationHeld(runtime, 'firestore')).toBe(true);
    }
  });
  it('blocks unknown runtime and missing persistence identity', () => {
    for (const runtime of [undefined, '', 'preview', 'staging', 'test ', 'Development']) {
      expect(isPrivateContentMutationHeld(runtime, 'memory')).toBe(true);
    }
    expect(isPrivateContentMutationHeld('test')).toBe(true);
    expect(isPrivateContentMutationHeld('development')).toBe(true);
  });
  it('ignores legacy and forged environment feature toggles', () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('URAI_CONTENT_PRIVATE_MUTATIONS_ENABLED', 'true');
    vi.stubEnv('URAI_CONTENT_CONSENT_FENCE_VERIFIED', 'true');
    expect(isPrivateContentMutationHeld(undefined, 'firestore')).toBe(true);
    expect(isPrivateContentMutationHeld(undefined, 'memory')).toBe(true);
    expect(isPrivateContentMutationHeld('test', 'firestore')).toBe(true);
  });
});
