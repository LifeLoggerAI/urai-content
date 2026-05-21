import type {
  ContentItem,
  ContentRepository,
  CreatorSubmission,
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

type FirestoreData = Record<string, unknown>;

type DocumentSnapshotLike = { exists: boolean; data(): FirestoreData | undefined };
type QuerySnapshotLike = { docs: Array<{ data(): FirestoreData }> };
type DocumentReferenceLike = {
  set(data: FirestoreData, options?: { merge?: boolean }): Promise<unknown>;
  get(): Promise<DocumentSnapshotLike>;
  delete(): Promise<unknown>;
};
type QueryLike = {
  where(field: string, operator: '==', value: unknown): QueryLike;
  orderBy(field: string, direction?: 'asc' | 'desc'): QueryLike;
  limit(limit: number): QueryLike;
  get(): Promise<QuerySnapshotLike>;
};
type CollectionReferenceLike = QueryLike & { doc(id?: string): DocumentReferenceLike; add(data: FirestoreData): Promise<unknown> };

export type FirestoreLike = { collection(path: string): CollectionReferenceLike };

function collection(db: FirestoreLike, path: string): CollectionReferenceLike { return db.collection(path); }
function asRecord<T>(value: T): FirestoreData { return value as FirestoreData; }
function asType<T>(value: FirestoreData): T { return value as T; }
function sortByVersion<T extends { version: number }>(items: T[]): T[] { return [...items].sort((a, b) => a.version - b.version); }
function sortSubmissions(items: CreatorSubmission[]): CreatorSubmission[] {
  return [...items].sort((a, b) => String(b.submittedAt ?? b.updatedAt ?? '').localeCompare(String(a.submittedAt ?? a.updatedAt ?? '')));
}

export function createFirestoreContentRepository(db: FirestoreLike): ContentRepository {
  return {
    async upsertContent(item: ContentItem): Promise<void> { await collection(db, FIRESTORE_COLLECTIONS.contentItems).doc(item.id).set(asRecord(item), { merge: true }); },
    async getContent(id: string): Promise<ContentItem | null> {
      const snap = await collection(db, FIRESTORE_COLLECTIONS.contentItems).doc(id).get();
      return snap.exists && snap.data() ? asType<ContentItem>(snap.data()!) : null;
    },
    async listContent(): Promise<ContentItem[]> {
      const snap = await collection(db, FIRESTORE_COLLECTIONS.contentItems).get();
      return snap.docs.map((doc) => asType<ContentItem>(doc.data()));
    },
    async deleteContent(id: string): Promise<void> { await collection(db, FIRESTORE_COLLECTIONS.contentItems).doc(id).delete(); },
    async addVersion(contentId: string, snapshot: ContentItem): Promise<number> {
      const versions = await this.listVersions(contentId);
      const version = versions.length + 1;
      await collection(db, FIRESTORE_COLLECTIONS.contentVersions).doc(`${contentId}-v${version}`).set(asRecord({ contentId, version, snapshot }));
      return version;
    },
    async listVersions(contentId: string): Promise<Array<{ version: number; snapshot: ContentItem }>> {
      const snap = await collection(db, FIRESTORE_COLLECTIONS.contentVersions).where('contentId', '==', contentId).get();
      const versions = snap.docs.map((doc) => asType<{ contentId: string; version: number; snapshot: ContentItem }>(doc.data()));
      return sortByVersion(versions).map(({ version, snapshot }) => ({ version, snapshot }));
    },
    async logModeration(item: ModerationQueueItem): Promise<void> { await collection(db, FIRESTORE_COLLECTIONS.moderationQueue).doc(item.id).set(asRecord(item)); },
    async logRelease(release: PublishingRelease): Promise<void> { await collection(db, FIRESTORE_COLLECTIONS.publishingReleases).doc(release.id).set(asRecord(release)); },
    async addTelemetry(event: TelemetryEvent): Promise<void> { await collection(db, FIRESTORE_COLLECTIONS.telemetryEvents).add(asRecord(event)); },
    async listTelemetry(limit = 100): Promise<TelemetryEvent[]> {
      const snap = await collection(db, FIRESTORE_COLLECTIONS.telemetryEvents).orderBy('timestamp', 'desc').limit(limit).get();
      return snap.docs.map((doc) => asType<TelemetryEvent>(doc.data()));
    },
    async listEntitlements(userId: string): Promise<UserContentEntitlement[]> {
      const snap = await collection(db, FIRESTORE_COLLECTIONS.userContentEntitlements).where('userId', '==', userId).get();
      return snap.docs.map((doc) => asType<UserContentEntitlement>(doc.data()));
    },
    async upsertNarratorPrompt(prompt: NarratorPrompt): Promise<void> { await collection(db, FIRESTORE_COLLECTIONS.narratorPrompts).doc(prompt.id).set(asRecord(prompt), { merge: true }); },
    async upsertStoryTemplate(template: StoryTemplate): Promise<void> { await collection(db, FIRESTORE_COLLECTIONS.storyTemplates).doc(template.id).set(asRecord(template), { merge: true }); },
    async upsertRitualTemplate(template: RitualTemplate): Promise<void> { await collection(db, FIRESTORE_COLLECTIONS.ritualTemplates).doc(template.id).set(asRecord(template), { merge: true }); },
    async upsertMarketplaceItem(item: MarketplaceItem): Promise<void> { await collection(db, FIRESTORE_COLLECTIONS.marketplaceItems).doc(item.id).set(asRecord(item), { merge: true }); },
    async upsertCreatorSubmission(item: CreatorSubmission): Promise<void> { await collection(db, FIRESTORE_COLLECTIONS.creatorSubmissions).doc(item.id).set(asRecord(item), { merge: true }); },
    async getCreatorSubmission(id: string): Promise<CreatorSubmission | null> {
      const snap = await collection(db, FIRESTORE_COLLECTIONS.creatorSubmissions).doc(id).get();
      return snap.exists && snap.data() ? asType<CreatorSubmission>(snap.data()!) : null;
    },
    async listCreatorSubmissions(creatorId: string): Promise<CreatorSubmission[]> {
      const snap = await collection(db, FIRESTORE_COLLECTIONS.creatorSubmissions).where('creatorId', '==', creatorId).get();
      return sortSubmissions(snap.docs.map((doc) => asType<CreatorSubmission>(doc.data())));
    },
    async upsertExportTemplate(item: ExportTemplate): Promise<void> { await collection(db, FIRESTORE_COLLECTIONS.exportTemplates).doc(item.id).set(asRecord(item), { merge: true }); }
  };
}
