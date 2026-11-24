import { createHash } from 'node:crypto';

export type ProviderDeletionState = 'pending' | 'confirmed' | 'not_applicable';
export type DeletionState = 'retained_for_restore' | 'restored' | 'purged';

export type VerifiedBackupReceipt = {
  backupId: string;
  checksum: string;
  verifiedAt: string;
  expiresAt: string;
};

export type ProviderDeletionTarget = {
  system: string;
  resourceRef: string;
  state: ProviderDeletionState;
  receiptId: string | null;
  receiptChecksum: string | null;
  confirmedAt: string | null;
};

const purgeReceiptVersion = 'urai-content-purge-receipt-v2' as const;

export type PurgeReceipt = {
  receiptId: string;
  purgedAt: string;
  deletionChecksum: string;
  tombstoneChecksum: string;
} & (
  | { schemaVersion?: undefined; receiptChecksum?: undefined }
  | { schemaVersion: typeof purgeReceiptVersion; receiptChecksum: string }
);

export type ContentPurgeReceiptEvidence = 'local_result_verified' | 'legacy_tombstone_only' | 'invalid';

export type ContentDeletionTombstone = {
  schemaVersion: 'urai-content-deletion-tombstone-v1';
  tombstoneId: string;
  ownerId: string;
  entityType: string;
  entityId: string;
  requestedAt: string;
  restoreUntil: string;
  purgeAfter: string;
  state: DeletionState;
  restoredAt: string | null;
  backup: VerifiedBackupReceipt;
  providerTargets: ProviderDeletionTarget[];
  purgeReceipt: PurgeReceipt | null;
};

const checksumPattern = /^sha256:[a-f0-9]{64}$/i;

function validChecksum(value: unknown): value is string {
  return typeof value === 'string' && checksumPattern.test(value);
}

function purgeId(checksum: string): string {
  const hexOffset = 'sha256:'.length;
  return 'purge_' + checksum.slice(hexOffset, hexOffset + 32);
}

function instant(value: string, label: string): number {
  if (typeof value !== 'string') throw new Error(label + ' must be an ISO timestamp');
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(label + ' must be an ISO timestamp');
  return parsed;
}

