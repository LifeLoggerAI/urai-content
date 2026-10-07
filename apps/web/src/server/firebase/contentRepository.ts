import type {
  ContentItem,
  ContentRepository,
  CreatorSubmission,
  CreatorSubmissionQueueOptions,
  ExportTemplate,
  MarketplaceItem,
  ModerationQueueItem,
  NarratorPrompt,
  PublishingRelease,
  RitualTemplate,
  StoryTemplate,
  TelemetryEvent,
  UserContentEntitlement
} from '../content/types';
import { FIRESTORE_COLLECTIONS } from '../content/types';
import {
  contentItemSchema,
  contentVersionRecordSchema,
  contentRevisionCounterSchema,
  CURRENT_RUNTIME_CONTENT_SCHEMA_VERSION,
  parseRuntimeContentRecord,
  parseStoredRuntimeContentRecord,
  isRuntimeContentDeleted,
  serializeRuntimeContentRecord,
  creatorSubmissionSchema,
  exportTemplateSchema,
  marketplaceItemSchema,
  moderationQueueSchema,
  narratorPromptSchema,
  parseRuntimeRecord,
  publishingReleaseSchema,
  ritualTemplateSchema,
  storyTemplateSchema,
  telemetryEventSchema,
  userContentEntitlementSchema
} from '../content/schemas';

import { decodePageCursor, encodePageCursor, normalizePageLimit, type PageRequest, type PageResult } from '../../../../../src/query/pagination.js';
import { finalizeContentDeletionPurge, recordProviderDeletionReceipt, restoreContentDeletion } from '../../../../../src/privacy/deletionLifecycle.js';
import {
  assertContentDeletionBinding, assertDeletionOperationsEnabled, assertDocumentId, checksumContentRecords,
  contentDeletionStateSchema, parseStoredContentDeletion, prepareContentSoftDeletion,
  deletionOperationTime,
  type ContentDeletionRepositoryOptions, type StoredContentDeletion,
} from '../../../../../src/backend/deletionPersistence.js';

type FirestoreData = Record<string, unknown>;

type DocumentSnapshotLike = { exists: boolean; data(): FirestoreData | undefined };
type QuerySnapshotLike = { docs: Array<{ id: string; data(): FirestoreData }> };
type DocumentReferenceLike = {
  set(data: FirestoreData, options?: { merge?: boolean }): Promise<unknown>;
  get(): Promise<DocumentSnapshotLike>;
  delete(): Promise<unknown>;
};
type TransactionLike = {
  get(ref: DocumentReferenceLike): Promise<DocumentSnapshotLike>;
  set(ref: DocumentReferenceLike, data: FirestoreData, options?: { merge?: boolean }): unknown;
  delete(ref: DocumentReferenceLike): unknown;
};
type QueryLike = {
  where(field: string, operator: '==', value: unknown): QueryLike;
  orderBy(field: string, direction?: 'asc' | 'desc'): QueryLike;
  limit(limit: number): QueryLike;
  startAfter(value: unknown): QueryLike;
  get(): Promise<QuerySnapshotLike>;
};
type CollectionReferenceLike = QueryLike & { doc(id?: string): DocumentReferenceLike; add(data: FirestoreData): Promise<unknown> };

export type FirestoreLike = {
  collection(path: string): CollectionReferenceLike;
  runTransaction<T>(update: (transaction: TransactionLike) => Promise<T>): Promise<T>;
};

