import { describe, expect, it } from 'vitest';
import { createFirestoreContentRepository, type FirestoreLike } from '../src/server/firebase/contentRepository';
import type { ContentItem, TelemetryEvent, UserContentEntitlement } from '../../../src/schemas/content';
import * as canonicalSchemas from '../../../src/schemas/content';
import * as runtimeSchemas from '../src/server/content/schemas';
import { InMemoryContentRepository } from '../../../src/backend/inMemoryRepository';
import { checksumRuntimeContentSnapshot, type ContentDeletionRepositoryOptions, type SoftDeleteContentRequest } from '../../../src/backend/deletionPersistence';
import { verifyContentPurgeReceipt } from '../../../src/privacy/deletionLifecycle';
import { encodePageCursor } from '../../../src/query/pagination';

type FirestoreData = Record<string, unknown>;
type FirestoreTransaction = Parameters<Parameters<FirestoreLike['runTransaction']>[0]>[0];

type SetCall = {
  id: string;
  data: FirestoreData;
  options?: { merge?: boolean };
};

class FakeDocumentSnapshot {
  constructor(private readonly value: FirestoreData | undefined) {}

  get exists() {
    return this.value !== undefined;
  }

  data(): FirestoreData | undefined {
    return this.value;
  }
}

class FakeQuerySnapshot {
  constructor(readonly docs: Array<{ id: string; data(): FirestoreData }>) {}
}

type Filter = { field: string; value: unknown };
type Order = { field: string; direction: 'asc' | 'desc' };

class FakeCollection {
  readonly setCalls: SetCall[] = [];
  readonly queryCalls: Array<{ limit: number | null; after: unknown; returned: number }> = [];
  private readonly rows = new Map<string, FirestoreData>();

  constructor(
    private readonly filters: Filter[] = [],
    private readonly order: Order | null = null,
    private readonly resultLimit: number | null = null,
    private readonly after: unknown = undefined
  ) {}

  doc(id = `doc-${this.rowsRef.size + 1}`) {
    return {
      set: async (data: FirestoreData, options?: { merge?: boolean }) => {
        this.setCallsRef.push({ id, data, options });
        const existing = this.rowsRef.get(id) ?? {};
        this.rowsRef.set(id, options?.merge ? { ...existing, ...data } : data);
      },
      get: async () => new FakeDocumentSnapshot(this.rowsRef.get(id)),
      delete: async () => {
        this.rowsRef.delete(id);
      }
    };
  }

  async add(data: FirestoreData) {
    const ref = this.doc(`auto-${this.rowsRef.size + 1}`);
    await ref.set(data);
    return ref;
  }

  where(field: string, operator: '==', value: unknown) {
    if (operator !== '==') throw new Error(`Unsupported fake operator ${operator}`);
    const next = new FakeCollection([...this.filters, { field, value }], this.order, this.resultLimit, this.after);
    next.rowsRef = this.rowsRef;
    next.setCallsRef = this.setCallsRef;
    next.queryCallsRef = this.queryCallsRef;
    return next;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    const next = new FakeCollection(this.filters, { field, direction }, this.resultLimit, this.after);
    next.rowsRef = this.rowsRef;
    next.setCallsRef = this.setCallsRef;
    next.queryCallsRef = this.queryCallsRef;
    return next;
  }

  limit(limit: number) {
    const next = new FakeCollection(this.filters, this.order, limit, this.after);
    next.rowsRef = this.rowsRef;
    next.setCallsRef = this.setCallsRef;
    next.queryCallsRef = this.queryCallsRef;
    return next;
  }

  startAfter(value: unknown) {
    const next = new FakeCollection(this.filters, this.order, this.resultLimit, value);
    next.rowsRef = this.rowsRef;
    next.setCallsRef = this.setCallsRef;
    next.queryCallsRef = this.queryCallsRef;
    return next;
  }

