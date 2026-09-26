import { describe, expect, it } from 'vitest';
import { transitionContentJob, validateContentJob, type ContentJob } from '../src/jobs/contentJobs.js';

const job: ContentJob = {
  id: 'job-1', kind: 'export', status: 'queued', requestId: 'req-1', traceId: 'trace-1',
  idempotencyKey: 'idem-1', ownerId: 'synthetic-user', provenanceRecordId: 'prov-1',
  attempt: 0, maxAttempts: 3, leaseExpiresAt: null, timeoutAt: null, cancelledAt: null,
  deadLetteredAt: null, retentionUntil: null, resultChecksum: null, measuredCostUsd: null, safeErrorCode: null
};

describe('durable content job contract', () => {
  it('enforces lifecycle transitions and cancellation receipts', () => {
    const leased = transitionContentJob(job, 'leased', '2026-09-23T00:00:00.000Z');
    const running = transitionContentJob(leased, 'running', '2026-09-23T00:01:00.000Z');
    const cancelled = transitionContentJob(running, 'cancelled', '2026-09-23T00:02:00.000Z');
    expect(cancelled.cancelledAt).toBe('2026-09-23T00:02:00.000Z');
    expect(() => transitionContentJob(cancelled, 'queued', '2026-09-23T00:03:00.000Z')).toThrow('Invalid');
  });

  it('requires checksums for success and dead-letters exhausted work', () => {
    expect(() => validateContentJob({ ...job, status: 'succeeded' })).toThrow('result checksum');
    const failed = { ...job, status: 'failed' as const, attempt: 2 };
    expect(() => transitionContentJob(failed, 'queued', '2026-09-23T00:00:00.000Z')).toThrow('Retry limit exhausted');
    expect(validateContentJob({ ...failed, status: 'dead_letter', deadLetteredAt: '2026-09-23T00:00:00.000Z' }).status).toBe('dead_letter');
  });
});
