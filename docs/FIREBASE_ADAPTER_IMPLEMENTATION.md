# Firebase Adapter Implementation Guide

`urai-content` intentionally ships a repository contract, not a live Firebase Admin adapter. This keeps the package safe to import in multiple URAI runtimes without forcing credentials, Admin SDK initialization, or hosting decisions into the content package.

## Goal

A consuming backend or Firebase Functions app should implement the `ContentRepository` contract using Firestore and inject it into `ContentService`.

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

## Adapter skeleton

```ts
import { ContentService, type ContentRepository } from 'urai-content';
import type { Firestore } from 'firebase-admin/firestore';

export function createFirestoreContentRepository(db: Firestore): ContentRepository {
  return {
    async createContent(item) {
      await db.collection('contentItems').doc(item.id).set(item);
      return item;
    },
    async getContent(id) {
      const snap = await db.collection('contentItems').doc(id).get();
      return snap.exists ? snap.data() as any : null;
    },
    async updateContent(id, patch) {
      const ref = db.collection('contentItems').doc(id);
      await ref.set({ ...patch, updatedAt: new Date().toISOString() }, { merge: true });
      const snap = await ref.get();
      return snap.data() as any;
    },
    async listContent() {
      const snap = await db.collection('contentItems').get();
      return snap.docs.map((doc) => doc.data() as any);
    },
    async saveVersion(version) {
      await db.collection('contentVersions').doc(version.id).set(version);
    },
    async logModerationEvent(event) {
      await db.collection('moderationQueue').doc(event.id).set(event);
    },
    async logRelease(release) {
      await db.collection('publishingReleases').doc(release.id).set(release);
    },
    async logTelemetry(event) {
      await db.collection('analyticsEvents').add(event);
    },
    async getEntitlement(userId, entitlementKey) {
      const id = `${userId}_${entitlementKey}`;
      const snap = await db.collection('userEntitlements').doc(id).get();
      return snap.exists ? snap.data() as any : null;
    }
  };
}

export function createContentService(db: Firestore) {
  return new ContentService(createFirestoreContentRepository(db));
}
```

Adjust method names to match the current `ContentRepository` interface in `src/backend/types.ts` if it changes.

## Required collections

- `contentItems`
- `contentVersions`
- `moderationQueue`
- `publishingReleases`
- `analyticsEvents`
- `userEntitlements`
- `contentPacks`
- `assetManifests`
- `contentLicenses`
- `exportJobs`
- `consentRecords`
- `provenanceRecords`
- `tierConfigs`
- `roadmapPhases`
- `expansionModules`
- `systemIntegrations`
- `seoPages`

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
- entitlement lookup works
- creator submission is owner-scoped
- admin approval writes provenance
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

Do not mark Firebase adapter work complete until an integration test proves the runtime can create, read, update, and secure content records with the deployed rules or emulator rules.
