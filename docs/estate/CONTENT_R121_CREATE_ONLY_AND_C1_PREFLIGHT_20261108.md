# ONE URAI GENESIS — R121 Content creator POST create-only and current-authority preflight

**Checkpoint:** 2026-11-08 US Central / 2026-11-09 UTC. **DRAFT — NO-GO / HOLD.**
**Parent source:** Content [PR #116](https://github.com/LifeLoggerAI/urai-content/pull/116), exact commit `0431885638c1d5e9b5611fdce4e15fbe3bc9b9bf`. New isolated branch `fix/content-creator-create-only-20261108`. Neither original engineering PR nor production was modified.

## Specific newly confirmed issue, not inventory repetition

The creator POST accepted a caller-supplied submission `id`, then directly called the Admin SDK repository `upsertCreatorSubmission`, which used `doc(id).set(..., { merge:true })`. Server-side Firebase Admin bypasses user Firestore Rules. A chosen existing `id` could therefore replace or merge an existing owner's creator submission, despite admission checking only that the new body creatorId matched the requesting actor. A denial of the final HTTP response would not undo persisted data.

The route previously completed the entire persistence operation before rechecking current Auth and canonical Privacy C1, leaving a predictable exposure window after parsing/body preparation.

## Isolated source repair

1. New `src/backend/creatorSubmissionConflict.ts`: generic error `CreatorSubmissionConflictError` with owner-agnostic text.
2. `ContentRepository.createCreatorSubmission(item)` distinct from existing trusted `upsertCreatorSubmission`; the latter is preserved for other internal/test callers.
3. Firestore adapter `createCreatorSubmission`: `db.runTransaction` reads exact document at the chosen ID and fails on any existing document; commits a new submission only after a missing-record read. Duplicate writes cannot silently overwrite the previous owner. This is a source-level transaction implementation until real emulator test.
4. In-memory nonproduction adapter: parse/validate and reject existing IDs before synchronous insertion.
5. Creator POST: calls `recheckRequestSession` / `canCreateCreatorSubmission` immediately **before** persistence and still rechecks after; invokes `createCreatorSubmission` instead of upsert, maps only the typed conflict to an opaque `409 {error:'submission_id_unavailable'}`, without returning conflicting owner information. Unknown errors continue to propagate.
6. Existing route test spy/mocks updated for the new method. Added four API/withdrawal/preview cases and Firestore fake concurrency/collision coverage; prior moderation helper test assertion corrected to distinguish nonmonotonic replay from a genuinely duplicate receipt.

## Executed evidence: separate from full-project acceptance

- `src/backend/creatorSubmissionConflict.ts`: locally computed `git hash-object` **2555cba3fac02471e149bb6327cd5adddf7d55f2** equals GitHub blob. `tsc --strict --noEmit --target es2022 --module nodenext --moduleResolution nodenext` **PASS**. Two native Node 22.16.0 isolated tests **2/2 PASS**; TAP log SHA-256 `127d4ca1b0bd6415c29fa234a8b787321b9c6568e12b8cc6a816ca1df98527ca`.
- Actual committed `apps/web/src/app/api/creator/submissions/route.ts` copied exactly to isolated harness; `git hash-object` **867ee6d15e13c1b7e9c7d4108bff69f898597864** equals GitHub blob. With synthetic stubs of `next/server`, Zod, Auth, repository and C1 evaluation, **7/7 Node 22.16.0 native route tests PASS**. Log SHA-256 `57c887d065621759a072a92eba06057df6a6801c1b0237016fddce5eb3911607`. Cases include owner create, same ID retry, foreign owner's existing ID, withdrawal before write, withdrawal after a committed write, malformed request, and foreign actor.
- GitHub content readback **11/11 structural wiring checks** passed, covering prewrite/postwrite ordering, repository contract, Firestore transaction existence check, in-memory ID denial and test files.
- The local evidence bundle contains exact copies, mocks, tests, logs and reproduction instructions. No live users, credentials, provider calls or paid services.
- Complete repo checkout, root/web npm install, Vitest, full Next build and Java21 Firebase emulator **not run** because direct local GitHub/npm DNS access remains unavailable.

## Critical non-claims / remaining P0

**This patch DOES NOT make consent withdrawal atomic with Firestore commits.** A native test intentionally demonstrates that a write can persist, then the recheck can deny output with HTTP 401: that is a post-write disclosure guard, not a rollback. C1/C7 decisions originate outside this Firestore transaction, and a fully correct cross-service current-authorization fence has not been designed/provisioned/tested. The new prewrite recheck narrows but does not eliminate TOCTOU.

A production-grade solution requires an authoritative commit-time account/consent epoch/lease, transactional co-location or appropriately coordinated revocation state across Privacy and Content; prove no write persists after revocation is acknowledged, including retries, stale readers, interrupted requests, service failures and cross-region lag. Do not replace canonical consent with a caller-claimed token/snapshot.

Other unclosed gates: live Firebase effective IAM/Rules, durable duplicate-ID behavior under real concurrent Firestore transactions, owner/nonowner and admin authority acceptance, PR #116 moderator audit atomicity, signed publishing issuer, native devices, localized public/private catalog semantics, Content→Studio/Jobs/Storytime/Spatial Replay→deletion acknowledgments, Vercel preview READY, and independent approval.

**NO merge, no provider activation, no public posting, no production GO.**

## R122 — Exact PR #117 hosted CI readback

The first draft PR #117 head `01594612b7caa4e6853993a731091738a2920199` had three completed failed workflow runs:

| Workflow | Run | Jobs / executed steps |
|---|---|---|
| Content Visual Proof | [42547030324](https://github.com/LifeLoggerAI/urai-content/actions/runs/42547030324) | visual-proof FAILED / **0 steps** |
| URAI Production Verify | [42547030386](https://github.com/LifeLoggerAI/urai-content/actions/runs/42547030386) | Build, test, and QA FAILED / **0 steps** |
| ci | [42547030398](https://github.com/LifeLoggerAI/urai-content/actions/runs/42547030398) | validate, web, browser-smoke each FAILED / **0 steps** |

All five jobs report zero recorded steps. **Runner/admission BLOCKED**, not executed application tests; no inference that source compilation, Vitest, emulators or production verification assertions were run. No passing GitHub CI on PR #117.

Additional source-link verification: the creator route's relative `../../../../../../../src/backend/creatorSubmissionConflict.js` maps to the intended root `src/backend/creatorSubmissionConflict.ts` under the local synthetic checkout; TypeScript compile/build acceptance remains unverified.

Execution-grade local artifacts: `/mnt/data/content-r121-native-evidence.zip`, containing original exact-Git-blob-matched creator POST and collision helper, redirection stubs, test harnesses and full TAP logs. The local ZIP is not a hosted CI artifact and does not independently authorize deploy.

**Critical**: the earlier `73/73` and `8/8` source tests belong to separate ancestor scopes. This R121 work adds `7/7` actual route isolated tests plus `2/2` helper tests, not a new merged full-repository `82/82` certification.

## R123 — Firestore path isolation and UUID source IDs (separate scoped native rerun)

Additional hardening on this same draft PR:
- Public optional `id` now requires 1–128 characters and strict `^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$`, refusing path separators, `.`, `..` and arbitrary path text before repository work.
- If no ID is supplied, the server now generates `submission-${randomUUID()}`, replacing the timestamp/title concatenation with an opaque collision-resistant ID.
- Both `createCreatorSubmission` repository implementations invoke the existing `assertDocumentId` as defense-in-depth; the Firestore contract additionally checks document absence in one transaction.
- Added real API fixture cases rejecting path-unsafe IDs and requiring distinct UUIDs, plus a Firestore-fake direct-adapter nested-path denial test. **These committed whole-repo tests remain UNEXECUTED.**

**Executed exact original route bytes:** `apps/web/src/app/api/creator/submissions/route.ts` Git blob `c524757ad5e8fa045a17b096119f5977989a628a`, independently `git hash-object` verified in the isolated harness. Node 22.16.0 with synthetic Next, Zod, Auth/C1 and repository stubs: **9/9 PASS**, TAP log SHA-256 `719b8d4bc215bf3378c2de4d5d7f97064a29fa3d87e828d9bcd79e75745035f0`. Seven earlier route tests plus two new cases (unsafe ID rejection, UUID issuance). `creatorSubmissionConflict.ts` pure helper 2/2 separate PASS and strict TS check unchanged. Reproducible local evidence: `/mnt/data/content-r123-native-evidence.zip`, ZIP SHA-256 `60fef40485682aebdd50d081a93c07eb0c30deb0cd33ffe22e16add9838a6978`.

The 9/9 route results supersede the earlier **7/7 route** count on the newer exact route SHA. All original scope caveats remain: mocks are synthetic, a postwrite 401 can leave committed private data, and no Firebase emulator, canonical C1 transaction fence, full project build, CI or production acceptance was performed. **HOLD**.
