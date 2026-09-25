import { describe, expect, it } from 'vitest';
import { assertIntegrationActivation, createContentIntegrationEnvelope, verifyContentIntegrationEnvelope } from '../src/integrations/envelope.js';

describe('versioned Content integration envelope', () => {
  const envelope = createContentIntegrationEnvelope({
    requestId: 'r1', traceId: 't1', idempotencyKey: 'i1',
    producer: 'urai-content', consumer: 'urai-spatial',
    mode: 'synthetic', contentId: 'c1', contentVersion: '1',
    locale: 'en', provenanceRecordId: 'p1', consentRecordId: null,
    payload: { assetIds: ['a1'] }
  });

  it('binds payload integrity and contract identity', () => {
    expect(verifyContentIntegrationEnvelope(envelope)).toBe(true);
    expect(verifyContentIntegrationEnvelope({ ...envelope, payload: { assetIds: ['changed'] } })).toBe(false);
  });

  it('fails closed when a caller exceeds the authorized activation mode', () => {
    expect(() => assertIntegrationActivation(envelope, 'disabled')).toThrow('exceeds authorized');
    expect(() => assertIntegrationActivation(envelope, 'synthetic')).not.toThrow();
  });
});
