import { createHash } from 'node:crypto';
import { z } from 'zod';
import { parseRuntimeContentRecord, serializeRuntimeContentRecord, type ContentItem } from '../schemas/content.js';
import {
  createContentDeletionTombstone, parseContentDeletionTombstone,
  type ContentDeletionRequest, type ContentDeletionTombstone,
} from '../privacy/deletionLifecycle.js';

export type ContentDeletionRepositoryOptions = { deletionOperationsEnabled?: boolean; now?: () => string };
export type SoftDeleteContentRequest = ContentDeletionRequest & { snapshotChecksum: string };
export type StoredContentDeletion = { tombstone: ContentDeletionTombstone; snapshotChecksum: string };
export type ContentProviderDeletionReceipt = { receiptId: string; confirmedAt: string; receiptChecksum: string };

export const contentDeletionStateSchema = z.object({
  contentId: z.string().min(1), tombstoneId: z.string().min(1),
  state: z.enum(['retained_for_restore', 'restored', 'purged']),
}).strict();

export function assertDeletionOperationsEnabled(options: ContentDeletionRepositoryOptions): void {
  if (options.deletionOperationsEnabled !== true) throw new Error('Content deletion operations are disabled pending protected provider readiness');
}

export function deletionOperationTime(options: ContentDeletionRepositoryOptions, timestamp: string): string {
  const now = options.now?.() ?? new Date().toISOString();
  if (!z.string().datetime({ offset: true }).safeParse(now).success || !z.string().datetime({ offset: true }).safeParse(timestamp).success || Date.parse(timestamp) > Date.parse(now)) {
    throw new Error('Content deletion operation timestamp must not be in the future');
  }
  return now;
}

export function assertDocumentId(id: string): void {
  if (!id || id.includes('/') || id === '.' || id === '..' || Buffer.byteLength(id, 'utf8') > 1500) {
    throw new Error('Invalid content document identity');
  }
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonical(entry)]));
  }
  return value;
}

export function checksumContentRecords(value: unknown): string {
  return 'sha256:' + createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}

/** Binds the separate verified backup receipt to the exact retained editorial snapshot. */
export function checksumRuntimeContentSnapshot(value: unknown): string {
  return checksumContentRecords(serializeRuntimeContentRecord(parseRuntimeContentRecord(value)));
}

export function prepareContentSoftDeletion(item: ContentItem, request: SoftDeleteContentRequest): StoredContentDeletion {
  assertDocumentId(request.entityId);
  assertDocumentId(request.tombstoneId);
  if (request.entityType !== 'contentItem' || request.entityId !== item.id || request.ownerId !== item.createdBy) {
    throw new Error('Content deletion identity or owner mismatch');
  }
  if (request.snapshotChecksum !== checksumRuntimeContentSnapshot(item)) throw new Error('Content deletion snapshot checksum mismatch');
  const { snapshotChecksum, ...input } = request;
  return { tombstone: createContentDeletionTombstone(input), snapshotChecksum };
}

export function parseStoredContentDeletion(value: unknown): StoredContentDeletion {
  const parsed = z.object({ tombstone: z.unknown(), snapshotChecksum: z.string().regex(/^sha256:[a-f0-9]{64}$/) }).strict().parse(value);
  const tombstone = parseContentDeletionTombstone(parsed.tombstone);
  if (tombstone.entityType !== 'contentItem') throw new Error('Invalid stored content deletion entity type');
  return { tombstone, snapshotChecksum: parsed.snapshotChecksum };
}

export function assertContentDeletionBinding(item: ContentItem, stored: StoredContentDeletion, contentId: string, tombstoneId: string): void {
  if (item.id !== contentId || stored.tombstone.entityId !== contentId || stored.tombstone.tombstoneId !== tombstoneId || stored.tombstone.ownerId !== item.createdBy) {
    throw new Error('Stored content deletion identity mismatch');
  }
  if (stored.snapshotChecksum !== checksumRuntimeContentSnapshot(item)) throw new Error('Retained content snapshot checksum mismatch');
}
