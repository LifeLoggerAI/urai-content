# Firebase Adapter Implementation Guide

`urai-content` intentionally ships a repository contract, not a live Firebase Admin adapter. This keeps the package safe to import in multiple URAI runtimes without forcing credentials, Admin SDK initialization, or hosting decisions into the content package.

## Goal

A consuming backend, Firebase Functions app, or future standalone web runtime should implement the current `ContentRepository` contract from `src/backend/types.ts` using Firestore and inject it into `ContentService`.

Do not copy an adapter whose method names differ from the current interface. The source of truth is always `src/backend/types.ts`.

## Required runtime responsibilities

The runtime app must own:

- Firebase Admin SDK initialization
- Auth custom claims and role checks
- Firestore reads/writes
- Storage writes for exports
- Stripe verification and checkout webhooks
- deployment secrets
- emulator setup
- production environment separation

## Recommended file layout in consuming app

```txt
src/
  firebase/
    admin.ts
    contentRepository.ts
  functions/
    content.ts
    exports.ts
    marketplace.ts
    webhooks.ts
```

## Current repository methods to implement

The adapter must implement every method below:

```ts
export interface ContentRepository {
  upsertContent(item: ContentItem): Promise<void>;
  getContent(id: string): Promise<ContentItem | null>;
  listContent(): Promise<ContentItem[]>;
  deleteContent(id: string): Promise<void>;
  addVersion(contentId: string, snapshot: ContentItem): Promise<number>;
  listVersions(contentId: string): Promise<Array<{ version: number; snapshot: ContentItem }>>;
  logModeration(item: ModerationQueueItem): Promise<void>;
  logRelease(release: PublishingRelease): Promise<void>;
  addTelemetry(event: TelemetryEvent): Promise<void>;
  listTelemetry(limit?: number): Promise<TelemetryEvent[]>;
  listEntitlements(userId: string): Promise<UserContentEntitlement[]>;
  upsertNarratorPrompt(prompt: NarratorPrompt): Promise<void>;
  upsertStoryTemplate(template: StoryTemplate): Promise<void>;
  upsertRitualTemplate(template: RitualTemplate): Promise<void>;
  upsertMarketplaceItem(item: MarketplaceItem): Promise<void>;
  upsertCreatorSubmission(item: CreatorSubmission): Promise<void>;
  upsertExportTemplate(item: ExportTemplate): Promise<void>;
}
```

## Adapter skeleton aligned to current contract

