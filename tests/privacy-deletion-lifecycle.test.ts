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

it('binds every purge receipt field to the verified checksum', () => {
  const tombstone = fixture();
  const confirmed = recordProviderDeletionReceipt(tombstone, 'search-index', { receiptId: 'provider-receipt', confirmedAt: '2026-11-02T01:00:00.000Z', receiptChecksum: sha('provider') });
  const purged = finalizeContentDeletionPurge(confirmed, '2026-11-03T00:00:00.000Z', sha('deleted'));
  expect(verifyContentPurgeReceipt(purged)).toBe(true);
  for (const change of [{ receiptId: 'forged' }, { purgedAt: '2026-11-04T00:00:00.000Z' }, { deletionChecksum: sha('other') }]) {
    expect(verifyContentPurgeReceipt({ ...purged, purgeReceipt: { ...purged.purgeReceipt!, ...change } })).toBe(false);
  }
});

it('rejects pre-deletion restore and provider receipt times', () => {
  expect(() => restoreContentDeletion(fixture(), '2026-10-01T00:00:00.000Z')).toThrow('follow deletion request');
  expect(() => recordProviderDeletionReceipt(fixture(), 'search-index', { receiptId: 'provider', confirmedAt: '2026-10-01T00:00:00.000Z', receiptChecksum: sha('provider') })).toThrow('follow deletion request');
});


it('purge readiness does not trust a confirmed state without its complete provider proof', () => {
  const initial = fixture();
  const forged = { ...initial, providerTargets: initial.providerTargets.map((target) => target.system === 'search-index'
    ? { ...target, state: 'confirmed' as const, receiptId: 'forged', confirmedAt: '2026-11-02T01:00:00.000Z', receiptChecksum: null }
    : target) };
  expect(isContentDeletionPurgeReady(forged, '2026-11-03T00:00:00.000Z')).toBe(false);
  expect(() => finalizeContentDeletionPurge(forged, '2026-11-03T00:00:00.000Z', sha('deleted'))).toThrow('not ready');
});

it('purge readiness rechecks receipt time even for a mutated stored target', () => {
  const initial = fixture();
  const forged = { ...initial, providerTargets: initial.providerTargets.map((target) => target.system === 'search-index'
    ? { ...target, state: 'confirmed' as const, receiptId: 'forged', confirmedAt: '2026-10-01T00:00:00.000Z', receiptChecksum: sha('forged-proof') }
    : target) };
  expect(isContentDeletionPurgeReady(forged, '2026-11-03T00:00:00.000Z')).toBe(false);
});

// A re-hashed, internally consistent receipt is not evidence of provider
// deletion, chronological eligibility, or an unbroken confirmation chain.
function resealPurgeForAdversarialFixture(purged: ReturnType<typeof finalizeContentDeletionPurge>) {
  const receipt = purged.purgeReceipt!;
  const canonical = {
    schemaVersion: purged.schemaVersion, tombstoneId: purged.tombstoneId,
    ownerId: purged.ownerId, entityType: purged.entityType, entityId: purged.entityId,
    requestedAt: purged.requestedAt, restoreUntil: purged.restoreUntil,
    purgeAfter: purged.purgeAfter, state: 'purged', restoredAt: null,
    backup: purged.backup, providerTargets: purged.providerTargets,
  };
  const checksum = sha(JSON.stringify({ tombstone: canonical, purgedAt: receipt.purgedAt,
    deletionChecksum: receipt.deletionChecksum }));
  return { ...purged, purgeReceipt: { ...receipt, tombstoneChecksum: checksum,
    receiptId: 'purge_' + checksum.slice('sha256:'.length, 'sha256:'.length + 32) } };
}
function verifiedPurgeForAdversarialFixture() {
  const confirmed = recordProviderDeletionReceipt(fixture(), 'search-index', {
    receiptId: 'provider-valid', confirmedAt: '2026-11-02T01:00:00.000Z',
    receiptChecksum: sha('provider-valid'),
  });
  return finalizeContentDeletionPurge(confirmed, '2026-11-03T00:00:00.000Z', sha('records-deleted'));
}

it('rehashed receipt never proves an early purge before the approved deadline', () => {
  const valid = verifiedPurgeForAdversarialFixture();
  const forged = resealPurgeForAdversarialFixture({ ...valid,
    purgeReceipt: { ...valid.purgeReceipt!, purgedAt: '2026-10-04T00:00:00.000Z' } });
  expect(verifyContentPurgeReceipt(forged)).toBe(false);
});

it('rehashed receipt never proves a provider confirmation dated after purge', () => {
  const valid = verifiedPurgeForAdversarialFixture();
  const forged = resealPurgeForAdversarialFixture({ ...valid,
    providerTargets: valid.providerTargets.map(target => target.system === 'search-index'
      ? { ...target, confirmedAt: '2026-11-05T00:00:00.000Z' } : target) });
  expect(verifyContentPurgeReceipt(forged)).toBe(false);
});

it('rehashed receipt never substitutes for a missing provider checksum', () => {
  const valid = verifiedPurgeForAdversarialFixture();
  const forged = resealPurgeForAdversarialFixture({ ...valid,
    providerTargets: valid.providerTargets.map(target => target.system === 'search-index'
      ? { ...target, receiptChecksum: null } : target) });
  expect(verifyContentPurgeReceipt(forged)).toBe(false);
});
