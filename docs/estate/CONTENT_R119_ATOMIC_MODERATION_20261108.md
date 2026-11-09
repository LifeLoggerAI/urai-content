# ONE URAI GENESIS — Content R119 moderator state/audit transaction repair
**Checkpoint:** 2026-11-08 / 2026-11-09 UTC. **Status:** DRAFT / SOURCE CANDIDATE / NO-GO / HOLD.
**Scope:** targeted repair for the Content PR #115 convergence branch, without modifying that parent branch or PR #96/#110–#112.

## Source and rationale
- Parent exact convergence source: `01ee48f187af51b625e43a75dc65260d56d7ac05` ([Content PR #115](https://github.com/LifeLoggerAI/urai-content/pull/115)).
- New isolated branch: `fix/content-moderation-atomic-20261108`. Recheck current head and base before accepting.
- Original danger: `apps/web/src/app/api/admin/creator-submissions/[id]/moderate/route.ts` first updated `creatorSubmissions` and separately appended `moderationQueue`. A second-operation exception could leave a moderator decision without its audit receipt.
- The existing `private-await-authority.test.ts` explicitly asserted both mock calls occurred even when current role withdrawal made the final response 401. **A denied response is not transactional persistence rollback.**

## Proposed nonproduction-safe, additive source repair
- `src/backend/creatorModerationIntegrity.ts`: central pure invariant on same submission/owner, expected preceding `updatedAt`, strictly monotonically increasing update, accepted decision, and identical audit record/status/reviewer/timestamp.
- `src/backend/types.ts`: new `moderateCreatorSubmission(item,audit,expectedUpdatedAt)` repository operation.
- `src/backend/inMemoryRepository.ts`: parses and validates both records and duplicate IDs *before* any mutation, applies both synchronously in the nonproduction fallback.
- `apps/web/src/server/firebase/contentRepository.ts`: `db.runTransaction()` obtains submission and audit snapshots first, rejects absent/stale/mismatched prior records and reused audit IDs, then stages both writes in **one transaction**. The submission write keeps existing `merge:true` semantics.
- `apps/web/src/app/api/admin/creator-submissions/[id]/moderate/route.ts`: replaces sequential `upsertCreatorSubmission` and `logModeration` with the single atomic repository operation, using UUID audit ID and monotonically increasing timestamp. Existing admission and post-await current-role response guards are retained.
- `apps/web/tests/private-await-authority.test.ts`: adjusts the synthetic moderator write mock to represent one combined persistence operation. Creator intake tests are unaffected.
- New `tests/creator-moderation-integrity.test.ts` (6 focused Vitest checks), `tests/creator-moderation-repository.test.ts` (3 in-memory boundary tests), and four Firestore fake-transaction cases added to `apps/web/tests/firestore-content-repository.test.ts`.

## Executed evidence — only the pure original-source module
- Native Node **22.16.0** ran **8/8 passing** isolated `node --experimental-strip-types --test` checks against the identical pure helper source, using only synthetic inputs.
- The updated source's Git blob SHA computed locally with `git hash-object` is `8a440b7534ae6fd9a2dea62740f36f2796a15495`, matching the GitHub committed blob.
- `tsc --strict --noEmit --target es2022 --module nodenext --moduleResolution nodenext` on the standalone pure TypeScript module completed **PASS**.
- Final native TAP receipt SHA-256: `f9b81cb54807d32e41d49343bb46b740e830953e8c34589b05a9c774dc20c120`.
- The original candidate files were re-read from GitHub after committing: **11 structural source assertions passed**, including no sequential moderator route writes, both repository implementations, transaction reads-before-writes, fail-closed revision check and updated test fixtures. This is source inspection, not runtime Firebase emulation.

## Not yet executed or certified
- The new 6 + 3 + 4 committed Vitest/in-memory/FakeFirestore test cases have **NOT** run in the actual repository. The existing `FakeFirestore` test double queues writes and is **not** proof of real Firestore commit atomicity on provider interruption.
- Local environment still cannot DNS-resolve `github.com` or npm registry; full project checkout and dependencies are unavailable. Full root/web build/TypeScript/Vitest/Playwright and Java21 emulator remain BLOCKED rather than PASS.
- Current Canonical Privacy C1/C7 and actual Auth disabled/revoked service authority are **not checked within this Firestore transaction**. A role or consent withdrawal after the last route recheck but before transaction commit is a **separate unresolved P0 race**. Avoid claiming rollback or complete privacy fencing from this patch.
- Live Firebase project mapping, effective IAM/Rules, real approval service identity, asset rights, staging preview, protected cross-system Replay/purge and independent reviewer approval remain unverified.
- Source changes are review-only; no merge, IAM, production provider, billing, release, or private user records were touched.

## Remaining completion gates
1. Obtain complete frozen branch checkout; run root and web builds/tests and the exact new Vitest cases under the target Node/npm versions, capturing logs and source SHA.
2. Execute Java21 Firestore emulator transaction tests with injected audit failure, stale/mismatched owner/role, concurrent writers, retry/idempotency and duplicate receipt attempts; explicitly validate all-or-nothing persistence.
3. Design and prove a **shared transaction-compatible authority generation / revocation fence** for creator writes and moderation. Current C1/C7 callable rechecks alone do not prove that a started write never persists after withdrawal.
4. Verify cross-system signed authority, owner-only private source/replay, deletion and provider purge acknowledgments; independently review issuer and release hold.
5. Do not change production or mark GO until the integrated authority/security tests and protected deployment evidence exist.

**HOLD — partial code repair is not proof the entire end-to-end Content pipeline operates.**