  async get() {
    let values = [...this.rowsRef.entries()].map(([id, value]) => ({ id, value }));

    for (const filter of this.filters) {
      values = values.filter(({ value }) => value[filter.field] === filter.value);
    }

    if (this.order) {
      const { field, direction } = this.order;
      values.sort((a, b) => {
        const left = String(a.value[field] ?? '');
        const right = String(b.value[field] ?? '');
        return direction === 'asc' ? Buffer.compare(Buffer.from(left), Buffer.from(right)) : Buffer.compare(Buffer.from(right), Buffer.from(left));
      });
      if (this.after !== undefined) values = values.filter(({ value }) => direction === 'asc'
        ? String(value[field]) > String(this.after) : String(value[field]) < String(this.after));
    }

    if (this.resultLimit !== null) {
      values = values.slice(0, this.resultLimit);
    }

    this.queryCallsRef.push({ limit: this.resultLimit, after: this.after, returned: values.length });
    return new FakeQuerySnapshot(values.map(({ id, value }) => ({ id, data: () => value })));
  }

  private rowsRef = this.rows;
  private setCallsRef = this.setCalls;
  private queryCallsRef = this.queryCalls;
}

class FakeFirestore implements FirestoreLike {
  private readonly collections = new Map<string, FakeCollection>();
  private transactionTail: Promise<void> = Promise.resolve();

  collection(path: string) {
    if (!this.collections.has(path)) {
      this.collections.set(path, new FakeCollection());
    }

    return this.collections.get(path)!;
  }

  async runTransaction<T>(update: (transaction: FirestoreTransaction) => Promise<T>): Promise<T> {
    const previous = this.transactionTail;
    let release!: () => void;
    this.transactionTail = new Promise<void>((resolve) => { release = resolve; });
    await previous;

    const writes: Array<() => Promise<unknown>> = [];
    try {
      const result = await update({
        get: async (ref) => {
          if (writes.length > 0) throw new Error('Transaction reads must precede writes');
          return ref.get();
        },
        set: (ref, data, options) => {
          writes.push(() => ref.set(data, options));
        },
        delete: (ref) => {
          writes.push(() => ref.delete());
        }
      });
      await Promise.all(writes.map((write) => write()));
      return result;
    } finally {
      release();
    }
  }
}

function makeContentItem(overrides: Partial<ContentItem> = {}): ContentItem {
  const now = new Date().toISOString();
  return {
    id: 'content-1',
    slug: 'content-one',
    title: 'Content One',
    body: 'Body',
    tags: ['demo'],
    locale: 'en-US',
    status: 'draft',
    visibility: 'public',
    createdBy: 'admin',
    updatedAt: now,
    createdAt: now,
    sourceLabel: 'test',
    whyShownCopy: 'Because this is a test.',
    safetyNotes: ['non-clinical'],
    contentType: 'story',
    ...overrides
  };
}

