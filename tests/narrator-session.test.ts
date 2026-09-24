import { describe, expect, it } from 'vitest';
import {
  createNarratorSession,
  narratorOutputContract,
  shouldNarratorRemainSilent,
} from '../src/narrator/session.js';

describe('provider-neutral narrator session', () => {
  it('keeps provider dispatch and personalized voice disabled', () => {
    const session = createNarratorSession({
      sessionId: 'narrator-synthetic-1',
      subjectId: 'synthetic-user',
      promptId: 'np-quiet-01',
      mode: 'tts_preview',
      synthetic: true,
      consent: 'granted',
      quietHours: false,
      provider: 'mock',
      sourceRefs: ['memory-2', 'memory-1', 'memory-1'],
      memoryContext: [{ ref: 'memory-1', excerpt: 'Synthetic memory context.' }],
    });

    const output = narratorOutputContract(session, 'A synthetic reflection.');
    expect(output.providerDispatchAllowed).toBe(false);
    expect(output.personalizedVoiceAllowed).toBe(false);
    expect(output.accessibility.captionsRequired).toBe(true);
    expect(output.provenance.sourceRefs).toEqual(['memory-1', 'memory-2']);
  });

  it('enforces silence and quiet-hours boundaries', () => {
    const silent = createNarratorSession({
      sessionId: 'silent-1',
      subjectId: 'synthetic-user',
      promptId: 'np-quiet-01',
      mode: 'silent',
      synthetic: true,
      consent: 'granted',
      quietHours: true,
      provider: 'none',
      sourceRefs: [],
      memoryContext: [],
    });
    expect(shouldNarratorRemainSilent(silent)).toBe(true);

    expect(() => createNarratorSession({
      ...silent,
      sessionId: 'blocked-tts',
      mode: 'tts_preview',
      quietHours: true,
    })).toThrow('disabled during quiet hours');

    expect(() => createNarratorSession({
      ...silent,
      sessionId: 'revoked-tts',
      mode: 'tts_preview',
      quietHours: false,
      consent: 'revoked',
    })).toThrow('requires consent');
  });
});
