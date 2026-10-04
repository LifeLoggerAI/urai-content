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
  parseRuntimeContentRecord,
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

type FirestoreData = Record<string, unknown>;

type DocumentSnapshotLike = { exists: boolean; data(): FirestoreData | undefined };
type QuerySnapshotLike = { docs: Array<{ data(): FirestoreData }> };
type DocumentReferenceLike = {
  set(data: FirestoreData, options?: { merge?: boolean }): Promise<unknown>;
  get(): Promise<DocumentSnapshotLike>;
  delete(): Promise<unknown>;
};
type TransactionLike = {
  get(ref: DocumentReferenceLike): Promise<DocumentSnapshotLike>;
  set(ref: DocumentReferenceLike, data: FirestoreData, options?: { merge?: boolean }): unknown;
};
type QueryLike = {
  where(field: string, operator: '==', value: unknown): QueryLike;
  orderBy(field: string, direction?: 'asc' | 'desc'): QueryLike;
  limit(limit: number): QueryLike;
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
function queueLimit(limit?: number): number {
  return Math.min(Math.max(limit ?? 50, 1), 100);
}

export function createFirestoreContentRepository(db: FirestoreLike): ContentRepository {
  return {
    async upsertContent(item: ContentItem): Promise<void> { const parsed = parseRuntimeRecord(contentItemSchema, FIRESTORE_COLLECTIONS.contentItems, item); await collection(db, FIRESTORE_COLLECTIONS.contentItems).doc(parsed.id).set(asRecord(serializeRuntimeContentRecord(parsed)), { merge: true }); },
    async getContent(id: string): Promise<ContentItem | null> {
      const snap = await collection(db, FIRESTORE_COLLECTIONS.contentItems).doc(id).get();
      return snap.exists && snap.data() ? parseRuntimeContentRecord(snap.data()!) : null;
    },
    async listContent(): Promise<ContentItem[]> {
      const snap = await collection(db, FIRESTORE_COLLECTIONS.contentItems).get();
      return snap.docs.map((doc) => parseRuntimeContentRecord(doc.data()));
    },
    async deleteContent(id: string): Promise<void> { await collection(db, FIRESTORE_COLLECTIONS.contentItems).doc(id).delete(); },
    async addVersion(contentId: string, snapshot: ContentItem): Promise<number> {
      const counterRef = collection(db, 'contentRevisionCounters').doc(contentId);
      return db.runTransaction(async (transaction) => {
        const counterSnapshot = await transaction.get(counterRef);
        const counterData = counterSnapshot.exists ? counterSnapshot.data() : undefined;
        const previousVersion = counterData?.version === undefined ? 0 : Number(counterData.version);
        if (!Number.isSafeInteger(previousVersion) || previousVersion < 0) {
          throw new Error('Invalid content revision counter for ' + contentId);
        }

        const version = previousVersion + 1;
        const versionRef = collection(db, FIRESTORE_COLLECTIONS.contentVersions).doc(`${contentId}-v${version}`);
        transaction.set(versionRef, asRecord({ contentId, version, snapshot }));
        transaction.set(counterRef, { contentId, version, updatedAt: new Date().toISOString() }, { merge: true });
        return version;
      });
    },
    async listVersions(contentId: string): Promise<Array<{ version: number; snapshot: ContentItem }>> {
      const snap = await collection(db, FIRESTORE_COLLECTIONS.contentVersions).where('contentId', '==', contentId).get();
      const versions = snap.docs.map((doc) => parseRuntimeRecord(contentVersionRecordSchema, FIRESTORE_COLLECTIONS.contentVersions, doc.data()));
      return sortByVersion(versions).map(({ version, snapshot }) => ({ version, snapshot }));
    },
    async logModeration(item: ModerationQueueItem): Promise<void> { const parsed = parseRuntimeRecord(moderationQueueSchema, FIRESTORE_COLLECTIONS.moderationQueue, item); await collection(db, FIRESTORE_COLLECTIONS.moderationQueue).doc(parsed.id).set(asRecord(parsed)); },
    async logRelease(release: PublishingRelease): Promise<void> { const parsed = parseRuntimeRecord(publishingReleaseSchema, FIRESTORE_COLLECTIONS.publishingReleases, release); await collection(db, FIRESTORE_COLLECTIONS.publishingReleases).doc(parsed.id).set(asRecord(parsed)); },
    async addTelemetry(event: TelemetryEvent): Promise<void> { const parsed = parseRuntimeRecord(telemetryEventSchema, FIRESTORE_COLLECTIONS.telemetryEvents, event); await collection(db, FIRESTORE_COLLECTIONS.telemetryEvents).add(asRecord(parsed)); },
    async listTelemetry(limit = 100): Promise<TelemetryEvent[]> {
      const snap = await collection(db, FIRESTORE_COLLECTIONS.telemetryEvents).orderBy('timestamp', 'desc').limit(limit).get();
      return snap.docs.map((doc) => parseRuntimeRecord(telemetryEventSchema, FIRESTORE_COLLECTIONS.telemetryEvents, doc.data()));
    },
    async listEntitlements(userId: string): Promise<UserContentEntitlement[]> {
      const snap = await collection(db, FIRESTORE_COLLECTIONS.userContentEntitlements).where('userId', '==', userId).get();
      return snap.docs.map((doc) => parseRuntimeRecord(userContentEntitlementSchema, FIRESTORE_COLLECTIONS.userContentEntitlements, doc.data()));
    },
    async upsertNarratorPrompt(prompt: NarratorPrompt): Promise<void> { const parsed = parseRuntimeRecord(narratorPromptSchema, FIRESTORE_COLLECTIONS.narratorPrompts, prompt); await collection(db, FIRESTORE_COLLECTIONS.narratorPrompts).doc(parsed.id).set(asRecord(parsed), { merge: true }); },
    async upsertStoryTemplate(template: StoryTemplate): Promise<void> { const parsed = parseRuntimeRecord(storyTemplateSchema, FIRESTORE_COLLECTIONS.storyTemplates, template); await collection(db, FIRESTORE_COLLECTIONS.storyTemplates).doc(parsed.id).set(asRecord(parsed), { merge: true }); },
    async upsertRitualTemplate(template: RitualTemplate): Promise<void> { const parsed = parseRuntimeRecord(ritualTemplateSchema, FIRESTORE_COLLECTIONS.ritualTemplates, template); await collection(db, FIRESTORE_COLLECTIONS.ritualTemplates).doc(parsed.id).set(asRecord(parsed), { merge: true }); },
    async upsertMarketplaceItem(item: MarketplaceItem): Promise<void> { const parsed = parseRuntimeRecord(marketplaceItemSchema, FIRESTORE_COLLECTIONS.marketplaceItems, item); await collection(db, FIRESTORE_COLLECTIONS.marketplaceItems).doc(parsed.id).set(asRecord(parsed), { merge: true }); },
    async upsertCreatorSubmission(item: CreatorSubmission): Promise<void> { const parsed = parseRuntimeRecord(creatorSubmissionSchema, FIRESTORE_COLLECTIONS.creatorSubmissions, item); await collection(db, FIRESTORE_COLLECTIONS.creatorSubmissions).doc(parsed.id).set(asRecord(parsed), { merge: true }); },
    async getCreatorSubmission(id: string): Promise<CreatorSubmission | null> {
      const snap = await collection(db, FIRESTORE_COLLECTIONS.creatorSubmissions).doc(id).get();
      return snap.exists && snap.data() ? parseRuntimeRecord(creatorSubmissionSchema, FIRESTORE_COLLECTIONS.creatorSubmissions, snap.data()!) : null;
    },
    async listCreatorSubmissions(creatorId: string): Promise<CreatorSubmission[]> {
      const snap = await collection(db, FIRESTORE_COLLECTIONS.creatorSubmissions).where('creatorId', '==', creatorId).get();
      return sortSubmissions(snap.docs.map((doc) => parseRuntimeRecord(creatorSubmissionSchema, FIRESTORE_COLLECTIONS.creatorSubmissions, doc.data())));
    },
    async listCreatorSubmissionQueue(options: CreatorSubmissionQueueOptions = {}): Promise<CreatorSubmission[]> {
      const limit = queueLimit(options.limit);
      const query = options.status
        ? collection(db, FIRESTORE_COLLECTIONS.creatorSubmissions).where('status', '==', options.status).limit(limit)
        : collection(db, FIRESTORE_COLLECTIONS.creatorSubmissions).limit(limit);
      const snap = await query.get();
      return sortSubmissions(snap.docs.map((doc) => parseRuntimeRecord(creatorSubmissionSchema, FIRESTORE_COLLECTIONS.creatorSubmissions, doc.data()))).slice(0, limit);
    },
    async upsertExportTemplate(item: ExportTemplate): Promise<void> { const parsed = parseRuntimeRecord(exportTemplateSchema, FIRESTORE_COLLECTIONS.exportTemplates, item); await collection(db, FIRESTORE_COLLECTIONS.exportTemplates).doc(parsed.id).set(asRecord(parsed), { merge: true }); }
  };
}
