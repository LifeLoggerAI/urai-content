# ONE URAI GENESIS — Content R120 next-worker continuation: moderated content transaction
**This is a continuation of, not a repetition of, the fully inventoried Content audit.**

## Independent source lanes and checkpoints

- Main frozen source `988ca4f7f38b1ce86e4d3f426361b5866fd23e0d`: prior 388/388 original-file SHA-256 and 99 branch-head Git tree inventory already complete for their original scopes.
- Content convergence [draft PR #115](https://github.com/LifeLoggerAI/urai-content/pull/115): preserved Privacy controller #96 and publisher stack #110→#112, with 73/73 earlier native isolated source tests. Do not restart this inventory/reconciliation.
- **New draft [Content PR #116](https://github.com/LifeLoggerAI/urai-content/pull/116)**: branch `fix/content-moderation-atomic-20261108`, stacked on exact PR #115 at `01ee48f187af51b625e43a75dc65260d56d7ac05`. Latest observed PR #116 commit after CI evidence update: `0431885638c1d5e9b5611fdce4e15fbe3bc9b9bf`; recheck moving head.

## What this worker repaired, source-only

The creator submission moderation route previously committed the new status then wrote the audit receipt separately. PR #116 introduces `ContentRepository.moderateCreatorSubmission(next,audit,expectedUpdatedAt)`; the Firestore implementation reads the current submission and audit doc within one `db.runTransaction`, validates identity, owner, exact previous revision, strictly monotonic timestamp, same reviewer/decision and absent duplicate receipt, and stages both writes in that transaction. The nonproduction in-memory adapter performs corresponding synchronous validation and state change. The route uses a single repository call, a UUID audit ID, and preserves existing response-level role rechecks.

Files changed within the review branch: `src/backend/creatorModerationIntegrity.ts`, `src/backend/types.ts`, `src/backend/inMemoryRepository.ts`, `apps/web/src/server/firebase/contentRepository.ts`, `apps/web/src/app/api/admin/creator-submissions/[id]/moderate/route.ts`, two existing web tests, two new root tests, and `docs/estate/CONTENT_R119_ATOMIC_MODERATION_20261108.md`. Source readback established 11 wiring assertions; no other worker PR changed.

## Current verification

- **8/8 native Node 22.16.0 pure-helper regression checks PASSED**, plus a standalone strict TypeScript compilation PASS. Exact helper Git blob `8a440b7534ae6fd9a2dea62740f36f2796a15495`; TAP SHA-256 `f9b81cb54807d32e41d49343bb46b740e830953e8c34589b05a9c774dc20c120`.
- **New 13 committed repository test cases (6 pure Vitest, 3 in-memory, 4 FakeFirestore) are NOT RUN** under full repository dependencies. The FakeFirestore mock does not prove provider-level commit interruption atomicity; real Java21 emulator acceptance remains required.
- Exact initial PR #116 head `18eaed84dcca91c3d73a24e09e63f7f0b85e7743` Actions: [visual 42543301738](https://github.com/LifeLoggerAI/urai-content/actions/runs/42543301738), [CI 42543301535](https://github.com/LifeLoggerAI/urai-content/actions/runs/42543301535), [production verify 42543301660](https://github.com/LifeLoggerAI/urai-content/actions/runs/42543301660) all FAILED **with five total jobs, zero recorded steps**. This is runner admission failure, **not application test failure**.
- Local checkout and npm install blocked by DNS resolution for GitHub/npm; no native full-project, protected Firebase/Auth, live media, browser/device or provider deployment proof.

## Open high-severity gates

1. **Revocation during in-flight creator writes is NOT fixed by atomic moderation.** The creator POST still writes before the final current-account/C1 check. A transaction-compatible account/consent generation fence needs a designed and verified cross-service authority source before claiming persisted-write denial or rollback.
2. Moderation route rechecks admin current role before starting its transaction and after it, **but not at the commit's authoritative source**. Verify role-withdrawal and transaction lifecycle in real emulator with current epoch/authority, retry and idempotency. Do not call response denial a write rollback.
3. Need exact full candidate checkout, root/web checks, 13 repository tests, Java21 Rules/emulator tests, real owner/nonowner and C1/C7 negative traces, Content→Studio/Jobs/Storytime/Spatial Replay→delete/acknowledged purge.
4. Publisher issuer IAM, rights/asset provenance, approved protected Vercel READY/source parity, rollback and independent sign-off remain outside this repair.

See the [PR #116 permanent detailed evidence](https://github.com/LifeLoggerAI/urai-content/blob/fix/content-moderation-atomic-20261108/docs/estate/CONTENT_R119_ATOMIC_MODERATION_20261108.md). **All source reviews are DRAFT; production remains NO-GO/HOLD.**