describe('createFirestoreContentRepository', () => {
  it('creates, reads, lists and versions content while rejecting hard deletion', async () => {
    const repo = createFirestoreContentRepository(new FakeFirestore());
    const item = makeContentItem();

    await repo.upsertContent(item);
    expect(await repo.getContent(item.id)).toEqual(item);
    expect(await repo.listContent()).toEqual([item]);

    expect(await repo.addVersion(item.id, item)).toBe(1);
    expect(await repo.addVersion(item.id, { ...item, title: 'Content One Updated' })).toBe(2);
    expect(await repo.listVersions(item.id)).toEqual([
      { version: 1, snapshot: item },
      { version: 2, snapshot: { ...item, title: 'Content One Updated' } }
    ]);

    await expect(repo.deleteContent(item.id)).rejects.toThrow('Hard content deletion is disabled');
    expect(await repo.getContent(item.id)).toEqual(item);
  });

  it('allocates unique revision numbers under concurrent writes', async () => {
    const firestore = new FakeFirestore();
    const repo = createFirestoreContentRepository(firestore);
    const item = makeContentItem();

    const versions = await Promise.all([
      repo.addVersion(item.id, item),
      repo.addVersion(item.id, { ...item, title: 'Concurrent revision' })
    ]);

    expect([...versions].sort((a, b) => a - b)).toEqual([1, 2]);
    const retained = await repo.listVersions(item.id);
    expect(retained.map((version) => version.version)).toEqual([1, 2]);
  });

  it('preserves a legacy revision when its counter is missing', async () => {
    const firestore = new FakeFirestore();
    const repo = createFirestoreContentRepository(firestore);
    const item = makeContentItem();
    const retained = { contentId: item.id, version: 1, snapshot: item };
    const versions = firestore.collection('contentVersions');
    await versions.doc(`${item.id}-v1`).set(retained);

    await expect(repo.addVersion(item.id, { ...item, title: 'Replacement' }))
      .rejects.toThrow('Content revision already exists');

    expect(await repo.listVersions(item.id)).toEqual([{ version: 1, snapshot: item }]);
    expect(versions.setCalls).toHaveLength(1);
    expect((await firestore.collection('contentRevisionCounters').doc(item.id).get()).exists).toBe(false);
  });

  it('preserves revision history when a counter points behind an existing revision', async () => {
    const firestore = new FakeFirestore();
    const repo = createFirestoreContentRepository(firestore);
    const item = makeContentItem();
    const retained = { ...item, title: 'Retained revision' };
    const versions = firestore.collection('contentVersions');
    const counters = firestore.collection('contentRevisionCounters');
    await counters.doc(item.id).set({ contentId: item.id, version: 1 });
    await versions.doc(`${item.id}-v2`).set({ contentId: item.id, version: 2, snapshot: retained });

    await expect(repo.addVersion(item.id, { ...item, title: 'Replacement' }))
      .rejects.toThrow('Content revision already exists');

    expect(await repo.listVersions(item.id)).toEqual([{ version: 2, snapshot: retained }]);
    expect(versions.setCalls).toHaveLength(1);
    expect((await counters.doc(item.id).get()).data()).toEqual({ contentId: item.id, version: 1 });
    expect(counters.setCalls).toHaveLength(1);
  });

  it.each([
    { label: 'string', version: '1' },
    { label: 'null', version: null },
    { label: 'missing', version: undefined },
    { label: 'fraction', version: 1.5 },
    { label: 'negative', version: -1 },
    { label: 'exhausted', version: Number.MAX_SAFE_INTEGER },
  ])('rejects a $label revision counter without writing', async ({ version }) => {
    const firestore = new FakeFirestore();
    const repo = createFirestoreContentRepository(firestore);
    const item = makeContentItem();
    const counters = firestore.collection('contentRevisionCounters');
    await counters.doc(item.id).set({ contentId: item.id, version });

    await expect(repo.addVersion(item.id, item)).rejects.toThrow('Invalid content revision counter');
    expect(firestore.collection('contentVersions').setCalls).toHaveLength(0);
    expect(counters.setCalls).toHaveLength(1);
  });

  it('rejects a revision counter for another content identity', async () => {
    const firestore = new FakeFirestore();
    const repo = createFirestoreContentRepository(firestore);
    const item = makeContentItem();
    const counters = firestore.collection('contentRevisionCounters');
    await counters.doc(item.id).set({ contentId: 'another-content', version: 1 });

    await expect(repo.addVersion(item.id, item)).rejects.toThrow('Invalid content revision counter');
    expect(firestore.collection('contentVersions').setCalls).toHaveLength(0);
    expect(counters.setCalls).toHaveLength(1);
  });

  it('validates a revision snapshot before any persistence', async () => {
    const firestore = new FakeFirestore();
    const repo = createFirestoreContentRepository(firestore);
    const item = makeContentItem({ body: '' });

    await expect(repo.addVersion(item.id, item)).rejects.toThrow('Invalid contentItems record');
    expect(firestore.collection('contentVersions').setCalls).toHaveLength(0);
    expect(firestore.collection('contentRevisionCounters').setCalls).toHaveLength(0);
  });

  it('rejects a snapshot for another content identity before any persistence', async () => {
    const firestore = new FakeFirestore();
    const repo = createFirestoreContentRepository(firestore);
    const item = makeContentItem();

    await expect(repo.addVersion(item.id, { ...item, id: 'another-content' }))
      .rejects.toThrow('Content revision identity mismatch');
    expect(firestore.collection('contentVersions').setCalls).toHaveLength(0);
    expect(firestore.collection('contentRevisionCounters').setCalls).toHaveLength(0);
  });

  it('uses merge writes for upserted records that may be edited incrementally', async () => {
    const firestore = new FakeFirestore();
    const repo = createFirestoreContentRepository(firestore);
    const item = makeContentItem();

    await repo.upsertContent(item);

    expect(firestore.collection('contentItems').setCalls).toEqual([
      { id: item.id, data: { ...item, schemaVersion: 2 } as unknown as FirestoreData, options: { merge: true } }
    ]);
  });

  it('filters entitlements by user', async () => {
    const now = new Date().toISOString();
    const entitlement: UserContentEntitlement = {
      userId: 'user-1',
      entitlementKey: 'tier:pro',
      grantedBy: 'subscription',
      grantedAt: now,
      expiresAt: null
    };

    const firestore = new FakeFirestore();
    const repo = createFirestoreContentRepository(firestore);
    await firestore.collection('userContentEntitlements').doc('ent-1').set(entitlement as FirestoreData);
    await firestore.collection('userContentEntitlements').doc('ent-2').set({ ...entitlement, userId: 'user-2' } as FirestoreData);

    expect(await repo.listEntitlements('user-1')).toEqual([entitlement]);
    expect(await repo.listEntitlements('missing-user')).toEqual([]);
  });

  it('returns telemetry in newest-first order with limit applied', async () => {
    const firestore = new FakeFirestore();
    const repo = createFirestoreContentRepository(firestore);

    const oldEvent: TelemetryEvent = {
      event: 'content_viewed',
      userId: 'user-1',
      entityId: 'content-1',
      timestamp: '2026-01-01T00:00:00.000Z',
      metadata: {}
    };
    const newEvent: TelemetryEvent = {
      ...oldEvent,
      timestamp: '2026-01-02T00:00:00.000Z'
    };

    await repo.addTelemetry(oldEvent);
    await repo.addTelemetry(newEvent);

    expect(await repo.listTelemetry(1)).toEqual([newEvent]);
  });

  it('reads legacy unversioned content and current versioned content through one runtime API', async () => {
    const firestore = new FakeFirestore();
    const repo = createFirestoreContentRepository(firestore);
    const item = makeContentItem();

    await firestore.collection('contentItems').doc('legacy').set({ ...item, id: 'legacy' } as FirestoreData);
    await firestore.collection('contentItems').doc('current').set({ ...item, id: 'current', schemaVersion: 1 } as FirestoreData);

    expect(await repo.getContent('legacy')).toEqual({ ...item, id: 'legacy' });
    expect(await repo.getContent('current')).toEqual({ ...item, id: 'current' });
  });

  it('fails closed on unsupported future content schema versions', async () => {
    const firestore = new FakeFirestore();
    const repo = createFirestoreContentRepository(firestore);
    const item = makeContentItem();

    await firestore.collection('contentItems').doc('future').set({ ...item, id: 'future', schemaVersion: 999 } as FirestoreData);

    await expect(repo.getContent('future')).rejects.toThrow();
  });

  it('fails closed when Firestore returns malformed trusted records', async () => {
    const firestore = new FakeFirestore();
    const repo = createFirestoreContentRepository(firestore);

    await firestore.collection('contentItems').doc('bad-content').set({
      id: 'bad-content',
      status: 'published',
      visibility: 'public'
    });

    await expect(repo.getContent('bad-content')).rejects.toThrow('Invalid contentItems record');

    await firestore.collection('userContentEntitlements').doc('bad-entitlement').set({
      userId: 'user-1',
      entitlementKey: 'tier:pro',
      grantedBy: 'unknown',
      grantedAt: 'not-a-date',
      expiresAt: null
    });

    await expect(repo.listEntitlements('user-1')).rejects.toThrow('Invalid userContentEntitlements record');
  });

});

