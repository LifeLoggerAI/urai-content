export type ContentJobKind = 'export' | 'media' | 'generation' | 'translation' | 'index' | 'moderation';
export type ContentJobStatus = 'queued' | 'leased' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'dead_letter';

export type ContentJob = {
  id: string;
  kind: ContentJobKind;
  status: ContentJobStatus;
  requestId: string;
  traceId: string;
  idempotencyKey: string;
  ownerId: string;
  provenanceRecordId: string;
  attempt: number;
  maxAttempts: number;
  leaseExpiresAt: string | null;
  timeoutAt: string | null;
  cancelledAt: string | null;
  deadLetteredAt: string | null;
  retentionUntil: string | null;
  resultChecksum: string | null;
  measuredCostUsd: number | null;
  safeErrorCode: string | null;
};

export function validateContentJob(job: ContentJob): ContentJob {
  if (!job.id || !job.requestId || !job.traceId || !job.idempotencyKey || !job.ownerId || !job.provenanceRecordId) {
    throw new Error('Content job identity, ownership, tracing and provenance are required');
  }
  if (!Number.isInteger(job.attempt) || job.attempt < 0 || !Number.isInteger(job.maxAttempts) || job.maxAttempts < 1) {
    throw new Error('Content job attempt limits are invalid');
  }
  if (job.attempt > job.maxAttempts) throw new Error('Content job attempt exceeds maximum');
  if (job.measuredCostUsd !== null && job.measuredCostUsd < 0) throw new Error('Content job cost cannot be negative');
  if (job.status === 'cancelled' && !job.cancelledAt) throw new Error('Cancelled job requires cancelledAt');
  if (job.status === 'dead_letter' && !job.deadLetteredAt) throw new Error('Dead-letter job requires deadLetteredAt');
  if (job.status === 'succeeded' && !job.resultChecksum) throw new Error('Successful job requires result checksum');
  return { ...job };
}

const allowed: Record<ContentJobStatus, ContentJobStatus[]> = {
  queued: ['leased', 'cancelled'],
  leased: ['running', 'queued', 'cancelled'],
  running: ['succeeded', 'failed', 'cancelled'],
  failed: ['queued', 'dead_letter'],
  succeeded: [],
  cancelled: [],
  dead_letter: [],
};

export function transitionContentJob(job: ContentJob, next: ContentJobStatus, now: string): ContentJob {
  validateContentJob(job);
  if (!allowed[job.status].includes(next)) throw new Error('Invalid content job transition ' + job.status + ' -> ' + next);
  const updated: ContentJob = {
    ...job,
    status: next,
    cancelledAt: next === 'cancelled' ? now : job.cancelledAt,
    deadLetteredAt: next === 'dead_letter' ? now : job.deadLetteredAt,
  };
  if (next === 'queued' && job.status === 'failed') {
    const nextAttempt = job.attempt + 1;
    if (nextAttempt >= job.maxAttempts) throw new Error('Retry limit exhausted; dead-letter required');
    updated.attempt = nextAttempt;
  }
  return validateContentJob(updated);
}