function collection(db: FirestoreLike, path: string): CollectionReferenceLike { return db.collection(path); }
function asRecord<T>(value: T): FirestoreData { return value as FirestoreData; }
function sortByVersion<T extends { version: number }>(items: T[]): T[] { return [...items].sort((a, b) => a.version - b.version); }
function sortSubmissions(items: CreatorSubmission[]): CreatorSubmission[] {
  return [...items].sort((a, b) => String(b.submittedAt ?? b.updatedAt ?? '').localeCompare(String(a.submittedAt ?? a.updatedAt ?? '')));
}
function boundedRows(snapshot: QuerySnapshotLike, label: string): QuerySnapshotLike['docs'] {
  if (snapshot.docs.length > 100) throw new Error(label + ' exceeds bounded read');
  return snapshot.docs;
}
function storedContent(data: unknown, id: string) {
  const parsed = parseStoredRuntimeContentRecord(data);
  if (parsed.id !== id) throw new Error('Stored content identity mismatch');
  return parsed;
}
function storedSubmission(doc: QuerySnapshotLike['docs'][number]): CreatorSubmission {
  const parsed = parseRuntimeRecord(creatorSubmissionSchema, FIRESTORE_COLLECTIONS.creatorSubmissions, doc.data());
  if (parsed.id !== doc.id) throw new Error('Stored creator submission identity mismatch');
  return parsed;
}
function deletionState(snapshot: DocumentSnapshotLike, id: string) {
  if (!snapshot.exists) return null;
  const parsed = contentDeletionStateSchema.parse(snapshot.data());
  if (parsed.contentId !== id) throw new Error('Stored content deletion identity mismatch');
  return parsed;
}