function deletionRequest(item: ContentItem, overrides: Partial<SoftDeleteContentRequest> = {}): SoftDeleteContentRequest {
  return {
    tombstoneId: 'delete-' + item.id, ownerId: item.createdBy, entityType: 'contentItem', entityId: item.id,
    requestedAt: '2026-10-03T00:00:00.000Z', restoreUntil: '2026-10-10T00:00:00.000Z', purgeAfter: '2026-11-02T00:00:00.000Z',
    backup: { backupId: 'synthetic-backup', checksum: 'sha256:' + 'a'.repeat(64), verifiedAt: '2026-10-02T00:00:00.000Z', expiresAt: '2026-11-02T00:00:00.000Z' },
    providerTargets: [{ system: 'synthetic-search', resourceRef: 'synthetic/' + item.id, state: 'pending', receiptId: null, receiptChecksum: null, confirmedAt: null }],
    snapshotChecksum: checksumRuntimeContentSnapshot(item), ...overrides,
  };
}

const repositoryCases = [
  { name: 'Firestore', create: (options: ContentDeletionRepositoryOptions = {}) => createFirestoreContentRepository(new FakeFirestore(), options) },
  { name: 'shared memory preview', create: (options: ContentDeletionRepositoryOptions = {}) => new InMemoryContentRepository(options) },
];

