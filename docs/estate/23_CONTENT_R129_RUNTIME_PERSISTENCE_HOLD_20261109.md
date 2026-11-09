# ONE URAI GENESIS — Content R129 runtime-bound private-mutation continuation
**2026-11-09 UTC | REVIEW ONLY | NO-GO / production HOLD**

This is new engineering continuation; **do not repeat the frozen-main byte audit or branch-head census**. The 388/388 frozen-main original-file hash proof and 99/99 visible branch-head tree metadata remain in PR #114. Preserve original Content #96→#115→#116→#117→#118→#119 review stack.

## Exact new candidate
- [Content draft PR #120](https://github.com/LifeLoggerAI/urai-content/pull/120): `fix/content-private-mutation-runtime-boundary-20261109`, starting from #119 exact commit `8b2d85887fdf1a863ad13adb8d7f89e344da44a1`; initial PR head `846e345973655f9f916bc8a80b9edf3918e1d6d3`, updated with CI/test evidence `45865ee12fedc541f76c292a3997892044dd6775` at this handoff. Recheck moving HEAD.
- Security issue: #119 blocked two reviewed private mutations only if `NODE_ENV==='production'`. A deployment mislabeled `test`, `development` or unknown runtime could attempt actual Admin Firestore private writes.
- Source repair: `isPrivateContentMutationHeld(runtime,persistenceMode)` denies unless runtime is explicitly `test` or `development` **AND** `getRuntimePersistenceStatus().mode==='memory'`. Firestore-backed writes always denied, regardless of runtime or env flags. Creator POST and admin moderate POST pass the real runtime persistence mode into the hold just before their write.
- Modified tests `apps/web/tests/private-mutation-hold.test.ts`, `apps/web/tests/private-await-authority.test.ts`, new R128/R129 permanent evidence ledger; all previous original PRs untouched.
- Production remains hard-off; this does **not** implement or prove canonical consent/revocation at commit time. Other Content mutation endpoints were not certified by this scoped change.

## Actual executed native checks
- Exact GitHub blobs match local `git hash-object`: helper `c2ff91b101600bedd8278a93960b180dab776658`, creator route `592cbdabbfeb9aa0d14387083064c626cea8599f`, moderation route `3220edabd13e0292a9ba20f6af8e342bea747302`.
- **33/33 PASS** in one native Node v22.16.0 isolated session, full TAP log SHA256 `92dde7b53694030368ab4d9f0d33d067a0d015601f7b6999e13aae81e1d70ec5`, zero failed/skipped. 22 creator/runtime cases plus 11 moderation cases. Cases include no persistent writes under mislabeled test/dev/staging/production; generic 503; unknown runtime; unauthorized creator/admin; safe IDs/collisions; approved memory-only fixture writes in explicit test/dev; role withdrawal; invalid moderator decision.
- Initial creator fixture 17/22 pass showed old synthetic setup omitted `NODE_ENV=test`; fail-closed code correctly denied it. Corrected the test fixture's runtime declaration only, reran full suite green. Do not suppress this provenance.
- Standalone helper strict TypeScript pass with synthetic declarations, **not** full repository typecheck.
- Local reproducible evidence `/mnt/data/content-r128-private-mutation-boundary-evidence.zip`, SHA256 `9d86a175d9b946952eb7da374d9bdd2def837b345b8ee229f583c90731e7d8e9`.
- Source route tests use synthetic mocked Next, Zod, Firebase mode/Auth and repository. **Not Firebase Admin emulator**, not full Next build, not committed Vitest suite runtime, not deployed Content/Privacy.

## Hosted CI status
Initial #120 head `846e345973655f9f916bc8a80b9edf3918e1d6d3`: [CI #42550256804](https://github.com/LifeLoggerAI/urai-content/actions/runs/42550256804), [Visual #42550256752](https://github.com/LifeLoggerAI/urai-content/actions/runs/42550256752), [Production Verify #42550256769](https://github.com/LifeLoggerAI/urai-content/actions/runs/42550256769). **Five failed jobs, zero recorded steps**. This is runner/admission failure, not failed application assertions. Local `git ls-remote github.com` still DNS-failed. No passing exact-head hosted CI evidence exists.

## P0 cross-service acceptance contract still missing
Privacy main `1163d6f32a123ef9a6638e092a3eee5ec4a3b317` has canonical `setCanonicalConsent`/decision within its own Firestore transaction and asynchronous `consentRevocationOutbox`; Content writes occur in a different database/transaction. The Content C1 callable before/after write does not establish an atomic or linearizable revocation barrier. An HTTP 401 after an already committed write is no rollback.

Do **not** replace this by storing a local boolean or allowing a new environment toggle. A jointly authorized protocol must define: (1) whose authenticated authority controls the commit, (2) monotonic consent/account generation and expiry, (3) how pending revocation *stops new reservations* and waits/drains/invalidates in-flight writes, (4) exactly when revocation can be acknowledged relative to persistent bytes, (5) crash/retry/idempotency and downstream content/deletion receipts, and (6) proof from emulator and provider under delayed commit, concurrent revocation, stale reader, role withdrawal, tombstone and transport failure. A cross-project Firestore transaction is not available implicitly.

## Next execution
1. Run exact PR #120 checkout root/web npm, Next/typecheck/Vitest/Playwright and committed test files on an executing protected runner; capture exact SHA and logs. No bypass.
2. Obtain a real Java21 Firebase emulator with authentic provider behavior and staged Privacy/Content signed principals; design/implement/review canonical commit-time consent fence with Privacy owner and test revocation ordering, duplicate/replay, permanent purge.
3. Trace signed owner-only consent → Content → Studio/Jobs → Storytime/Spatial Replay → revoke/delete → downstream acknowledgement; attest IAM, provider project binding, Vercel READY compiled source SHA, rollback, visual/accessibility, independent review.

**HOLD.** This new branch reduces a production-hard-off configuration escape; it does not certify a functional private Content production pipeline.
