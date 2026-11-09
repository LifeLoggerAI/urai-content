# ONE URAI GENESIS — R122 Content continuation: create-only creator write, consent-race scope

**Continuation, not inventory.** Read [audit PR #114](https://github.com/LifeLoggerAI/urai-content/pull/114) and its R120 report before this delta. No repeat of 388-file main hashes or 99 branch-head trees.

## Exact worker PR chain
- Content [#96](https://github.com/LifeLoggerAI/urai-content/pull/96): main Privacy controller.
- [#115](https://github.com/LifeLoggerAI/urai-content/pull/115): combines #96 with publisher #110→#112, 73/73 separate native source tests.
- [#116](https://github.com/LifeLoggerAI/urai-content/pull/116): atomic moderation and audit receipt on a distinct draft branch, 8/8 separate pure native tests. Commit base for next worker: `0431885638c1d5e9b5611fdce4e15fbe3bc9b9bf`.
- **New draft [Content #117](https://github.com/LifeLoggerAI/urai-content/pull/117)**, branch `fix/content-creator-create-only-20261108`, stacked on #116. First content PR head `01594612b7caa4e6853993a731091738a2920199`; R122 documentation advances the branch (recheck current head before work).

## Security change, why
The creator POST accepted caller-supplied `id` and used Admin SDK `doc(id).set(...,{merge:true})`. Its prior authorization validated the submitted `creatorId` but did not compare that chosen document ID against a preexisting owner's record. Admin SDK bypasses user Firestore Rules; owner ID collision could have overwritten or merged someone else's content.

Draft #117 adds a separate `ContentRepository.createCreatorSubmission`, transactionally asserting document absence before write, while preserving trusted internal upsert for other callers. The route adds another current Auth/Privacy C1 check immediately before create-only persistence, keeps the postwrite recheck, maps typed conflict to generic `409 submission_id_unavailable` without owner disclosure, and retains unknown error propagation.

Local preview adapter refuses duplicate IDs; route mocks, API tests, Firestore fake collision/concurrency tests and preview tests updated. An inherited moderation test assertion was corrected to distinguish nonmonotonic timestamp replay from a genuine duplicate receipt.

## Actual executed checks
- Exact `src/backend/creatorSubmissionConflict.ts` Git blob `2555cba3fac02471e149bb6327cd5adddf7d55f2`, strict TypeScript PASS, **2/2** isolated Node tests PASS; TAP SHA256 `127d4ca1b0bd6415c29fa234a8b787321b9c6568e12b8cc6a816ca1df98527ca`.
- Exact original `apps/web/src/app/api/creator/submissions/route.ts` Git blob `867ee6d15e13c1b7e9c7d4108bff69f898597864`, **7/7** isolated Node route-flow tests PASS, with synthetic mocked Auth/C1/Zod/Next/persistence; TAP SHA256 `57c887d065621759a072a92eba06057df6a6801c1b0237016fddce5eb3911607`.
- Eleven source-wiring checks passed from GitHub connector file readback. There was no full repository checkout or native provider Firestore SDK.
- **An intentionally negative test showed persistence may succeed and then the HTTP response deny with 401 after withdrawal.** This is evidence that a postwrite Auth check is not a rollback.

## GitHub CI and current blocker
At PR #117 head `01594612...`: [Visual #42547030324](https://github.com/LifeLoggerAI/urai-content/actions/runs/42547030324), [Production Verify #42547030386](https://github.com/LifeLoggerAI/urai-content/actions/runs/42547030386), [CI #42547030398](https://github.com/LifeLoggerAI/urai-content/actions/runs/42547030398) all failed with five total jobs **zero executed steps**. Pre-step runner/admission failure, not failing application assertions. Local GitHub/npm DNS resolution also unavailable.

## P0 remaining after this patch
1. **True commit-time revocation/consent fence** for Content creator writes: current C1/role checks occur before and after, but do NOT join a Content Firestore transaction with Privacy's canonical decision. Work must design an authoritative epoch/lease with provable revocation acknowledgements and fail closed against stale clients. Neither C1 callable response nor a synthetic fixture is enough.
2. Test duplicate-ID concurrent transactions using real Java21 Firebase emulator, including Admin SDK error mappings, timeout/race/retry and owner-negative outcomes. The local fake serializes and cannot certify actual provider semantics.
3. Re-run exact PR #117 root/web npm/Next/Vitest/Playwright/Rules acceptance when GitHub Actions/checkout works. Also execute inherited unrun moderation repository tests.
4. Validate current Firebase projects/Rules/IAM, Content→Privacy→Studio/Jobs/Asset Factory/Storytime→Spatial Replay→revoke/delete and downstream acknowledgments, Vercel READY source identity/rollback and independent review.

**Production HOLD.** No merge, live user data, IAM, provider activation, paid compute, deployment or original PR modification.

## R123 postscript — path isolation, automatic UUIDs and scoped native rerun

The same draft #117 now rejects path-unsafe IDs at the public Zod request boundary, generates `submission-${randomUUID()}` when ID omitted, and invokes the existing canonical `assertDocumentId` inside both create-only repository implementations. Two new API cases and one Firestore direct adapter negative fixture were added, **not executed under full Vitest/emulator**.

Exact updated route Git blob `c524757ad5e8fa045a17b096119f5977989a628a`; independently hash-matched, **9/9** isolated Node route-flow tests PASS (replacing earlier 7/7 on older route blob), TAP SHA-256 `719b8d4bc215bf3378c2de4d5d7f97064a29fa3d87e828d9bcd79e75745035f0`. Standalone conflict helper remained 2/2 PASS. ZIP evidence SHA256 `60fef40485682aebdd50d081a93c07eb0c30deb0cd33ffe22e16add9838a6978`.

**Do not combine with previous source heads as a single full integration certification.** Real emulator, current C1/C7 account consent and commit-time race fence, and full native CI remain missing. **HOLD.**