describe.each(repositoryCases)('$name persistence lifecycle', ({ create }) => {
  it('keeps every lifecycle operation disabled by default', async () => {
    const repo = create();
    const item = makeContentItem();
    await repo.saveContentRevision(item);
    await expect(repo.softDeleteContent(deletionRequest(item))).rejects.toThrow('operations are disabled');
    await expect(repo.restoreDeletedContent(item.id, item.createdBy, '2026-10-05T00:00:00.000Z')).rejects.toThrow('operations are disabled');
    await expect(repo.purgeDeletedContent(item.id, '2026-11-03T00:00:00.000Z')).rejects.toThrow('operations are disabled');
    await expect(repo.deleteContent(item.id)).rejects.toThrow('Hard content deletion is disabled');
    expect(await repo.getContent(item.id)).toEqual(item);
  });

  it('retains deleted snapshots while blocking public reads, versions and resurrection', async () => {
    const repo = create({ deletionOperationsEnabled: true, now: () => '2026-10-05T00:00:00.000Z' });
    const item = makeContentItem({ status: 'published' });
    await repo.saveContentRevision(item);
    const stored = await repo.softDeleteContent(deletionRequest(item));
    expect(stored.tombstone.state).toBe('retained_for_restore');
    expect(await repo.getContent(item.id)).toBeNull();
    expect(await repo.getContentBySlug(item.slug)).toBeNull();
    expect(await repo.listContent()).toEqual([]);
    expect(await repo.listVersions(item.id)).toEqual([]);
    await expect(repo.upsertContent(item)).rejects.toThrow('explicit restore');
    await expect(repo.addVersion(item.id, item)).rejects.toThrow('explicit restore');
    await expect(repo.saveContentRevision(item)).rejects.toThrow('explicit restore');
    await expect(repo.restoreDeletedContent(item.id, 'another-owner', '2026-10-05T00:00:00.000Z')).rejects.toThrow('owner mismatch');
    await repo.restoreDeletedContent(item.id, item.createdBy, '2026-10-05T00:00:00.000Z');
    expect(await repo.getContent(item.id)).toEqual(item);
    expect(await repo.listVersions(item.id)).toEqual([{ version: 1, snapshot: item }]);
    expect(await repo.saveContentRevision({ ...item, title: 'Restored update' })).toBe(2);
  });

  it('rejects a forged owner, checksum or retention receipt before deleting content', async () => {
    const repo = create({ deletionOperationsEnabled: true, now: () => '2026-10-05T00:00:00.000Z' });
    const item = makeContentItem();
    await repo.saveContentRevision(item);
    await expect(repo.softDeleteContent(deletionRequest(item, { ownerId: 'other' }))).rejects.toThrow('owner mismatch');
    await expect(repo.softDeleteContent(deletionRequest(item, { snapshotChecksum: 'sha256:' + 'b'.repeat(64) }))).rejects.toThrow('checksum mismatch');
    await expect(repo.softDeleteContent(deletionRequest(item, { backup: { ...deletionRequest(item).backup, expiresAt: '2026-10-04T00:00:00.000Z' } }))).rejects.toThrow('cover restore window');
    expect(await repo.getContent(item.id)).toEqual(item);
    expect(await repo.listVersions(item.id)).toHaveLength(1);
  });

  it('rejects restoration after the real clock deadline even with a backdated timestamp', async () => {
    let now = '2026-10-05T00:00:00.000Z';
    const repo = create({ deletionOperationsEnabled: true, now: () => now });
    const item = makeContentItem();
    await repo.saveContentRevision(item);
    await repo.softDeleteContent(deletionRequest(item));
    now = '2026-10-11T00:00:00.000Z';
    await expect(repo.restoreDeletedContent(item.id, item.createdBy, '2026-10-05T00:00:00.000Z')).rejects.toThrow('Restore window expired');
    expect(await repo.getContent(item.id)).toBeNull();
  });

  it('purges atomically only after the deadline and immutable provider receipts, retaining a permanent barrier', async () => {
    let now = '2026-10-05T00:00:00.000Z';
    const repo = create({ deletionOperationsEnabled: true, now: () => now });
    const item = makeContentItem();
    await repo.saveContentRevision(item);
    await repo.softDeleteContent(deletionRequest(item));
    await expect(repo.purgeDeletedContent(item.id, '2026-11-03T00:00:00.000Z')).rejects.toThrow('future');
    now = '2026-11-03T00:00:00.000Z';
    await expect(repo.purgeDeletedContent(item.id, now)).rejects.toThrow('provider receipts incomplete');
    const receipt = { receiptId: 'synthetic-receipt', confirmedAt: '2026-11-02T01:00:00.000Z', receiptChecksum: 'sha256:' + 'c'.repeat(64) };
    await repo.recordContentProviderDeletionReceipt(item.id, 'synthetic-search', receipt);
    await expect(repo.recordContentProviderDeletionReceipt(item.id, 'synthetic-search', { ...receipt, receiptId: 'replacement' })).rejects.toThrow('immutable');
    const stored = await repo.purgeDeletedContent(item.id, now);
    expect(verifyContentPurgeReceipt(stored.tombstone)).toBe(true);
    expect(await repo.getContent(item.id)).toBeNull();
    expect(await repo.listVersions(item.id)).toEqual([]);
    await expect(repo.upsertContent(item)).rejects.toThrow('explicit restore');
    await expect(repo.saveContentRevision(item)).rejects.toThrow('explicit restore');
    await expect(repo.restoreDeletedContent(item.id, item.createdBy, now)).rejects.toThrow('Active content deletion not found');
  });

  it('traverses a large collection in bounded deterministic pages without duplicates or truncation', async () => {
    const repo = create();
    for (let index = 0; index < 205; index++) await repo.upsertContent(makeContentItem({ id: 'row-' + String(index).padStart(3, '0') }));
    await expect(repo.listContent()).rejects.toThrow('bounded read');
    const ids: string[] = [];
    let cursor: string | null = null;
    do {
      const page = await repo.listContentPage({ limit: 73, cursor });
      expect(page.items.length).toBeLessThanOrEqual(73);
      ids.push(...page.items.map((item) => item.id)); cursor = page.nextCursor;
    } while (cursor);
    expect(ids).toHaveLength(205);
    expect(new Set(ids).size).toBe(205);
    expect(ids).toEqual([...ids].sort());
    expect((await repo.listContentPage({ limit: 1000 })).items).toHaveLength(100);
    await expect(repo.listContentPage({ limit: NaN })).rejects.toThrow('positive integer');
    await expect(repo.listContentPage({ cursor: encodePageCursor({ id: 'row-003', sortValue: 'other-order' }) })).rejects.toThrow('Invalid content pagination cursor');
  });

  it('advances past a fully deleted page without returning retained private bodies', async () => {
    const repo = create({ deletionOperationsEnabled: true, now: () => '2026-10-05T00:00:00.000Z' });
    for (const id of ['a', 'b', 'c']) {
      const item = makeContentItem({ id }); await repo.saveContentRevision(item);
      if (id !== 'c') await repo.softDeleteContent(deletionRequest(item));
    }
    const first = await repo.listContentPage({ limit: 2 });
    expect(first.items).toEqual([]); expect(first.nextCursor).not.toBeNull();
    const second = await repo.listContentPage({ limit: 2, cursor: first.nextCursor });
    expect(second.items.map((item) => item.id)).toEqual(['c']); expect(second.nextCursor).toBeNull();
  });
});