export function createFirestoreContentRepository(db: FirestoreLike, options: ContentDeletionRepositoryOptions = {}): ContentRepository {
  const contentRef = (id: string) => { assertDocumentId(id); return collection(db, FIRESTORE_COLLECTIONS.contentItems).doc(id); };
  const stateRef = (id: string) => collection(db, FIRESTORE_COLLECTIONS.contentDeletionStates).doc(id);
  const tombstoneRef = (id: string) => { assertDocumentId(id); return collection(db, FIRESTORE_COLLECTIONS.contentDeletionTombstones).doc(id); };

  async function readRetainedDeletion(transaction: TransactionLike, contentId: string) {
    const itemRef = contentRef(contentId);
    const barrierRef = stateRef(contentId);
    const barrier = deletionState(await transaction.get(barrierRef), contentId);
    if (!barrier || barrier.state !== 'retained_for_restore') throw new Error('Active content deletion not found');
    const stoneRef = tombstoneRef(barrier.tombstoneId);
    const stone = await transaction.get(stoneRef);
    const content = await transaction.get(itemRef);
    if (!stone.exists || !content.exists) throw new Error('Retained content deletion is incomplete');
    const stored = parseStoredContentDeletion(stone.data());
    const item = storedContent(content.data(), contentId);
    if (stored.tombstone.state !== barrier.state || item.deletion?.state !== barrier.state || item.deletion.tombstoneId !== barrier.tombstoneId) {
      throw new Error('Stored content deletion state mismatch');
    }
    assertContentDeletionBinding(parseRuntimeContentRecord(item), stored, contentId, barrier.tombstoneId);
    return { itemRef, barrierRef, stoneRef, stored, item };
  }
  function saveDeletion(transaction: TransactionLike, refs: Awaited<ReturnType<typeof readRetainedDeletion>>, stored: StoredContentDeletion) {
    transaction.set(refs.stoneRef, asRecord(stored));
    transaction.set(refs.barrierRef, { contentId: stored.tombstone.entityId, tombstoneId: stored.tombstone.tombstoneId, state: stored.tombstone.state });
    if (stored.tombstone.state !== 'purged') {
      transaction.set(refs.itemRef, { schemaVersion: CURRENT_RUNTIME_CONTENT_SCHEMA_VERSION, deletion: { tombstoneId: stored.tombstone.tombstoneId, state: stored.tombstone.state } }, { merge: true });
    }
    return stored;
  }

  async function writeRevision(contentId: string, snapshot: ContentItem, persistContent = false): Promise<number> {
      const parsedSnapshot = parseRuntimeContentRecord(snapshot);
      if (parsedSnapshot.id !== contentId) {
        throw new Error('Content revision identity mismatch for ' + contentId);
      }
      const itemRef = contentRef(contentId);
      const counterRef = collection(db, FIRESTORE_COLLECTIONS.contentRevisionCounters).doc(contentId);
      return db.runTransaction(async (transaction) => {
        const barrier = deletionState(await transaction.get(stateRef(contentId)), contentId);
        const current = await transaction.get(itemRef);
        if ((barrier && barrier.state !== 'restored') || (current.exists && isRuntimeContentDeleted(storedContent(current.data(), contentId)))) throw new Error('Content is deleted; explicit restore is required');
        const counterSnapshot = await transaction.get(counterRef);
        const counterData = counterSnapshot.exists ? counterSnapshot.data() : undefined;
        const previousVersion = counterSnapshot.exists ? counterData?.version : 0;
        if (
          typeof previousVersion !== 'number' ||
          !Number.isSafeInteger(previousVersion) ||
          previousVersion < 0 ||
          previousVersion >= Number.MAX_SAFE_INTEGER ||
          (counterSnapshot.exists && !contentRevisionCounterSchema.safeParse(counterData).success) ||
          (counterSnapshot.exists && counterData?.contentId !== contentId)
        ) {
          throw new Error('Invalid content revision counter for ' + contentId);
        }

        const version = previousVersion + 1;
        const revision = parseRuntimeRecord(contentVersionRecordSchema, FIRESTORE_COLLECTIONS.contentVersions, {
          contentId, version, snapshot: parsedSnapshot
        });
        const versionRef = collection(db, FIRESTORE_COLLECTIONS.contentVersions).doc(`${contentId}-v${version}`);
        // A missing or stale counter must never overwrite retained revision history.
        const existingRevision = await transaction.get(versionRef);
        if (existingRevision.exists) {
          throw new Error('Content revision already exists for ' + contentId + ' at version ' + version);
        }
        if (persistContent) transaction.set(itemRef, asRecord(serializeRuntimeContentRecord(parsedSnapshot)), { merge: true });
        transaction.set(versionRef, asRecord(revision));
        transaction.set(counterRef, { contentId, version, updatedAt: new Date().toISOString() }, { merge: true });
        return version;
      });
  }

  const repo: ContentRepository = {
    async upsertContent(item: ContentItem): Promise<void> {
      const parsed = parseRuntimeRecord(contentItemSchema, FIRESTORE_COLLECTIONS.contentItems, item);
      const ref = contentRef(parsed.id);
      await db.runTransaction(async (transaction) => {
        const barrier = deletionState(await transaction.get(stateRef(parsed.id)), parsed.id);
        const existing = await transaction.get(ref);
        if ((barrier && barrier.state !== 'restored') || (existing.exists && isRuntimeContentDeleted(storedContent(existing.data(), parsed.id)))) {
          throw new Error('Content is deleted; explicit restore is required');
        }
        transaction.set(ref, asRecord(serializeRuntimeContentRecord(parsed)), { merge: true });
      });
    },
    async getContent(id: string): Promise<ContentItem | null> {
      const snap = await contentRef(id).get();
      if (!snap.exists) return null;
      const record = storedContent(snap.data(), id);
      return isRuntimeContentDeleted(record) ? null : parseRuntimeContentRecord(record);
    },
    async listContentPage(request: PageRequest = {}): Promise<PageResult<ContentItem>> {
      const limit = normalizePageLimit(request.limit);
      const cursor = request.cursor ? decodePageCursor(request.cursor) : null;
      if (cursor && cursor.sortValue !== cursor.id) throw new Error('Invalid content pagination cursor');
      let query = collection(db, FIRESTORE_COLLECTIONS.contentItems).orderBy('id');
      if (cursor) query = query.startAfter(cursor.id);
      const snap = await query.limit(limit + 1).get();
      const scanned = snap.docs.slice(0, limit).map((doc) => storedContent(doc.data(), doc.id));
      const last = scanned.at(-1);
      return { items: scanned.filter((item) => !isRuntimeContentDeleted(item)).map(parseRuntimeContentRecord),
        nextCursor: snap.docs.length > limit && last ? encodePageCursor({ sortValue: last.id, id: last.id }) : null };
    },
    async listContent(): Promise<ContentItem[]> {
      const page = await repo.listContentPage({ limit: 100 });
      if (page.nextCursor) throw new Error('Content collection exceeds bounded read; use listContentPage');
      return page.items;
    },
    async getContentBySlug(slug: string): Promise<ContentItem | null> {
      const snap = await collection(db, FIRESTORE_COLLECTIONS.contentItems).where('slug', '==', slug).limit(2).get();
      if (snap.docs.length > 1) throw new Error('Ambiguous content slug');
      const doc = snap.docs[0];
      if (!doc) return null;
      const item = storedContent(doc.data(), doc.id);
      return isRuntimeContentDeleted(item) ? null : parseRuntimeContentRecord(item);
    },
    async deleteContent(): Promise<void> { throw new Error('Hard content deletion is disabled; use receipt-bound soft deletion'); },
    async softDeleteContent(request) {
      assertDeletionOperationsEnabled(options);
      deletionOperationTime(options, request.requestedAt);
      const ref = contentRef(request.entityId);
      const barrierRef = stateRef(request.entityId);
      const stoneRef = tombstoneRef(request.tombstoneId);
      return db.runTransaction(async (transaction) => {
        const content = await transaction.get(ref);
        const barrier = deletionState(await transaction.get(barrierRef), request.entityId);
        const existingStone = await transaction.get(stoneRef);
        if (!content.exists || (barrier && barrier.state !== 'restored')) throw new Error('Content item unavailable for deletion');
        if (existingStone.exists) throw new Error('Content deletion tombstone already exists');
        const record = storedContent(content.data(), request.entityId);
        if (isRuntimeContentDeleted(record)) throw new Error('Content item unavailable for deletion');
        const stored = prepareContentSoftDeletion(parseRuntimeContentRecord(record), request);
        transaction.set(stoneRef, asRecord(stored));
        transaction.set(barrierRef, { contentId: request.entityId, tombstoneId: request.tombstoneId, state: stored.tombstone.state });
        transaction.set(ref, { schemaVersion: CURRENT_RUNTIME_CONTENT_SCHEMA_VERSION, deletion: { tombstoneId: request.tombstoneId, state: stored.tombstone.state } }, { merge: true });
        return stored;
      });
    },
    async restoreDeletedContent(contentId, ownerId, restoredAt) {
      assertDeletionOperationsEnabled(options);
      return db.runTransaction(async (transaction) => {
        const refs = await readRetainedDeletion(transaction, contentId);
        if (refs.stored.tombstone.ownerId !== ownerId) throw new Error('Content restore owner mismatch');
        restoreContentDeletion(refs.stored.tombstone, deletionOperationTime(options, restoredAt));
        return saveDeletion(transaction, refs, { ...refs.stored, tombstone: restoreContentDeletion(refs.stored.tombstone, restoredAt) });
      });
    },
    async recordContentProviderDeletionReceipt(contentId, system, receipt) {
      assertDeletionOperationsEnabled(options);
      deletionOperationTime(options, receipt.confirmedAt);
      return db.runTransaction(async (transaction) => {
        const refs = await readRetainedDeletion(transaction, contentId);
        return saveDeletion(transaction, refs, { ...refs.stored, tombstone: recordProviderDeletionReceipt(refs.stored.tombstone, system, receipt) });
      });
    },
    async purgeDeletedContent(contentId, purgedAt) {
      assertDeletionOperationsEnabled(options);
      deletionOperationTime(options, purgedAt);
      // At most 100 immutable revisions in one atomic batch. New revisions are
      // blocked by the deletion barrier; concurrent restore changes a read lock.
      const history = await collection(db, FIRESTORE_COLLECTIONS.contentVersions).where('contentId', '==', contentId).limit(101).get();
      const rows = boundedRows(history, 'Content purge revision batch');
      return db.runTransaction(async (transaction) => {
        const refs = await readRetainedDeletion(transaction, contentId);
        const counterRef = collection(db, FIRESTORE_COLLECTIONS.contentRevisionCounters).doc(contentId);
        const counter = await transaction.get(counterRef);
        if (counter.exists && parseRuntimeRecord(contentRevisionCounterSchema, FIRESTORE_COLLECTIONS.contentRevisionCounters, counter.data()).contentId !== contentId) throw new Error('Stored revision counter identity mismatch');
        const versions = [];
        for (const doc of rows) {
          const ref = collection(db, FIRESTORE_COLLECTIONS.contentVersions).doc(doc.id);
          const snapshot = await transaction.get(ref);
          const record = parseRuntimeRecord(contentVersionRecordSchema, FIRESTORE_COLLECTIONS.contentVersions, snapshot.data());
          if (record.contentId !== contentId || record.snapshot.id !== contentId || doc.id !== `${contentId}-v${record.version}`) throw new Error('Stored revision identity mismatch');
          versions.push({ ref, id: doc.id, record });
        }
        const deletionChecksum = checksumContentRecords({ content: refs.item, counter: counter.data() ?? null, versions: versions.map(({ id, record }) => ({ id, record })) });
        const stored = { ...refs.stored, tombstone: finalizeContentDeletionPurge(refs.stored.tombstone, purgedAt, deletionChecksum) };
        for (const version of versions) transaction.delete(version.ref);
        transaction.delete(counterRef);
        transaction.delete(refs.itemRef);
        return saveDeletion(transaction, refs, stored);
      });
    },
    async saveContentRevision(item: ContentItem): Promise<number> { return writeRevision(item.id, item, true); },
    async addVersion(contentId: string, snapshot: ContentItem): Promise<number> { return writeRevision(contentId, snapshot); },
    async listVersions(contentId: string): Promise<Array<{ version: number; snapshot: ContentItem }>> {
      const barrier = deletionState(await stateRef(contentId).get(), contentId);
      if (barrier && barrier.state !== 'restored') return [];
      const current = await contentRef(contentId).get();
      if (current.exists && isRuntimeContentDeleted(storedContent(current.data(), contentId))) return [];
      const snap = await collection(db, FIRESTORE_COLLECTIONS.contentVersions).where('contentId', '==', contentId).limit(101).get();
      const versions = boundedRows(snap, 'Content history').map((doc) => {
        const record = parseRuntimeRecord(contentVersionRecordSchema, FIRESTORE_COLLECTIONS.contentVersions, doc.data());
        if (record.contentId !== contentId || record.snapshot.id !== contentId || doc.id !== `${contentId}-v${record.version}`) throw new Error('Stored revision identity mismatch');
        return record;
      });
      return sortByVersion(versions).map(({ version, snapshot }) => ({ version, snapshot }));
    },
    async logModeration(item: ModerationQueueItem): Promise<void> { const parsed = parseRuntimeRecord(moderationQueueSchema, FIRESTORE_COLLECTIONS.moderationQueue, item); await collection(db, FIRESTORE_COLLECTIONS.moderationQueue).doc(parsed.id).set(asRecord(parsed)); },
    async logRelease(release: PublishingRelease): Promise<void> { const parsed = parseRuntimeRecord(publishingReleaseSchema, FIRESTORE_COLLECTIONS.publishingReleases, release); await collection(db, FIRESTORE_COLLECTIONS.publishingReleases).doc(parsed.id).set(asRecord(parsed)); },
    async addTelemetry(event: TelemetryEvent): Promise<void> { const parsed = parseRuntimeRecord(telemetryEventSchema, FIRESTORE_COLLECTIONS.telemetryEvents, event); await collection(db, FIRESTORE_COLLECTIONS.telemetryEvents).add(asRecord(parsed)); },
    async listTelemetry(limit = 100): Promise<TelemetryEvent[]> {
      const snap = await collection(db, FIRESTORE_COLLECTIONS.telemetryEvents).orderBy('timestamp', 'desc').limit(normalizePageLimit(limit, 100)).get();
      return snap.docs.map((doc) => parseRuntimeRecord(telemetryEventSchema, FIRESTORE_COLLECTIONS.telemetryEvents, doc.data()));
    },
    async listEntitlements(userId: string): Promise<UserContentEntitlement[]> {
      const snap = await collection(db, FIRESTORE_COLLECTIONS.userContentEntitlements).where('userId', '==', userId).limit(101).get();
      return boundedRows(snap, 'Entitlements').map((doc) => parseRuntimeRecord(userContentEntitlementSchema, FIRESTORE_COLLECTIONS.userContentEntitlements, doc.data()));
    },
    async upsertNarratorPrompt(prompt: NarratorPrompt): Promise<void> { const parsed = parseRuntimeRecord(narratorPromptSchema, FIRESTORE_COLLECTIONS.narratorPrompts, prompt); await collection(db, FIRESTORE_COLLECTIONS.narratorPrompts).doc(parsed.id).set(asRecord(parsed), { merge: true }); },
    async upsertStoryTemplate(template: StoryTemplate): Promise<void> { const parsed = parseRuntimeRecord(storyTemplateSchema, FIRESTORE_COLLECTIONS.storyTemplates, template); await collection(db, FIRESTORE_COLLECTIONS.storyTemplates).doc(parsed.id).set(asRecord(parsed), { merge: true }); },
    async upsertRitualTemplate(template: RitualTemplate): Promise<void> { const parsed = parseRuntimeRecord(ritualTemplateSchema, FIRESTORE_COLLECTIONS.ritualTemplates, template); await collection(db, FIRESTORE_COLLECTIONS.ritualTemplates).doc(parsed.id).set(asRecord(parsed), { merge: true }); },
    async upsertMarketplaceItem(item: MarketplaceItem): Promise<void> { const parsed = parseRuntimeRecord(marketplaceItemSchema, FIRESTORE_COLLECTIONS.marketplaceItems, item); await collection(db, FIRESTORE_COLLECTIONS.marketplaceItems).doc(parsed.id).set(asRecord(parsed), { merge: true }); },
    async upsertCreatorSubmission(item: CreatorSubmission): Promise<void> { const parsed = parseRuntimeRecord(creatorSubmissionSchema, FIRESTORE_COLLECTIONS.creatorSubmissions, item); await collection(db, FIRESTORE_COLLECTIONS.creatorSubmissions).doc(parsed.id).set(asRecord(parsed), { merge: true }); },
    async getCreatorSubmission(id: string): Promise<CreatorSubmission | null> {
      const snap = await collection(db, FIRESTORE_COLLECTIONS.creatorSubmissions).doc(id).get();
      if (!snap.exists) return null;
      const record = parseRuntimeRecord(creatorSubmissionSchema, FIRESTORE_COLLECTIONS.creatorSubmissions, snap.data());
      if (record.id !== id) throw new Error('Stored creator submission identity mismatch');
      return record;
    },
    async listCreatorSubmissions(creatorId: string): Promise<CreatorSubmission[]> {
      const snap = await collection(db, FIRESTORE_COLLECTIONS.creatorSubmissions).where('creatorId', '==', creatorId).limit(101).get();
      return sortSubmissions(boundedRows(snap, 'Creator submissions').map(storedSubmission));
    },
    async listCreatorSubmissionQueue(options: CreatorSubmissionQueueOptions = {}): Promise<CreatorSubmission[]> {
      const limit = normalizePageLimit(options.limit, 50);
      const query = options.status
        ? collection(db, FIRESTORE_COLLECTIONS.creatorSubmissions).where('status', '==', options.status).orderBy('submittedAt', 'desc').limit(limit)
        : collection(db, FIRESTORE_COLLECTIONS.creatorSubmissions).orderBy('submittedAt', 'desc').limit(limit);
      const snap = await query.get();
      return sortSubmissions(boundedRows(snap, 'Creator submissions').map(storedSubmission)).slice(0, limit);
    },
    async upsertExportTemplate(item: ExportTemplate): Promise<void> { const parsed = parseRuntimeRecord(exportTemplateSchema, FIRESTORE_COLLECTIONS.exportTemplates, item); await collection(db, FIRESTORE_COLLECTIONS.exportTemplates).doc(parsed.id).set(asRecord(parsed), { merge: true }); }
  };
  return repo;
}
