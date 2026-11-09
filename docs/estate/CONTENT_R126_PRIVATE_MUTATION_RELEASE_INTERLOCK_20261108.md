# ONE URAI GENESIS — Content R126 private creator mutation release interlock

**Checkpoint:** 2026-11-08 Central / 2026-11-09 UTC. **State: draft source-only security hold / PRODUCTION NO-GO.**
**Parent:** exact [Content draft PR #118](https://github.com/LifeLoggerAI/urai-content/pull/118) source `a66a8eaf49dc5726d192b2226f2eb14ddc1c9d8e`. New isolated branch `fix/content-private-mutations-hard-off-20261108`. No existing worker PR modified or merged.

## Cross-service defect and design boundary
Verified Privacy main `1163d6f32a123ef9a6638e092a3eee5ec4a3b317`, specifically `functions/src/consent-api.ts`, `functions/src/consent-decision.ts`, and `functions/src/consent-revocation.ts`:
- Privacy's `setCanonicalConsent` updates canonical `consentRecords` and its audit/events atomically **within Privacy's database**.
- `evaluateCanonicalConsent` reads consent and deletion tombstones then logs a decision event in its own Privacy transaction.
- Revocation outbox and downstream acknowledgement are asynchronous and are **not a Content write-time barrier**.
- Content `apps/web/src/server/privacy/canonicalConsent.ts` forwards a signed-looking/validated callable result to request admission, but the creator POST can still commit after revocation is acknowledged between the prewrite callable and Content's distinct Firestore transaction. A 401 response after write does not undo the stored bytes.
- Current canonical Privacy docs classify the service as `IMPLEMENTED BUT NOT DEPLOYED` at the source checkpoint. Deployment binding, effective IAM, provider and cross-project ordering were not established in this run.

**Correctness invariant needed for future release:** no new private Content creator write may persist after canonical Privacy successfully acknowledges revocation, except strictly ordered earlier commits with downstream purge/compensation receipts. A boolean allow, cached token, independent callable check, background outbox, or extra pre/post request check alone is insufficient. A future reviewed protocol must specify cross-project sequencing, authenticated account and consumer identity, authority generation/epoch, reservation/fence expiry, aborts, crash recovery, eventual side effects and durable purge; it must be independently tested under emulator/provider conditions. Do not fabricate this authority inside Content.

## New source changes
- `apps/web/src/server/privacy/privateMutationHold.ts` exports a conservative `isPrivateContentMutationHeld` that returns true for production and has no environment-variable override. This is an intentionally hard-off, review-only release interlock—not the future atomicity fix.
- `apps/web/src/app/api/creator/submissions/route.ts` checks the hold immediately before `createCreatorSubmission`; production responds `503 {"error":"private_mutation_fence_unavailable"}` without invoking repository persistence. The existing prior current Auth/C1 check and post-write response check remain; preview/test fixture writes continue.
- `apps/web/src/app/api/admin/creator-submissions/[id]/moderate/route.ts` performs the same hold immediately before `moderateCreatorSubmission`, preserving review-only source read and existing auth/admission checks. This blocks the reviewed private moderation mutation path; it is not a claim that every possible application mutation endpoint is now blocked.
- Updated `apps/web/tests/private-await-authority.test.ts` to assert 503 and zero writes for production creator/moderator mutations while preserving earlier denial-after-read checks.
- Updated `apps/web/tests/current-authority-routes.test.ts` to retain current admin queue read but expect a production creator write 503 and zero writes.
- Added `apps/web/tests/private-mutation-hold.test.ts` with four pure gate regressions, including ineffective opt-in environment overrides.

## Native execution and source integrity
- Original fetched creator POST Git blob `e7489597f357c2d9a4b77b4978fe6cc521633e25` and original hold helper Git blob `5de8d4d3f6959b797044faf293cae0882028bf65`. Both were reconstituted from the actual parent exact bytes and minimal recorded diff; local `git hash-object` matched GitHub fetched new blobs.
- **17/17 PASS** in one Node 22.16.0 isolated execution: the nine previous actual creator POST source tests on synthetic Zod/Auth/repository inputs, plus eight new hold-path/source tests. Full TAP log SHA-256 `9d35f258f037bfbbaa5202b942f660ec728de181e68654466d1efcc1e9ee26ad`.
- Standalone hold helper `tsc --strict --noEmit` PASS using explicitly synthetic type-only declarations for `server-only` and `process` because the container lacks `@types/node`. This is NOT a full repository TypeScript pass.
- Separate **6/6 PASS architectural ordering model tests** demonstrate a stale-allow counterexample for disconnected Privacy/Content writes, why an asynchronous outbox is too late as a synchronous guard, and how a *hypothetical same-authority epoch compare* would reject the stale write. These are **MODEL_ONLY**; they are NOT executed Firebase/Privacy integration tests. TAP SHA-256 `b4a0bc01d9f606686327ea29adacd7e3efef36f5c2ac7d040c15afb6f472274c`.
- Direct GitHub source readback verified both changed creator and moderation routes place the hold before the transaction call. The **moderation route was not separately executed** by this native harness.
- Reproducible local ZIP `/mnt/data/content-r126-private-mutation-hold-evidence.zip` (SHA-256 `fd5d89f01fe80da362d76e6d4ee5f8452557b28cc539aa0af172e3c3db2ac7fd`), original source, tests, mocks, logs, README. No private user records, billable providers, live Firebase, deployment or secrets.

## Current missing release acceptance (DO NOT LOWER)
1. Run current exact candidate full npm root/web, Next/TS/Vitest, Playwright, Java21 Firebase Rules/emulator and physical device accessibility when CI/checkout works; committed application Vitest tests still need execution.
2. Obtain independent Privacy/Content approval of a *real cross-project revocation/commit authority protocol*. A transaction that reads an isolated Content copy of consent is insufficient without proved synchronization and revocation acknowledgement order; no environment toggle may bypass the hard-off.
3. With approved synthetic staging principals, test a revocation acknowledged while Content write is delayed, failed/retried, and resumed; verify no unacknowledged data remains plus durable downstream purge and idempotent receipts. Test role withdrawal, missing/expired C1, tombstone, provider outage and forged/stale authority. Real Firebase effective IAM and project IDs must be read back.
4. Finish Content→Studio/Jobs→Storytime→Spatial Replay and delete acknowledgements, signed issuer approval, protected READY Vercel source/rollback and independent GO.
5. Existing stacked PR #96→#115→#116→#117→#118 must remain individually reviewable; do not activate or merge merely because the hard-off suite passes.

**HOLD:** A working safety interlock is not a functioning end-to-end Content pipeline or a deployed canonical Privacy revocation fence.
