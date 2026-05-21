import { describe, expect, it } from 'vitest';
import { createFirestoreContentRepository, type FirestoreLike } from '../src/server/firebase/contentRepository';
import type { ContentItem, TelemetryEvent, UserContentEntitlement } from '../../../src/schemas/content';

type FirestoreData = Record<string, unknown>;

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
  constructor(readonly docs: Array<{ data(): FirestoreData }>) {}
}

type Filter = { field: string; value: unknown };
type Order = { field: string; direction: 'asc' | 'desc' };

class FakeCollection {
  readonly setCalls: SetCall[] = [];
  private readonly rows = new Map<string, FirestoreData>();

  constructor(
    private readonly filters: Filter[] = [],
    private readonly order: Order | null = null,
    private readonly resultLimit: number | null = null
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
    const next = new FakeCollection([...this.filters, { field, value }], this.order, this.resultLimit);
    next.rowsRef = this.rowsRef;
    next.setCallsRef = this.setCallsRef;
    return next;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    const next = new FakeCollection(this.filters, { field, direction }, this.resultLimit);
    next.rowsRef = this.rowsRef;
    next.setCallsRef = this.setCallsRef;
    return next;
  }

  limit(limit: number) {
    const next = new FakeCollection(this.filters, this.order, limit);
    next.rowsRef = this.rowsRef;
    next.setCallsRef = this.setCallsRef;
    return next;
  }

  async get() {
    let values = [...this.rowsRef.values()];

    for (const filter of this.filters) {
      values = values.filter((value) => value[filter.field] === filter.value);
    }

    if (this.order) {
      const { field, direction } = this.order;
      values.sort((a, b) => {
        const left = String(a[field] ?? '');
        const right = String(b[field] ?? '');
        return direction === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
      });
    }

    if (this.resultLimit !== null) {
      values = values.slice(0, this.resultLimit);
    }

    return new FakeQuerySnapshot(values.map((value) => ({ data: () => value })));
  }

  private rowsRef = this.rows;
  private setCallsRef = this.setCalls;
}

class FakeFirestore implements FirestoreLike {
  private readonly collections = new Map<string, FakeCollection>();

  collection(path: string) {
    if (!this.collections.has(path)) {
      this.collections.set(path, new FakeCollection());
    }

    return this.collections.get(path)!;
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
  it('creates, reads, lists, versions, and deletes content', async () => {
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

    await repo.deleteContent(item.id);
    expect(await repo.getContent(item.id)).toBeNull();
  });

  it('uses merge writes for upserted records that may be edited incrementally', async () => {
    const firestore = new FakeFirestore();
    const repo = createFirestoreContentRepository(firestore);
    const item = makeContentItem();

    await repo.upsertContent(item);

    expect(firestore.collection('contentItems').setCalls).toEqual([
      { id: item.id, data: item as unknown as FirestoreData, options: { merge: true } }
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
});
