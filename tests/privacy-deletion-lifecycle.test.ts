import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  createContentDeletionTombstone,
  finalizeContentDeletionPurge,
  inspectContentPurgeReceipt,
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

function confirmedFixture() {
  return recordProviderDeletionReceipt(fixture(), 'search-index', {
    receiptId: 'provider-receipt-1', confirmedAt: '2026-11-02T01:00:00.000Z', receiptChecksum: sha('provider-delete'),
  });
}

const completedAt = '2026-11-03T00:00:00.000Z';
const resultHash = sha('deleted-records');

function finalReceipt() {
  const tombstone = finalizeContentDeletionPurge(confirmedFixture(), completedAt, resultHash);
  const receipt = tombstone.purgeReceipt;
  if (receipt?.schemaVersion !== 'urai-content-purge-receipt-v2') throw new Error('Expected a versioned purge receipt');
  return { tombstone, receipt };
}

describe('versioned local purge evidence', () => {
  it.each([
    ['receiptId', 'purge_replaced'],
    ['purgedAt', '2026-11-04T00:00:00.000Z'],
    ['deletionChecksum', sha('another result')],
    ['tombstoneChecksum', sha('another tombstone')],
    ['receiptChecksum', sha('another envelope')],
    ['schemaVersion', 'unknown-version'],
  ])('rejects a changed %s through the public verifier', (field, value) => {
    const { tombstone, receipt } = finalReceipt();
    const altered = { ...tombstone, purgeReceipt: { ...receipt, [field]: value } };
    expect(inspectContentPurgeReceipt(altered)).toBe('invalid');
    expect(verifyContentPurgeReceipt(altered)).toBe(false);
  });

  it('keeps result identity deterministic across deserialization and distinguishes different results', () => {
    const { tombstone, receipt } = finalReceipt();
    expect(inspectContentPurgeReceipt(tombstone)).toBe('local_result_verified');
    expect(finalizeContentDeletionPurge(confirmedFixture(), completedAt, resultHash).purgeReceipt).toEqual(receipt);
    const reverseKeys = <T extends object>(value: T) => Object.fromEntries(Object.entries(value).reverse()) as T;
    const reordered = { ...tombstone, backup: reverseKeys(tombstone.backup), providerTargets: tombstone.providerTargets.map(reverseKeys).reverse() };
    expect(verifyContentPurgeReceipt(JSON.parse(JSON.stringify(reordered)))).toBe(true);
    expect(finalizeContentDeletionPurge(confirmedFixture(), '2026-11-04T00:00:00.000Z', resultHash).purgeReceipt?.receiptId).not.toBe(receipt.receiptId);
    expect(finalizeContentDeletionPurge(confirmedFixture(), completedAt, sha('new result')).purgeReceipt?.receiptId).not.toBe(receipt.receiptId);
  });

  it('reads an original v1 receipt as tombstone-only evidence and never grants full verification', () => {
    const { tombstone, receipt } = finalReceipt();
    // Produced by the original finalizeContentDeletionPurge at 88a68338, before v2.
    const legacy = { receiptId: 'purge_fdbb67403b38b6a98398559e20415197', purgedAt: completedAt,
      deletionChecksum: resultHash, tombstoneChecksum: 'sha256:fdbb67403b38b6a98398559e2041519748dac28ee5e69d8109afdfb645544eec' };
    expect(inspectContentPurgeReceipt({ ...tombstone, purgeReceipt: legacy })).toBe('legacy_tombstone_only');
    expect(verifyContentPurgeReceipt({ ...tombstone, purgeReceipt: legacy })).toBe(false);
    expect(inspectContentPurgeReceipt({ ...tombstone, entityId: 'different', purgeReceipt: legacy })).toBe('invalid');
    const stripped = { receiptId: receipt.receiptId, purgedAt: receipt.purgedAt, deletionChecksum: receipt.deletionChecksum, tombstoneChecksum: receipt.tombstoneChecksum };
    expect(inspectContentPurgeReceipt({ ...tombstone, purgeReceipt: stripped })).toBe('invalid');
  });

  it('enforces the request, restore, provider confirmation and purge boundaries including equal cutoffs', () => {
    const t = fixture(); const preRequest = '2026-10-02T23:59:00.000Z';
    const confirmation = { receiptId: 'provider', confirmedAt: preRequest, receiptChecksum: sha('provider') };
    expect(() => recordProviderDeletionReceipt(t, 'search-index', confirmation)).toThrow('precedes');
    expect(() => restoreContentDeletion(t, preRequest)).toThrow('precedes');
    expect(isContentDeletionPurgeReady(confirmedFixture(), '2026-11-02T00:30:00.000Z')).toBe(false);
    expect(() => finalizeContentDeletionPurge(confirmedFixture(), '2026-11-02T00:30:00.000Z', resultHash)).toThrow('not ready');
    const atBoundary = recordProviderDeletionReceipt(t, 'search-index', { ...confirmation, confirmedAt: t.purgeAfter });
    expect(verifyContentPurgeReceipt(finalizeContentDeletionPurge(atBoundary, t.purgeAfter, resultHash))).toBe(true);
    expect(() => createContentDeletionTombstone({ ...t, backup: { ...t.backup, expiresAt: preRequest, verifiedAt: t.requestedAt } })).toThrow('expiry');
  });
});
