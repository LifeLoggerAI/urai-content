# ONE URAI GENESIS — R125 Content public catalog discoverability continuation

**Checkpoint:** 2026-11-08 Central / 2026-11-09 UTC  
**State:** isolated review candidate; **production HOLD**. This is a source and integration delta, NOT a new inventory.
**Stack base:** Content [draft PR #117](https://github.com/LifeLoggerAI/urai-content/pull/117), frozen reviewed parent `21cf963882623c56d3c081c449194e506227714f`. New branch `fix/content-unlisted-public-index-20261108`. Check current heads on resumption.

## Narrow source-level finding and repair

Before this review, `apps/web/src/server/content/service.ts` returned both `published/public` and `published/unlisted` in `listPublishedCatalogPage`. `apps/web/src/server/content/runtimeCatalog.ts` forwarded the returned records into the unauthenticated `/api/catalog` list. The same runtime mapped `unlisted` to demo metadata. This makes a published unlisted item discoverable without a direct link.

R125 limits anonymous Firestore catalog **enumeration** to `status === 'published' && visibility === 'public'`, while preserving **direct-slug lookup** for `published/unlisted` records only. Published private, drafts, and archived records remain unavailable through the public detail path. The repository's legacy JSON demo fallback remains intentionally public-safe demo content and is not reclassified by this patch.

The existing page-cursor semantics are unchanged: filtered pages can be empty while retaining a `nextCursor` for later pages. This is important for non-public records encountered in bounded Firestore pagination.

## Actual source, tests and immutable evidence

- GitHub exact `apps/web/src/server/content/service.ts` blob **`d30cec3d1ed69587fbfc400b922d573cda57867e`**. Native `git hash-object` on unchanged downloaded/reconstructed source matches this blob exactly. Original byte size 4,422. Original SHA-256 `2f483d971c5d0136092758248edba4183a74a5cfbf65ed87ed1f834b28d57e40`.
- Added a focused `apps/web/tests/runtime-content-service.test.ts` regression for a mix of published/public, published/unlisted, published/private, and draft; checks catalog excludes private/unlisted bodies but a known published unlisted slug remains readable.
- Updated `apps/web/tests/runtime-catalog-firestore.test.ts` to model the now-public-only anonymous catalog results while retaining published unlisted direct-link fixture behavior.
- **Native isolated execution on exact service source:** Node 22.16.0, TypeScript 5.8.3 transpilation, in-process synthetic repository and module stubs; **8/8 tests PASS, zero fail/skip**, including public-only list, unlisted direct lookup, private/draft/archived rejection, canonical/legacy slug conflict, no-results, default public search, and pagination cursor preservation.
- Full TAP log SHA-256 **`0cf1413ab8e2229421c8f305b133118dca5529745ff9bd4dd7664a63de1f8dc3`**. Local ZIP reproducible evidence `/mnt/data/content-r125-native-public-catalog.zip`, SHA256 `8b35fba313db65a74d9681fd6cf7c6afa42b7ebe8f1d678e9746c098e77c4abb`, containing exact source, tests, logs, and README. No user records, external HTTP, provider calls or deployment.
- **NOT EXECUTED**: full 2 changed Vitest files in an installed repository; actual Next API handlers, Firebase Admin provider emulator, build, physical devices, deployment.

## Privacy revocation reconciliation — independent P0 still outstanding

Cross-read at Privacy main `1163d6f32a123ef9a6638e092a3eee5ec4a3b317`, `functions/src/consent-api.ts`, `functions/src/consent-decision.ts`, and `docs/CONSENT_DECISION_SERVICE.md`:
- Canonical Privacy stores `consentRecords` and `privacyDeletionTombstones`, and evaluates current C1 `memory.storage` inside its **own** Firestore transaction. It creates a separate `dataAccessEvents` audit receipt; the consumer gets an allow/deny decision and event ID.
- Current Content [PR #117](https://github.com/LifeLoggerAI/urai-content/pull/117) evaluates Auth/C1 before and after the Content write, but its Content transaction does **not** read a shared authoritative revocation epoch/lease within the same consistency boundary. Privacy's consumer rule forbids caching an allow but still does not, on its own, prevent in-flight commits from an old allow.
- Privacy's documentation explicitly says its consent decision service is `IMPLEMENTED BUT NOT DEPLOYED`; this is source documentation, not an independent provider live readback.
- Do not clone canonical consent authority into Content or claim a fresh callable response supplies serializable cross-project commit ordering. Propose a jointly owned, provider-realistic barrier with Privacy/Content steward and verify revocation-acknowledgement ordering, replay, foreign UID, role and delayed creator write failures. Owner must approve the semantics before implementation.

## Release acceptance backlog

1. Preserve source conflict resolution stack #96→#115→#116→#117 and review this new public discoverability candidate independently; no production promotion.
2. Run exact current candidate npm/node checks and new Vitest tests; source-only fixture checks are not production Next or Firestore proof.
3. Implement/verify canonical Privacy↔Content commit-time C1/Auth generation barrier and full Firebase emulator role/revoke/retry/negative matrix. Continue Content integration through Studio/Jobs, Storytime, protected Spatial Replay, deletion and durable downstream purge.
4. Establish real effective Firebase IAM/Rules and protected Vercel preview with exact compiled SHA and rollback proof, then independent visual/accessibility review.

**Production NO-GO/HOLD.** No existing worker branch, CI protection, provider, user record or billing changed.
