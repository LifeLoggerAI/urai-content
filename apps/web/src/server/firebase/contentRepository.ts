import type {
  ContentItem,
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
} from '../../../../../src/schemas/content';
import type { ContentRepository } from '../../../../../src/backend/types';
import { FIRESTORE_COLLECTIONS } from '../../../../../src/backend/firebaseRepository.contract';

type DocumentSnapshotLike<T> = {
  exists: boolean;
  data(): T | undefined;
};

type QuerySnapshotLike<T> = {
  docs: Array<{ data(): T }>;
};

type DocumentReferenceLike<T> = {
  set(data: T | Record<string, unknown>, options?: { merge?: boolean }): Promise<void>;
  get(): Promise<DocumentSnapshotLike<T>>;
  delete(): Promise<void>;
};

type QueryLike<T> = {
  where(field: string, operator: '==', value: unknown): QueryLike<T>;
  orderBy(field: string, direction?: 'asc' | 'desc'): QueryLike<T>;
  limit(limit: number): QueryLike<T>;
  get(): Promise<QuerySnapshotLike<T>>;
};

type CollectionReferenceLike<T> = QueryLike<T> & {
  doc(id?: string): DocumentReferenceLike<T>;
  add(data: T): Promise<DocumentReferenceLike<T>>;
};

export type FirestoreLike = {
  collection<T = Record<string, unknown>>(path: string): CollectionReferenceLike<T>;
};

function typedCollection<T>(db: FirestoreLike, path: string): CollectionReferenceLike<T> {
  return db.collection<T>(path);
}

function sortByVersion<T extends { version: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.version - b.version);
}

export function createFirestoreContentRepository(db: FirestoreLike): ContentRepository {
  return {
    async upsertContent(item: ContentItem): Promise<void> {
      await typedCollection<ContentItem>(db, FIRESTORE_COLLECTIONS.contentItems).doc(item.id).set(item, { merge: true });
    },

    async getContent(id: string): Promise<ContentItem | null> {
      const snap = await typedCollection<ContentItem>(db, FIRESTORE_COLLECTIONS.contentItems).doc(id).get();
      return snap.exists ? snap.data() ?? null : null;
    },

    async listContent(): Promise<ContentItem[]> {
      const snap = await typedCollection<ContentItem>(db, FIRESTORE_COLLECTIONS.contentItems).get();
      return snap.docs.map((doc) => doc.data());
    },

    async deleteContent(id: string): Promise<void> {
      await typedCollection<ContentItem>(db, FIRESTORE_COLLECTIONS.contentItems).doc(id).delete();
    },

    async addVersion(contentId: string, snapshot: ContentItem): Promise<number> {
      const versions = await this.listVersions(contentId);
      const version = versions.length + 1;
      await typedCollection<{ contentId: string; version: number; snapshot: ContentItem }>(
        db,
        FIRESTORE_COLLECTIONS.contentVersions
      )
        .doc(`${contentId}-v${version}`)
        .set({ contentId, version, snapshot });
      return version;
    },

    async listVersions(contentId: string): Promise<Array<{ version: number; snapshot: ContentItem }>> {
      const snap = await typedCollection<{ contentId: string; version: number; snapshot: ContentItem }>(
        db,
        FIRESTORE_COLLECTIONS.contentVersions
      )
        .where('contentId', '==', contentId)
        .get();

      return sortByVersion(snap.docs.map((doc) => doc.data())).map(({ version, snapshot }) => ({ version, snapshot }));
    },

    async logModeration(item: ModerationQueueItem): Promise<void> {
      await typedCollection<ModerationQueueItem>(db, FIRESTORE_COLLECTIONS.moderationQueue).doc(item.id).set(item);
    },

    async logRelease(release: PublishingRelease): Promise<void> {
      await typedCollection<PublishingRelease>(db, FIRESTORE_COLLECTIONS.publishingReleases).doc(release.id).set(release);
    },

    async addTelemetry(event: TelemetryEvent): Promise<void> {
      await typedCollection<TelemetryEvent>(db, FIRESTORE_COLLECTIONS.telemetryEvents).add(event);
    },

    async listTelemetry(limit = 100): Promise<TelemetryEvent[]> {
      const snap = await typedCollection<TelemetryEvent>(db, FIRESTORE_COLLECTIONS.telemetryEvents)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      return snap.docs.map((doc) => doc.data());
    },

    async listEntitlements(userId: string): Promise<UserContentEntitlement[]> {
      const snap = await typedCollection<UserContentEntitlement>(db, FIRESTORE_COLLECTIONS.userContentEntitlements)
        .where('userId', '==', userId)
        .get();
      return snap.docs.map((doc) => doc.data());
    },

    async upsertNarratorPrompt(prompt: NarratorPrompt): Promise<void> {
      await typedCollection<NarratorPrompt>(db, FIRESTORE_COLLECTIONS.narratorPrompts).doc(prompt.id).set(prompt, { merge: true });
    },

    async upsertStoryTemplate(template: StoryTemplate): Promise<void> {
      await typedCollection<StoryTemplate>(db, FIRESTORE_COLLECTIONS.storyTemplates).doc(template.id).set(template, { merge: true });
    },

    async upsertRitualTemplate(template: RitualTemplate): Promise<void> {
      await typedCollection<RitualTemplate>(db, FIRESTORE_COLLECTIONS.ritualTemplates).doc(template.id).set(template, { merge: true });
    },

    async upsertMarketplaceItem(item: MarketplaceItem): Promise<void> {
      await typedCollection<MarketplaceItem>(db, FIRESTORE_COLLECTIONS.marketplaceItems).doc(item.id).set(item, { merge: true });
    },

    async upsertCreatorSubmission(item: CreatorSubmission): Promise<void> {
      await typedCollection<CreatorSubmission>(db, FIRESTORE_COLLECTIONS.creatorSubmissions).doc(item.id).set(item, { merge: true });
    },

    async upsertExportTemplate(item: ExportTemplate): Promise<void> {
      await typedCollection<ExportTemplate>(db, FIRESTORE_COLLECTIONS.exportTemplates).doc(item.id).set(item, { merge: true });
    }
  };
}
