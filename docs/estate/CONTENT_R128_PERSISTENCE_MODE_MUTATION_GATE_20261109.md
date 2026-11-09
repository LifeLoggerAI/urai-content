# ONE URAI GENESIS — Content R128 persistence-aware private mutation HOLD
**Checkpoint:** 2026-11-09 UTC. **Status:** draft, no merge, NO-GO/HOLD.

## Source lineage and actual finding
- Parent [Content draft PR #119](https://github.com/LifeLoggerAI/urai-content/pull/119) HEAD `8b2d85887fdf1a863ad13adb8d7f89e344da44a1`, stacked on #118 → #117 → #116 → #115 → #96; all source PRs remain review-only.
- Previous safety gate `isPrivateContentMutationHeld` returned `runtime === 'production'`. This could let real Firestore-backed private Content writes proceed when an app or preview was mislabeled `NODE_ENV=test` or `development`, or when runtime value was absent/unexpected.
- New helper `apps/web/src/server/privacy/privateMutationHold.ts`: only explicitly `test` or `development` **AND** actual `memory` persistence mode can operate with local synthetic fixtures; production, Firestore, unknown/missing runtime or missing persistence identity all fail closed. No user, request or environment override can turn on real Firestore persistence.
- Creator POST and admin moderation POST pass `getRuntimePersistenceStatus().mode` into the hold immediately before their persistence method; the previous Auth and other checks remain. This is an additional hard-off, not a canonical Privacy commit-time consent fence.
- Updated `apps/web/tests/private-mutation-hold.test.ts` with a runtime/mode negative matrix and `apps/web/tests/private-await-authority.test.ts` with dev/test runtime plus real Firestore-denial cases. The existing `current-authority-routes.test.ts` production denial remains unchanged and will still fail closed when its mock omits mode.
- This patch does **not** claim every Content mutation path has been reviewed; it closes the two specific reviewed private creator/submission moderation writes.

## Actual execution and reproducibility
- Container toolchain: Node **22.16.0**, npm **10.9.2**, Git **2.47.3**. Direct `git ls-remote` still failed resolving github.com. Full repo checkout, npm, Next/Vitest and Java21 Firebase emulator were **not** run.
- The actual new `apps/web/src/server/privacy/privateMutationHold.ts` independently computed local Git blob **`c2ff91b101600bedd8278a93960b180dab776658`**, matching GitHub.
- The actual new creator POST source independently computed local Git blob **`592cbdabbfeb9aa0d14387083064c626cea8599f`**, matching GitHub.
- Native `node --experimental-strip-types --experimental-loader ./mocks/loader.mjs --test ./tests/creator-route.test.mjs ./tests/runtime-boundary.test.mjs`: **22/22 PASS** in synthetic Auth/Zod/Next/persistence harness. Full TAP log SHA-256 **`13091f0f752677a669780a4251118879f7cf9dc8c8f586f7fee0bd4b17849fbc`**. Covers duplicate caller ID, foreign overwrite denial, prewrite revoked role, postwrite stale authorization counterexample in local fixture, unsafe ID and UUID, production/Firestore/unknown runtime denial and explicit memory-only test/dev allowance.
- Initial dry run had 17/22 PASS because the old fixture runner left `NODE_ENV` unset; the new fail-closed gate correctly returned 503. Test setup alone was corrected to declare `NODE_ENV='test'`; source code was unchanged. Final completed rerun was **22/22 PASS**.
- Standalone helper `tsc --strict --noEmit --skipLibCheck --target es2022 --module nodenext --moduleResolution nodenext` PASS with synthetic `server-only`/Node type declarations (no full-project typecheck).
- Existing root/web Vitest cases were updated but **not run**. Moderation route's new guard was independently source-read back before its `moderateCreatorSubmission` call; it was **not separately executed** through a native moderation handler harness.
- The local reproducible execution workspace is `/mnt/data/content-r128`; no network, Firebase credentials, private user data, deployment or paid service calls were made.

## Remaining P0, unchanged by this patch
- Privacy main `1163d6f32a123ef9a6638e092a3eee5ec4a3b317` has canonical consent decisions in its Privacy Firestore transaction, and async revocation outbox. Content's separate creator write transaction still has no authoritative commit-time C1 generation/revocation barrier. A 401 response after persistence does not roll back. The hard-off must remain until independently approved cross-project ordering, recovery/purge and negative authenticated proof exist.
- Real Firebase Admin emulator concurrent writes, project IAM and Rules, exact-head full npm/Next/TypeScript/Vitest/Playwright, protected Vercel READY, full protected Consent → Studio/Jobs → Storytime → Spatial Replay → delete/ack, and independent signoff remain outstanding.
- CI admission may continue to fail with zero-step jobs; collect exact run/job IDs and distinguish them from application assertions.
- Preserve original worker PRs and central knowledge registry. No forced merge, no test bypass, no production GO.

**HOLD** — production/private pipeline functionality is not certified by a correct hard-off.

## R129 — exact moderation route native executable and combined rerun

The R128 file above originally recorded 22/22 native tests on creator POST + hold only. **New evidence extends to moderation route**; it does not erase the 22/22 prior receipt.

- `apps/web/src/app/api/admin/creator-submissions/[id]/moderate/route.ts` exact GitHub blob `3220edabd13e0292a9ba20f6af8e342bea747302` was locally reconstructed with byte-identical `git hash-object`. No module source was edited for the harness.
- Native Node 22.16.0, same synthetic Auth, Zod, Firestore mode and in-memory test repository: **11/11 moderation route tests PASS**. Cases: Firestore denies on production, test, development, staging and empty runtime; only explicit in-memory test/development can commit fixture state; production memory still denied; non-admin denied; withdrawn role before mutation denied; invalid decision denied. Native moderation TAP SHA256 `36b33ca5f023667759dae1404be0c35c9b05ff99f60f5e07d199baa181b91959`.
- **Combined single invocation: 33/33 PASS, 0 fail/skip/cancel** across creator route, runtime-boundary, and moderation route. Exact commands and source copies in local evidence ZIP `/mnt/data/content-r128-private-mutation-boundary-evidence.zip`; combined TAP SHA256 `92dde7b53694030368ab4d9f0d33d067a0d015601f7b6999e13aae81e1d70ec5`; ZIP SHA256 `9d86a175d9b946952eb7da374d9bdd2def837b345b8ee229f583c90731e7d8e9`.
- The three original source blobs were independently verified: helper `c2ff91b101600bedd8278a93960b180dab776658`, creator route `592cbdabbfeb9aa0d14387083064c626cea8599f`, moderation route `3220edabd13e0292a9ba20f6af8e342bea747302`.
- **NOT full Firebase/Next/Vitest integration:** all imported authority/provider/persistence modules are synthetic stubs, and the Firestore Admin SDK real transaction was not exercised. Only the complete original route control flow and hard-off behavior were exercised. No real C1 authority was deployed/verified.

## PR #120 CI admission

Initial draft PR #120 source HEAD `846e345973655f9f916bc8a80b9edf3918e1d6d3`:
- [CI run 42550256804](https://github.com/LifeLoggerAI/urai-content/actions/runs/42550256804): browser-smoke, web, validate, each FAILED, **zero recorded steps**.
- [Content Visual Proof 42550256752](https://github.com/LifeLoggerAI/urai-content/actions/runs/42550256752): visual-proof FAILED, **zero recorded steps**.
- [URAI Production Verify 42550256769](https://github.com/LifeLoggerAI/urai-content/actions/runs/42550256769): Build/test/QA FAILED, **zero recorded steps**.

These are pre-step runner/admission BLOCKED results. They do not mean the application tests executed or failed; there is no protected CI success for this branch. Documentation update moves the branch HEAD; re-read before further tests.

**Priority after this improvement:** actual canonical Privacy C1/Auth revocation barrier with durable acknowledgement sequencing, cross-project IAM/project identity, Java21 Firebase emulator and exact-head full Next/Vitest checks. Production remains NO-GO/HOLD.
