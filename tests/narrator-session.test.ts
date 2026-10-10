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

  it.each(['denied', 'revoked'] as const)('keeps a prepared preview silent after consent becomes %s', (consent) => {
    const session = createNarratorSession({
      sessionId: 'synthetic-preview', subjectId: 'synthetic-user', promptId: 'np-quiet-01',
      mode: 'tts_preview', synthetic: true, consent: 'granted', quietHours: false,
      provider: 'mock', sourceRefs: ['synthetic-ref'], memoryContext: [],
    });
    session.consent = consent;
    const output = narratorOutputContract(session, '  Synthetic text equivalent.  ');
    expect(shouldNarratorRemainSilent(session)).toBe(true);
    expect(output.spoken).toBe(false);
    expect(output.accessibility.captionsRequired).toBe(false);
    expect(output.text).toBe('Synthetic text equivalent.');
    expect(output.caption).toBe(output.text);
    expect(output.transcript).toBe(output.text);
    expect(output.providerDispatchAllowed).toBe(false);
    expect(output.personalizedVoiceAllowed).toBe(false);
  });

  it('keeps a prepared preview silent when quiet hours start before output', () => {
    const session = createNarratorSession({
      sessionId: 'synthetic-preview', subjectId: 'synthetic-user', promptId: 'np-quiet-01',
      mode: 'tts_preview', synthetic: true, consent: 'granted', quietHours: false,
      provider: 'mock', sourceRefs: [], memoryContext: [],
    });
    session.quietHours = true;
    const output = narratorOutputContract(session, 'Synthetic quiet text.');
    expect(shouldNarratorRemainSilent(session)).toBe(true);
    expect(output.spoken).toBe(false);
    expect(output.accessibility.textEquivalentRequired).toBe(true);
    expect(output.providerDispatchAllowed).toBe(false);
    expect(output.personalizedVoiceAllowed).toBe(false);
  });

  it('retains an output provenance snapshot when the session source list later changes', () => {
    const session = createNarratorSession({
      sessionId: 'synthetic-text', subjectId: 'synthetic-user', promptId: 'np-quiet-01',
      mode: 'text', synthetic: true, consent: 'granted', quietHours: false,
      provider: 'none', sourceRefs: ['synthetic-original'], memoryContext: [],
    });
    const output = narratorOutputContract(session, 'Synthetic snapshot.');
    session.sourceRefs[0] = 'synthetic-replacement';
    session.sourceRefs.push('synthetic-later');
    expect(output.provenance.sourceRefs).toEqual(['synthetic-original']);
    output.provenance.sourceRefs.push('synthetic-output-only');
    expect(session.sourceRefs).toEqual(['synthetic-replacement', 'synthetic-later']);
  });
});