```ts
import type { Firestore } from 'firebase-admin/firestore';
import {
  ContentService,
  FIRESTORE_COLLECTIONS,
  type ContentRepository
} from 'urai-content';

export function createFirestoreContentRepository(db: Firestore): ContentRepository {
  return {
    async upsertContent(item) {
      await db.collection(FIRESTORE_COLLECTIONS.contentItems).doc(item.id).set(item, { merge: true });
    },

    async getContent(id) {
      const snap = await db.collection(FIRESTORE_COLLECTIONS.contentItems).doc(id).get();
      return snap.exists ? snap.data() as any : null;
    },

    async listContent() {
      const snap = await db.collection(FIRESTORE_COLLECTIONS.contentItems).get();
      return snap.docs.map((doc) => doc.data() as any);
    },

    async deleteContent(id) {
      await db.collection(FIRESTORE_COLLECTIONS.contentItems).doc(id).delete();
    },

    async addVersion(contentId, snapshot) {
      const versions = await this.listVersions(contentId);
      const version = versions.length + 1;
      await db
        .collection(FIRESTORE_COLLECTIONS.contentVersions)
        .doc(`${contentId}-v${version}`)
        .set({ version, snapshot, contentId });
      return version;
    },

    async listVersions(contentId) {
      const snap = await db
        .collection(FIRESTORE_COLLECTIONS.contentVersions)
        .where('contentId', '==', contentId)
        .orderBy('version', 'asc')
        .get();
      return snap.docs.map((doc) => doc.data() as any);
    },

    async logModeration(item) {
      await db.collection(FIRESTORE_COLLECTIONS.moderationQueue).doc(item.id).set(item);
    },

    async logRelease(release) {
      await db.collection(FIRESTORE_COLLECTIONS.publishingReleases).doc(release.id).set(release);
    },

    async addTelemetry(event) {
      await db.collection(FIRESTORE_COLLECTIONS.telemetryEvents).add(event);
    },

    async listTelemetry(limit = 100) {
      const snap = await db
        .collection(FIRESTORE_COLLECTIONS.telemetryEvents)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      return snap.docs.map((doc) => doc.data() as any);
    },

    async listEntitlements(userId) {
      const snap = await db
        .collection(FIRESTORE_COLLECTIONS.userContentEntitlements)
        .where('userId', '==', userId)
        .get();
      return snap.docs.map((doc) => doc.data() as any);
    },

    async upsertNarratorPrompt(prompt) {
      await db.collection(FIRESTORE_COLLECTIONS.narratorPrompts).doc(prompt.id).set(prompt, { merge: true });
    },

    async upsertStoryTemplate(template) {
      await db.collection(FIRESTORE_COLLECTIONS.storyTemplates).doc(template.id).set(template, { merge: true });
    },

    async upsertRitualTemplate(template) {
      await db.collection(FIRESTORE_COLLECTIONS.ritualTemplates).doc(template.id).set(template, { merge: true });
    },

    async upsertMarketplaceItem(item) {
      await db.collection(FIRESTORE_COLLECTIONS.marketplaceItems).doc(item.id).set(item, { merge: true });
    },

    async upsertCreatorSubmission(item) {
      await db.collection(FIRESTORE_COLLECTIONS.creatorSubmissions).doc(item.id).set(item, { merge: true });
    },

    async upsertExportTemplate(item) {
      await db.collection(FIRESTORE_COLLECTIONS.exportTemplates).doc(item.id).set(item, { merge: true });
    }
  };
}

export function createContentService(db: Firestore) {
  return new ContentService(createFirestoreContentRepository(db));
}
```

The skeleton is intentionally minimal. A production adapter must add schema parsing at boundaries, typed errors, pagination, indexes, auth checks in callers, idempotency where needed, and emulator-backed tests.

## Required collections

The package contract currently names these Firestore collections:

- `contentItems`
- `contentVersions`
- `moderationQueue`
- `publishingReleases`
- `telemetryEvents`
- `userContentEntitlements`
- `narratorPrompts`
- `storyTemplates`
- `ritualTemplates`
- `marketplaceItems`
- `creatorSubmissions`
- `exportTemplates`

Production schema docs may add additional runtime collections for packs, manifests, licenses, export jobs, consents, provenance, tiers, roadmap phases, expansion modules, integrations, and SEO pages. Add those deliberately in the runtime app when they are actually persisted and tested.

## Required security behavior

- Public users can read only published public records.
- Authenticated users can read their own export jobs, consents, purchases, and entitlements.
- Creators can create submissions only for themselves.
- Admins can approve, publish, moderate, and override tiers.
- Provenance and audit records are admin-only.
- License evidence packs are visible only to admins or the licensee.

## Required tests in consuming app

- repository creates and reads content
- repository updates workflow status
- versions are persisted in order
- entitlement lookup works
- creator submission is owner-scoped
- admin approval writes release/provenance evidence
- export job state transitions persist
- Firestore rules deny unauthorized writes
- Firestore rules allow valid owner reads

## Local emulator command pattern

```bash
firebase emulators:exec "npm run test:integration"
```

## Production checklist

- [ ] Firebase Admin SDK initialized server-side only
- [ ] no Admin SDK imported into browser bundles
- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] indexes deployed
- [ ] CI has Firebase deploy token or service account
- [ ] Stripe webhook endpoint configured if marketplace payments are enabled
- [ ] deployment URL smoke tested

## Anti-fake rule

Do not mark Firebase adapter work complete until an integration test proves the runtime can create, read, update, version, and secure content records with emulator or deployed rules.
