import { describe, expect, it } from 'vitest';
import { evaluateGenerationDispatch, generationIdempotencyKey } from '../src/generation/contracts.js';

const base = {
  requestId: 'gen-1',
  kind: 'image' as const,
  providerMode: 'provider' as const,
  sourceRefs: ['b', 'a', 'a'],
  provenanceRecordId: 'prov-1',
  consentRecordId: null,
  maxCalls: 2,
  maxSpendUsd: 2,
  explicitProviderAuthorization: false,
};

describe('provider-neutral generation governance', () => {
  it('fails closed without explicit provider authorization', () => {
    expect(evaluateGenerationDispatch(base)).toMatchObject({ allowed: false, callLimit: 0, spendLimitUsd: 0 });
  });

  it('keeps mock execution non-billable and derives stable idempotency', () => {
    const mock = evaluateGenerationDispatch({ ...base, providerMode: 'mock', maxCalls: 10, maxSpendUsd: 99 });
    expect(mock).toMatchObject({ allowed: true, spendLimitUsd: 0 });
    expect(generationIdempotencyKey(base)).toBe(generationIdempotencyKey({ ...base, sourceRefs: ['a', 'b'] }));
  });

  it('allows provider dispatch only inside explicit positive limits', () => {
    expect(evaluateGenerationDispatch({ ...base, explicitProviderAuthorization: true })).toMatchObject({
      allowed: true,
      callLimit: 2,
      spendLimitUsd: 2,
    });
  });
});
