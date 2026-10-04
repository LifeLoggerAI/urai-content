import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  createContentDeletionTombstone,
  finalizeContentDeletionPurge,
  isContentDeletionPurgeReady,
  recordProviderDeletionReceipt,
  restoreContentDeletion,
  verifyContentPurgeReceipt,
} from '../src/privacy/deletionLifecycle.js';

const sha = (value: string) => 'sha256:' + createHash('sha256').update(value).digest('hex');

function fixture() {
  return createContentDeletionTombstone({
    tombstoneId: 'delete-1',
    ownerId: 'user-1',
    entityType: 'creator-submission',
    entityId: 'submission-1',
    requestedAt: '2026-10-03T00:00:00.000Z',
    restoreUntil: '2026-10-10T00:00:00.000Z',
    purgeAfter: '2026-11-02T00:00:00.000Z',
    backup: {
      backupId: 'backup-1',
      checksum: sha('encrypted-backup'),
      verifiedAt: '2026-10-02T23:00:00.000Z',
      expiresAt: '2026-11-02T00:00:00.000Z',
    },
    providerTargets: [
      { system: 'search-index', resourceRef: 'search/submission-1', state: 'pending', receiptId: null, receiptChecksum: null, confirmedAt: null },
      { system: 'external-publisher', resourceRef: 'none', state: 'not_applicable', receiptId: null, receiptChecksum: null, confirmedAt: null },
    ],
  });
}

describe('content deletion lifecycle', () => {
  it('requires a verified backup bounded by the purge deadline', () => {
    expect(() => createContentDeletionTombstone({
      tombstoneId: 'delete-late-backup',
      ownerId: 'user-1',
      entityType: 'creator-submission',
      entityId: 'submission-1',
      requestedAt: '2026-10-03T00:00:00.000Z',
      restoreUntil: '2026-10-10T00:00:00.000Z',
      purgeAfter: '2026-11-02T00:00:00.000Z',
      backup: {
        backupId: 'late-backup',
        checksum: sha('late'),
        verifiedAt: '2026-10-04T00:00:00.000Z',
        expiresAt: '2026-11-02T00:00:00.000Z',
      },
      providerTargets: [],
    })).toThrow('Backup verification must precede deletion request');
  });

  it('supports restore only inside the explicit restore window', () => {
    expect(restoreContentDeletion(fixture(), '2026-10-05T00:00:00.000Z').state).toBe('restored');
    expect(() => restoreContentDeletion(fixture(), '2026-10-11T00:00:00.000Z')).toThrow('Restore window expired');
  });

  it('fails closed until every applicable provider deletion receipt is recorded', () => {
    const tombstone = fixture();
    expect(isContentDeletionPurgeReady(tombstone, '2026-11-03T00:00:00.000Z')).toBe(false);
    expect(() => finalizeContentDeletionPurge(tombstone, '2026-11-03T00:00:00.000Z', sha('deleted'))).toThrow('provider receipts incomplete');

    const confirmed = recordProviderDeletionReceipt(tombstone, 'search-index', {
      receiptId: 'provider-receipt-1',
      confirmedAt: '2026-11-02T01:00:00.000Z',
      receiptChecksum: sha('provider-delete'),
    });
    expect(isContentDeletionPurgeReady(confirmed, '2026-11-03T00:00:00.000Z')).toBe(true);
  });

  it('produces a verifiable immutable purge receipt', () => {
    const confirmed = recordProviderDeletionReceipt(fixture(), 'search-index', {
      receiptId: 'provider-receipt-1',
      confirmedAt: '2026-11-02T01:00:00.000Z',
      receiptChecksum: sha('provider-delete'),
    });
    const purged = finalizeContentDeletionPurge(confirmed, '2026-11-03T00:00:00.000Z', sha('deleted-records'));
    expect(purged.state).toBe('purged');
    expect(verifyContentPurgeReceipt(purged)).toBe(true);
    expect(verifyContentPurgeReceipt({
      ...purged,
      entityId: 'tampered',
    })).toBe(false);
  });
});
