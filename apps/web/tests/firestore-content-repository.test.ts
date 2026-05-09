import { describe, expect, it } from 'vitest';
import { createFirestoreContentRepository, type FirestoreLike } from '../src/server/firebase/contentRepository';
import type { ContentItem, TelemetryEvent, UserContentEntitlement } from '../../../src/schemas/content';

class FakeDocumentSnapshot<T> {
  constructor(private readonly value: T | undefined) {}

  get exists() {
    return this.value !== undefined;
  }

  data(): T | undefined {
    return this.value;
  }
}

class FakeQuerySnapshot<T> {
  constructor(readonly docs: Array<{ data(): T }>) {}
}

type Filter = { field: string; value: unknown };
type Order = { field: string; direction: 'asc' | 'desc' };

class FakeCollection<T extends Record<string, unknown>> {
  private readonly rows = new Map<string, T>();

  constructor(
    private readonly filters: Filter[] = [],
    private readonly order: Order | null = null,
    private readonly resultLimit: number | null = null
  ) {}

  doc(id = `doc-${this.rows.size + 1}`) {
    return {
      set: async (data: T | Record<string, unknown>) => {
        this.rows.set(id, data as T);
      },
      get: async () => new FakeDocumentSnapshot<T>(this.rows.get(id)),
      delete: async () => {
        this.rows.delete(id);
      }
    };
  }

  async add(data: T) {
    const ref = this.doc(`auto-${this.rows.size + 1}`);
    await ref.set(data);
    return ref;
  }

  where(field: string, operator: '==', value: unknown) {
    if (operator !== '==') throw new Error(`Unsupported fake operator ${operator}`);
    const next = new FakeCollection<T>([...this.filters, { field, value }], this.order, this.resultLimit);
    next.rowsRef = this.rows;
    return next;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    const next = new FakeCollection<T>(this.filters, { field, direction }, this.resultLimit);
    next.rowsRef = this.rows;
    return next;
  }

  limit(limit: number) {
    const next = new FakeCollection<T>(this.filters, this.order, limit);
    next.rowsRef = this.rows;
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
}

class FakeFirestore implements FirestoreLike {
  private readonly collections = new Map<string, FakeCollection<Record<string, unknown>>>();

  collection<T = Record<string, unknown>>(path: string) {
    if (!this.collections.has(path)) {
      this.collections.set(path, new FakeCollection<Record<string, unknown>>());
    }

    return this.collections.get(path)! as unknown as ReturnType<FirestoreLike['collection<T>']>;
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

  it('filters entitlements by user', async () => {
    const repo = createFirestoreContentRepository(new FakeFirestore());
    const now = new Date().toISOString();
    const entitlement: UserContentEntitlement = {
      userId: 'user-1',
      entitlementKey: 'tier:pro',
      grantedBy: 'subscription',
      grantedAt: now,
      expiresAt: null
    };

    await repo.listEntitlements('missing-user');
    await repo.addTelemetry({
      event: 'content_viewed',
      userId: 'user-1',
      entityId: 'content-1',
      timestamp: now,
      metadata: {}
    });

    const firestore = new FakeFirestore();
    const repoWithEntitlements = createFirestoreContentRepository(firestore);
    await firestore.collection<UserContentEntitlement>('userContentEntitlements').doc('ent-1').set(entitlement);
    await firestore.collection<UserContentEntitlement>('userContentEntitlements').doc('ent-2').set({ ...entitlement, userId: 'user-2' });

    expect(await repoWithEntitlements.listEntitlements('user-1')).toEqual([entitlement]);
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
