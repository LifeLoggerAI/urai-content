# ONE URAI GENESIS — Content R130: direct Admin seed writer safety reconciliation

**Checkpoint:** 2026-11-09 UTC (US Central prior evening). **Review-only / production NO-GO and HOLD.**

## Exact source lineage — continuation, not inventory
- Source parent [Content draft PR #120](https://github.com/LifeLoggerAI/urai-content/pull/120), exact head `45865ee12fedc541f76c292a3997892044dd6775`. Existing #96 → #115 → #116 → #117 → #118 → #119 → #120 engineering PRs remain separate and unchanged.
- This branch `fix/content-canonical-seed-write-fence-20261109` is an isolated R130 candidate. Re-read current HEAD before any merge or test. Frozen 388-file main byte audit and 99 branch-head census were completed previously; do not repeat.

## New high-severity source bypass found

Prior R128–R129 safety interlock blocked reviewed creator submission and moderation POST writes when backed by Firestore. However `apps/web/src/app/api/admin/seed/canonical-content/route.ts` directly called `createFirestoreContentRepository(getFirebaseAdminDb())` and `seedCanonicalContent` without that persistence-mode hold. Its seed-token authorization path could also authorize this direct Admin SDK writer.

`seedCanonicalContent` currently uses `saveContentRevision` on JSON-defined item IDs. The Firestore revision implementation can persist the current item and revision under that ID, which means a collision with unrelated creator/user-owned content could cause unintended replacement. **Source-level risk, not a verified live exploit.**

## Non-conflicting source repair

1. The direct Admin seed route now checks `isPrivateContentMutationHeld(process.env.NODE_ENV, 'firestore')` **after authentication and dry-run, before obtaining Admin DB or constructing the repository**. It returns generic `503 private_mutation_fence_unavailable` for every durable seed attempt regardless of environment. The authorized dry-run path remains readable and nonwriting, subject to Firebase configuration.
2. A pure helper `src/backend/canonicalSeedIntegrity.ts` checks that a proposed seeded item identifies `createdBy='canonical-json'` with a valid ID/slug/source and that any existing item has the same ID, creator authority, normalized slug and source label. A differing existing owner/identity is denied.
3. `apps/web/src/server/content/canonicalSeed.ts` uses the helper after a `getContent(id)` lookup and before `saveContentRevision`. This is **only a best-effort local-fixture preflight**: without transaction co-location it is vulnerable to a concurrent write. Durable Admin seeding is therefore kept **disabled** until a real approved transactional provenance/rights check can be implemented and tested.
4. Added `apps/web/tests/canonical-seed-write-fence.test.ts` for dry-run, authentication, Firebase configuration and all runtime labels; extended `apps/web/tests/canonical-seed.test.ts` for user-owned/source/slug collision and identical canonical reseeding. All newly committed Vitest cases require an installed full repository to execute.

## Actual native execution and source-byte evidence

- Node **v22.16.0**; standalone `tsc --strict --noEmit --target es2022 --module nodenext --moduleResolution nodenext` for helper **PASS**.
- Original GitHub blob IDs were independently reproduced with `git hash-object` from byte-identical source:
  - `src/backend/canonicalSeedIntegrity.ts` = `803865a57a7db144dcc2237c75fd05f5659b6fad`
  - `apps/web/src/server/content/canonicalSeed.ts` = `6129a66f6a2ace86a94afb914132b13d9386dd55`
  - `apps/web/src/app/api/admin/seed/canonical-content/route.ts` = `cf106282e2cb95ba9d6a116900f2c6dae6608efd`
  - `apps/web/src/server/privacy/privateMutationHold.ts` = `c2ff91b101600bedd8278a93960b180dab776658`
- **22/22 PASS**, zero fail/skip/cancel, in a single isolated native Node `--experimental-strip-types --experimental-loader` run. Synthetic Auth, Seed, Admin DB, Next response, catalog fixture and in-memory repository stubs. Exercises: all five named environment modes and unknown mode, missing Admin config, unauthorized auth, seed-token guard, dry-run, invalid canonical owner/source/slug, first seed, matching re-seed.
- Full TAP log SHA-256 `38de083f60aa32e0963b215ca543c02538b9e76a5549dcdd420ec279d46c08cf`.
- Local reproducible ZIP `/mnt/data/content-r130-native-seed-guard-evidence.zip`, SHA-256 `5630811f87a5e40b89362dd4cde741e3936342acbde889f7173db3e35bebebab`.
- These are **native isolated actual-source tests**, not complete Next/Vitest/Firebase/Privacy provider integration. No private records, secrets, network, billable infrastructure, or production deployment used.

## Important source handoff correction
The first attempt to create the canonical helper returned an inconsistent remote write receipt and the file was missing on GitHub tree readback. This was caught **before** certification; helper was recreated and fetched from the exact branch, then its Git SHA matched the local tested file. Do not treat tool mutation success as source persistence proof without a subsequent exact-head readback.

## Remaining release gates

1. Full clean candidate checkout at exact R130 head; run root/web TypeScript/Next/Vitest/Playwright, including the newly committed route and canonical-seed tests. Existing GitHub Actions admission has repeatedly failed at zero steps; do not characterize this as failed application assertions.
2. Refactor canonical seed collision/provenance check into one Firestore transaction **if** durable seed approval is explicitly granted. Keep the direct Admin seed route HOLD until then, including token-based automation callers.
3. Independently design/prove canonical Privacy C1/Auth commit-time revocation and role fence for owner-private creator data; the asynchronous revocation outbox and pre/post callable checks cannot prevent all late commits.
4. Real Firebase effective IAM/Rules/project identity, protected signed Content → Studio/Jobs → Storytime/Spatial Replay → revoke/delete/purge acknowledgment, Vercel READY compiled source parity/rollback and independent review.

**NO-GO/HOLD.** This repair closes one source-level Admin SDK write bypass by refusing writes; it does not certify a functioning Content publishing or private-memory pipeline.
