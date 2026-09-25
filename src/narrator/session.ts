export type NarratorMode = 'silent' | 'captions_only' | 'text' | 'tts_preview';

export type NarratorSession = {
  sessionId: string;
  subjectId: string;
  promptId: string;
  mode: NarratorMode;
  synthetic: true;
  consent: 'granted' | 'denied' | 'revoked';
  quietHours: boolean;
  provider: 'none' | 'browser' | 'mock';
  sourceRefs: string[];
  memoryContext: Array<{ ref: string; excerpt?: string }>;
};

export function createNarratorSession(input: NarratorSession): NarratorSession {
  if (!input.sessionId || !input.subjectId || !input.promptId) {
    throw new Error('Narrator session identity is required');
  }
  if (input.synthetic !== true) throw new Error('Prelaunch narrator sessions must be synthetic');
  if (input.consent !== 'granted' && input.mode === 'tts_preview') {
    throw new Error('TTS preview requires consent');
  }
  if (input.quietHours && input.mode === 'tts_preview') {
    throw new Error('TTS preview is disabled during quiet hours');
  }

  return {
    ...input,
    sourceRefs: [...new Set(input.sourceRefs)].sort(),
    memoryContext: input.memoryContext.map((entry) => ({ ...entry })),
  };
}

export function narratorOutputContract(session: NarratorSession, text: string) {
  const normalized = text.trim();
  if (!normalized) throw new Error('Narrator output text is required');

  const spoken = session.mode === 'tts_preview';
  return {
    version: '1.0.0',
    sessionId: session.sessionId,
    text: normalized,
    caption: normalized,
    transcript: normalized,
    spoken,
    providerDispatchAllowed: false,
    personalizedVoiceAllowed: false,
    provenance: {
      promptId: session.promptId,
      sourceRefs: session.sourceRefs,
      synthetic: true,
    },
    accessibility: {
      captionsRequired: spoken,
      textEquivalentRequired: true,
      silenceModeAvailable: true,
    },
  };
}

export function shouldNarratorRemainSilent(session: NarratorSession): boolean {
  return (
    session.mode === 'silent' ||
    session.consent !== 'granted' ||
    (session.quietHours && session.mode !== 'captions_only' && session.mode !== 'text')
  );
}
