import { createHash } from 'node:crypto';

export type GenerationKind =
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'translation'
  | 'moderation'
  | 'spatial';

export type GenerationProviderMode = 'off' | 'mock' | 'provider';

export type GenerationRequest = {
  requestId: string;
  kind: GenerationKind;
  providerMode: GenerationProviderMode;
  sourceRefs: string[];
  provenanceRecordId: string;
  consentRecordId: string | null;
  maxCalls: number;
  maxSpendUsd: number;
  explicitProviderAuthorization: boolean;
};

export type GenerationDispatchDecision = {
  allowed: boolean;
  reason: string;
  idempotencyKey: string;
  callLimit: number;
  spendLimitUsd: number;
};

function digest(value: unknown): string {
  return 'sha256:' + createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function generationIdempotencyKey(request: GenerationRequest): string {
  return digest({
    requestId: request.requestId,
    kind: request.kind,
    sourceRefs: [...new Set(request.sourceRefs)].sort(),
    provenanceRecordId: request.provenanceRecordId,
  });
}

export function evaluateGenerationDispatch(request: GenerationRequest): GenerationDispatchDecision {
  if (!request.requestId || !request.provenanceRecordId) {
    throw new Error('Generation request identity and provenance are required');
  }
  if (!Number.isInteger(request.maxCalls) || request.maxCalls < 0 || request.maxSpendUsd < 0) {
    throw new Error('Generation limits must be non-negative');
  }

  const idempotencyKey = generationIdempotencyKey(request);

  if (request.providerMode === 'off') {
    return { allowed: false, reason: 'provider mode is off', idempotencyKey, callLimit: 0, spendLimitUsd: 0 };
  }
  if (request.providerMode === 'mock') {
    return { allowed: true, reason: 'mock execution only; no billable provider dispatch', idempotencyKey, callLimit: request.maxCalls, spendLimitUsd: 0 };
  }
  if (!request.explicitProviderAuthorization) {
    return { allowed: false, reason: 'explicit provider authorization is required', idempotencyKey, callLimit: 0, spendLimitUsd: 0 };
  }
  if (request.maxCalls < 1 || request.maxSpendUsd <= 0) {
    return { allowed: false, reason: 'provider dispatch requires positive bounded call and spend limits', idempotencyKey, callLimit: 0, spendLimitUsd: 0 };
  }

  return {
    allowed: true,
    reason: 'explicit bounded provider authorization present',
    idempotencyKey,
    callLimit: request.maxCalls,
    spendLimitUsd: request.maxSpendUsd,
  };
}