describe('canonical storage and provider boundaries', () => {
  it('shares the identical strict schemas with the deployed runtime', () => {
    expect(runtimeSchemas.contentItemSchema).toBe(canonicalSchemas.contentItemSchema);
    expect(runtimeSchemas.telemetryEventSchema).toBe(canonicalSchemas.telemetryEventSchema);
    expect(runtimeSchemas.creatorSubmissionSchema).toBe(canonicalSchemas.creatorSubmissionSchema);
    expect(canonicalSchemas.narratorPromptSchema.safeParse({ id: '', tone: 'calm', prompt: '', quietHoursSafe: true, reflectionScript: '', accessibilityCaption: '' }).success).toBe(false);
    const telemetry = { event: 'content_viewed', userId: null, entityId: 'synthetic', timestamp: '2026-10-03T00:00:00.000Z', metadata: { memoryText: 'private body' } };
    expect(canonicalSchemas.telemetryEventSchema.safeParse(telemetry).success).toBe(false);
    expect(runtimeSchemas.telemetryEventSchema.safeParse(telemetry).success).toBe(false);
  });

  it('preserves the current snapshot when atomic revision allocation detects a legacy collision', async () => {
    const firestore = new FakeFirestore(); const repo = createFirestoreContentRepository(firestore); const item = makeContentItem();
    await repo.upsertContent(item);
    await firestore.collection('contentVersions').doc(item.id + '-v1').set({ contentId: item.id, version: 1, snapshot: item });
    await expect(repo.saveContentRevision({ ...item, title: 'Must not escape transaction' })).rejects.toThrow('already exists');
    expect(await repo.getContent(item.id)).toEqual(item);
    expect((await firestore.collection('contentRevisionCounters').doc(item.id).get()).exists).toBe(false);
  });

  it('bounds the actual provider query rather than fetching the full collection before slicing', async () => {
    const firestore = new FakeFirestore(); const repo = createFirestoreContentRepository(firestore);
    for (const id of ['a', 'b', 'c', 'd']) await repo.upsertContent(makeContentItem({ id }));
    const first = await repo.listContentPage({ limit: 2 });
    await repo.listContentPage({ limit: 2, cursor: first.nextCursor });
    expect(firestore.collection('contentItems').queryCalls).toEqual([
      { limit: 3, after: undefined, returned: 3 }, { limit: 3, after: 'b', returned: 2 },
    ]);
    await repo.getContentBySlug('missing');
    expect(firestore.collection('contentItems').queryCalls.at(-1)?.limit).toBe(2);
  });

  it('rejects mismatched document identities and malformed deletion markers', async () => {
    const firestore = new FakeFirestore(); const repo = createFirestoreContentRepository(firestore); const item = makeContentItem();
    await firestore.collection('contentItems').doc(item.id).set({ ...item, id: 'another' });
    await expect(repo.getContent(item.id)).rejects.toThrow('identity mismatch');
    await firestore.collection('contentItems').doc(item.id).set({ ...item, deletion: { tombstoneId: 'stone', state: 'fake-restored' } });
    await expect(repo.getContent(item.id)).rejects.toThrow('Invalid contentItems record');
  });

  it('refuses restoration if retained content was altered outside the lifecycle transaction', async () => {
    const firestore = new FakeFirestore(); const repo = createFirestoreContentRepository(firestore, { deletionOperationsEnabled: true, now: () => '2026-10-05T00:00:00.000Z' });
    const item = makeContentItem(); await repo.saveContentRevision(item); await repo.softDeleteContent(deletionRequest(item));
    await firestore.collection('contentItems').doc(item.id).set({ body: 'tampered retained text' }, { merge: true });
    await expect(repo.restoreDeletedContent(item.id, item.createdBy, '2026-10-05T00:00:00.000Z')).rejects.toThrow('snapshot checksum mismatch');
    expect((await firestore.collection('contentDeletionStates').doc(item.id).get()).data()?.state).toBe('retained_for_restore');
  });

  it('persists real purged state and receipt after deleting main, counter and history, and refuses an oversized batch', async () => {
    const firestore = new FakeFirestore(); const repo = createFirestoreContentRepository(firestore, { deletionOperationsEnabled: true, now: () => '2026-11-03T00:00:00.000Z' });
    const item = makeContentItem(); await repo.saveContentRevision(item);
    const request = deletionRequest(item, { providerTargets: [] }); await repo.softDeleteContent(request);
    await repo.purgeDeletedContent(item.id, '2026-11-03T00:00:00.000Z');
    expect((await firestore.collection('contentItems').doc(item.id).get()).exists).toBe(false);
    expect((await firestore.collection('contentRevisionCounters').doc(item.id).get()).exists).toBe(false);
    expect((await firestore.collection('contentVersions').doc(item.id + '-v1').get()).exists).toBe(false);
    expect((await firestore.collection('contentDeletionStates').doc(item.id).get()).data()?.state).toBe('purged');
    const persisted = (await firestore.collection('contentDeletionTombstones').doc(request.tombstoneId).get()).data();
    expect(verifyContentPurgeReceipt(persisted?.tombstone as Parameters<typeof verifyContentPurgeReceipt>[0])).toBe(true);

    const large = makeContentItem({ id: 'large-history' });
    for (let revision = 0; revision < 101; revision++) await repo.saveContentRevision(large);
    await repo.softDeleteContent(deletionRequest(large, { providerTargets: [] }));
    await expect(repo.purgeDeletedContent(large.id, '2026-11-03T00:00:00.000Z')).rejects.toThrow('bounded read');
    expect((await firestore.collection('contentItems').doc(large.id).get()).exists).toBe(true);
    expect((await firestore.collection('contentVersions').doc(large.id + '-v101').get()).exists).toBe(true);
    expect((await firestore.collection('contentDeletionStates').doc(large.id).get()).data()?.state).toBe('retained_for_restore');
  });
});

it('migrates legacy editorial snapshots to version 2 without losing fields and rejects unsafe rollback markers', async () => {
  const firestore = new FakeFirestore(); const repo = createFirestoreContentRepository(firestore); const item = makeContentItem();
  for (const schemaVersion of [undefined, 1, 2]) {
    const stored = schemaVersion === undefined ? item : { ...item, schemaVersion };
    expect(canonicalSchemas.parseRuntimeContentRecord(stored)).toEqual(item);
    expect(canonicalSchemas.serializeRuntimeContentRecord(stored)).toEqual({ ...item, schemaVersion: 2 });
  }
  await firestore.collection('contentItems').doc(item.id).set({ ...item, schemaVersion: 1 });
  await repo.saveContentRevision({ ...item, title: 'Validated migration' });
  expect((await firestore.collection('contentItems').doc(item.id).get()).data()?.schemaVersion).toBe(2);
  expect(await repo.getContent(item.id)).toEqual({ ...item, title: 'Validated migration' });
  for (const schemaVersion of [undefined, 1, 999]) expect(() => canonicalSchemas.parseStoredRuntimeContentRecord({ ...item, schemaVersion, deletion: { tombstoneId: 'delete', state: 'restored' } })).toThrow();
});
