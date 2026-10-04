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

export type PurgeReceipt = {
  receiptId: string;
  purgedAt: string;
  deletionChecksum: string;
  tombstoneChecksum: string;
};

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

function instant(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(label + ' must be an ISO timestamp');
  return parsed;
}

function digest(value: unknown): string {
  return 'sha256:' + createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function canonicalForPurge(tombstone: ContentDeletionTombstone) {
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

function validateBackup(backup: VerifiedBackupReceipt, requestedAt: string, purgeAfter: string) {
  if (!backup.backupId || !checksumPattern.test(backup.checksum)) throw new Error('Verified backup receipt is invalid');
  const verifiedAt = instant(backup.verifiedAt, 'backup.verifiedAt');
  const expiresAt = instant(backup.expiresAt, 'backup.expiresAt');
  if (verifiedAt > instant(requestedAt, 'requestedAt')) throw new Error('Backup verification must precede deletion request');
  if (expiresAt > instant(purgeAfter, 'purgeAfter')) throw new Error('Backup retention must not exceed purge deadline');
}

function normalizeTargets(targets: ProviderDeletionTarget[]): ProviderDeletionTarget[] {
  const seen = new Set<string>();
  return [...targets].map((target) => {
    const key = target.system.trim();
    if (!key || !target.resourceRef.trim()) throw new Error('Provider deletion target identity is required');
    if (seen.has(key)) throw new Error('Provider deletion targets must be unique by system');
    seen.add(key);
    if (target.state === 'confirmed') {
      if (!target.receiptId || !target.confirmedAt || !target.receiptChecksum || !checksumPattern.test(target.receiptChecksum)) {
        throw new Error('Confirmed provider deletion target requires a complete receipt');
      }
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
    providerTargets: normalizeTargets(input.providerTargets),
    purgeReceipt: null,
  };
}

export function restoreContentDeletion(tombstone: ContentDeletionTombstone, restoredAt: string): ContentDeletionTombstone {
  if (tombstone.state !== 'retained_for_restore') throw new Error('Only retained deletion tombstones can be restored');
  const restored = instant(restoredAt, 'restoredAt');
  if (restored > instant(tombstone.restoreUntil, 'restoreUntil')) throw new Error('Restore window expired');
  return { ...tombstone, state: 'restored', restoredAt, purgeReceipt: null };
}

export function recordProviderDeletionReceipt(
  tombstone: ContentDeletionTombstone,
  system: string,
  receipt: { receiptId: string; confirmedAt: string; receiptChecksum: string },
): ContentDeletionTombstone {
  if (tombstone.state !== 'retained_for_restore') throw new Error('Provider deletion receipts require an active tombstone');
  if (!receipt.receiptId || !checksumPattern.test(receipt.receiptChecksum)) throw new Error('Provider deletion receipt is invalid');
  instant(receipt.confirmedAt, 'provider confirmedAt');
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
  if (tombstone.state !== 'retained_for_restore') return false;
  if (instant(now, 'now') < instant(tombstone.purgeAfter, 'purgeAfter')) return false;
  return tombstone.providerTargets.every((target) => target.state === 'confirmed' || target.state === 'not_applicable');
}

export function finalizeContentDeletionPurge(
  tombstone: ContentDeletionTombstone,
  purgedAt: string,
  deletionChecksum: string,
): ContentDeletionTombstone {
  if (!checksumPattern.test(deletionChecksum)) throw new Error('Deletion checksum must be sha256');
  if (!isContentDeletionPurgeReady(tombstone, purgedAt)) {
    throw new Error('Deletion purge is not ready: deadline or provider receipts incomplete');
  }
  const purged: ContentDeletionTombstone = {
    ...tombstone,
    state: 'purged',
    restoredAt: null,
    purgeReceipt: null,
  };
  const tombstoneChecksum = digest(canonicalForPurge(purged));
  purged.purgeReceipt = {
    receiptId: 'purge_' + tombstoneChecksum.slice('sha256:'.length, 'sha256:'.length + 32),
    purgedAt,
    deletionChecksum,
    tombstoneChecksum,
  };
  return purged;
}

export function verifyContentPurgeReceipt(tombstone: ContentDeletionTombstone): boolean {
  if (tombstone.state !== 'purged' || !tombstone.purgeReceipt) return false;
  if (!checksumPattern.test(tombstone.purgeReceipt.deletionChecksum)) return false;
  return tombstone.purgeReceipt.tombstoneChecksum === digest(canonicalForPurge(tombstone));
}