function digest(value: unknown): string {
  return 'sha256:' + createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function legacyPurgeSnapshot(tombstone: ContentDeletionTombstone) {
  return {
    schemaVersion: tombstone.schemaVersion,
    tombstoneId: tombstone.tombstoneId,
    ownerId: tombstone.ownerId,
    entityType: tombstone.entityType,
    entityId: tombstone.entityId,
    requestedAt: tombstone.requestedAt,
    restoreUntil: tombstone.restoreUntil,
    purgeAfter: tombstone.purgeAfter,
    state: 'purged' as const,
    restoredAt: null,
    backup: tombstone.backup,
    providerTargets: tombstone.providerTargets,
  };
}

// Schema-defined field order keeps database map key ordering out of the v2 hash.
function purgeResult(tombstone: ContentDeletionTombstone, purgedAt: string, deletionChecksum: string) {
  const { backup, providerTargets } = tombstone;
  const snapshot = {
    ...legacyPurgeSnapshot(tombstone),
    backup: { backupId: backup.backupId, checksum: backup.checksum, verifiedAt: backup.verifiedAt, expiresAt: backup.expiresAt },
    providerTargets: providerTargets.map(({ system, resourceRef, state, receiptId, receiptChecksum, confirmedAt }) =>
      ({ system, resourceRef, state, receiptId, receiptChecksum, confirmedAt })
    ).sort((a, b) => a.system < b.system ? -1 : a.system > b.system ? 1 : 0),
  };
  const tombstoneChecksum = digest(snapshot);
  const result = { schemaVersion: purgeReceiptVersion, tombstoneChecksum, purgedAt, deletionChecksum };
  const receiptId = purgeId(digest(result));
  return { ...result, receiptId, receiptChecksum: digest({ ...result, receiptId }) };
}

function validateBackup(backup: VerifiedBackupReceipt, requestedAt: string, purgeAfter: string) {
  if (!backup.backupId || !validChecksum(backup.checksum)) throw new Error('Verified backup receipt is invalid');
  const verifiedAt = instant(backup.verifiedAt, 'backup.verifiedAt');
  const expiresAt = instant(backup.expiresAt, 'backup.expiresAt');
  if (verifiedAt > instant(requestedAt, 'requestedAt')) throw new Error('Backup verification must precede deletion request');
  if (expiresAt < verifiedAt) throw new Error('Backup expiry cannot precede verification');
  if (expiresAt > instant(purgeAfter, 'purgeAfter')) throw new Error('Backup retention must not exceed purge deadline');
}

function normalizeTargets(targets: ProviderDeletionTarget[], requestedAt: number): ProviderDeletionTarget[] {
  const seen = new Set<string>();
  return [...targets].map((target) => {
    const key = target.system.trim();
    if (!key || !target.resourceRef.trim()) throw new Error('Provider deletion target identity is required');
    if (seen.has(key)) throw new Error('Provider deletion targets must be unique by system');
    seen.add(key);
    if (target.state === 'confirmed') {
      if (!target.receiptId || !target.confirmedAt || !target.receiptChecksum || !validChecksum(target.receiptChecksum)) {
        throw new Error('Confirmed provider deletion target requires a complete receipt');
      }
      if (instant(target.confirmedAt, 'provider confirmedAt') < requestedAt) throw new Error('Provider confirmation precedes the deletion request');
    } else if (target.state !== 'pending' && target.state !== 'not_applicable') {
      throw new Error('Unknown provider deletion state');
    } else if (target.receiptId || target.confirmedAt || target.receiptChecksum) {
      throw new Error('Unconfirmed provider deletion target cannot carry a receipt');
    }
    return { ...target, system: key, resourceRef: target.resourceRef.trim() };
  }).sort((a, b) => a.system.localeCompare(b.system));
}

export function createContentDeletionTombstone(input: Omit<ContentDeletionTombstone,
  'schemaVersion' | 'state' | 'restoredAt' | 'purgeReceipt' | 'providerTargets'> & {
    providerTargets: ProviderDeletionTarget[];
  }): ContentDeletionTombstone {
  if (!input.tombstoneId || !input.ownerId || !input.entityType || !input.entityId) {
    throw new Error('Deletion tombstone identity is required');
  }
  const requestedAt = instant(input.requestedAt, 'requestedAt');
  const restoreUntil = instant(input.restoreUntil, 'restoreUntil');
  const purgeAfter = instant(input.purgeAfter, 'purgeAfter');
  if (restoreUntil <= requestedAt) throw new Error('Restore window must follow deletion request');
  if (purgeAfter < restoreUntil) throw new Error('Purge deadline must not precede restore deadline');
  validateBackup(input.backup, input.requestedAt, input.purgeAfter);

  return {
    schemaVersion: 'urai-content-deletion-tombstone-v1',
    tombstoneId: input.tombstoneId,
    ownerId: input.ownerId,
    entityType: input.entityType,
    entityId: input.entityId,
    requestedAt: input.requestedAt,
    restoreUntil: input.restoreUntil,
    purgeAfter: input.purgeAfter,
    state: 'retained_for_restore',
    restoredAt: null,
    backup: { ...input.backup },
    providerTargets: normalizeTargets(input.providerTargets, requestedAt),
    purgeReceipt: null,
  };
}

export function restoreContentDeletion(tombstone: ContentDeletionTombstone, restoredAt: string): ContentDeletionTombstone {
  if (tombstone.state !== 'retained_for_restore') throw new Error('Only retained deletion tombstones can be restored');
  const restored = instant(restoredAt, 'restoredAt');
  if (restored < instant(tombstone.requestedAt, 'requestedAt')) throw new Error('Restore precedes the deletion request');
  if (restored > instant(tombstone.restoreUntil, 'restoreUntil')) throw new Error('Restore window expired');
  return { ...tombstone, state: 'restored', restoredAt, purgeReceipt: null };
}

export function recordProviderDeletionReceipt(
  tombstone: ContentDeletionTombstone,
  system: string,
  receipt: { receiptId: string; confirmedAt: string; receiptChecksum: string },
): ContentDeletionTombstone {
  if (tombstone.state !== 'retained_for_restore') throw new Error('Provider deletion receipts require an active tombstone');
  if (!receipt.receiptId || !validChecksum(receipt.receiptChecksum)) throw new Error('Provider deletion receipt is invalid');
  if (instant(receipt.confirmedAt, 'provider confirmedAt') < instant(tombstone.requestedAt, 'requestedAt')) {
    throw new Error('Provider confirmation precedes the deletion request');
  }
  let matched = false;
  const providerTargets = tombstone.providerTargets.map((target) => {
    if (target.system !== system) return target;
    matched = true;
    if (target.state === 'not_applicable') throw new Error('Not-applicable provider target cannot receive a deletion receipt');
    return {
      ...target,
      state: 'confirmed' as const,
      receiptId: receipt.receiptId,
      receiptChecksum: receipt.receiptChecksum,
      confirmedAt: receipt.confirmedAt,
    };
  });
  if (!matched) throw new Error('Unknown provider deletion target');
  return { ...tombstone, providerTargets };
}

export function isContentDeletionPurgeReady(tombstone: ContentDeletionTombstone, now: string): boolean {
  if (tombstone.schemaVersion !== 'urai-content-deletion-tombstone-v1' || tombstone.state !== 'retained_for_restore'
    || tombstone.restoredAt !== null || tombstone.purgeReceipt !== null) return false;
  const purgedAt = instant(now, 'now');
  // Revalidate persisted input through the same admission rules as a newly created tombstone.
  const validated = createContentDeletionTombstone(tombstone);
  if (purgedAt < instant(validated.purgeAfter, 'purgeAfter')) return false;
  return validated.providerTargets.every((target) => target.state === 'not_applicable'
    || (target.state === 'confirmed' && target.confirmedAt !== null && instant(target.confirmedAt, 'provider confirmedAt') <= purgedAt));
}

export function finalizeContentDeletionPurge(
  tombstone: ContentDeletionTombstone,
  purgedAt: string,
  deletionChecksum: string,
): ContentDeletionTombstone {
  if (!validChecksum(deletionChecksum)) throw new Error('Deletion checksum must be sha256');
  if (!isContentDeletionPurgeReady(tombstone, purgedAt)) {
    throw new Error('Deletion purge is not ready: deadline or provider receipts incomplete');
  }
  const purged: ContentDeletionTombstone = {
    ...tombstone,
    state: 'purged',
    restoredAt: null,
    purgeReceipt: null,
  };
  purged.purgeReceipt = purgeResult(purged, purgedAt, deletionChecksum);
  return purged;
}

export function inspectContentPurgeReceipt(tombstone: ContentDeletionTombstone): ContentPurgeReceiptEvidence {
  try {
    const receipt = tombstone.purgeReceipt;
    if (tombstone.schemaVersion !== 'urai-content-deletion-tombstone-v1' || tombstone.state !== 'purged'
      || tombstone.restoredAt !== null || !receipt || !validChecksum(receipt.deletionChecksum)) return 'invalid';

    if (!('schemaVersion' in receipt) && !('receiptChecksum' in receipt)) {
      const legacyChecksum = digest(legacyPurgeSnapshot(tombstone));
      const legacyId = purgeId(legacyChecksum);
      return receipt.tombstoneChecksum === legacyChecksum && receipt.receiptId === legacyId ? 'legacy_tombstone_only' : 'invalid';
    }
    if (receipt.schemaVersion !== purgeReceiptVersion) return 'invalid';
    const retained = { ...tombstone, state: 'retained_for_restore' as const, purgeReceipt: null };
    if (!isContentDeletionPurgeReady(retained, receipt.purgedAt)) return 'invalid';
    const expected = purgeResult(tombstone, receipt.purgedAt, receipt.deletionChecksum);
    return expected.receiptId === receipt.receiptId && expected.tombstoneChecksum === receipt.tombstoneChecksum
      && expected.receiptChecksum === receipt.receiptChecksum ? 'local_result_verified' : 'invalid';
  } catch {
    return 'invalid';
  }
}

export function verifyContentPurgeReceipt(tombstone: ContentDeletionTombstone): boolean {
  return inspectContentPurgeReceipt(tombstone) === 'local_result_verified';
}
