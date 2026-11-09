# ONE URAI GENESIS — R130 next-worker source-security continuation
**2026-11-09 UTC | DRAFT, NO-GO / Content production HOLD.**

**Do not repeat inventory.** Prior audit PR #114 already preserves frozen-main 388/388 SHA-256 and 99 branch-head metadata. Current engineering review chain: #96 → #115 → #116 → #117 → #118 → #119 → #120 → **new [draft #121](https://github.com/LifeLoggerAI/urai-content/pull/121)**. All existing branches remain separate and unmerged.

## New source-level bypass and fix
- Parent PR #120 exact source `45865ee12fedc541f76c292a3997892044dd6775`. New branch `fix/content-canonical-seed-write-fence-20261109`, PR #121.
- `apps/web/src/app/api/admin/seed/canonical-content/route.ts` was a direct Firebase Admin writer outside the private creator/moderator persistence-aware HOLD. Admin or configured seed-token credentials could reach `seedCanonicalContent` and `saveContentRevision`. With a colliding canonical JSON ID, it might overwrite another owner/source's record. No live exploit was observed.
- The route now returns generic `503 private_mutation_fence_unavailable` before Admin DB or repository construction on **any** persistent seed attempt in any runtime mode, preserving authenticated dry-run with no writes. The hard-off must stay until real publication, rights, collision, and provider acceptance are approved.
- `src/backend/canonicalSeedIntegrity.ts` and `apps/web/src/server/content/canonicalSeed.ts` additionally deny in-memory seed overwrite if an existing item has different id, createdBy, slug or source. The preflight read then write is **not atomic**. It is ONLY for local fixture integrity, not a replacement for a reviewed transactional Firestore write or Privacy consent fence.
- New/updated `apps/web/tests/canonical-seed-write-fence.test.ts` and `apps/web/tests/canonical-seed.test.ts` cover direct API, dry run, authorization, missing Firebase, ID collisions and safe local canonical reseed. These committed Vitest suites need execution under full repo dependencies.

## Actual independently executed source tests
- Original exact Git blobs verified with local `git hash-object`: seed route `cf106282e2cb95ba9d6a116900f2c6dae6608efd`, seed loop `6129a66f6a2ace86a94afb914132b13d9386dd55`, canonical identity helper `803865a57a7db144dcc2237c75fd05f5659b6fad`, previous hard-off helper `c2ff91b101600bedd8278a93960b180dab776658`.
- **22/22 native Node v22.16.0 isolated tests PASS** (0 failed/skipped) with synthetic Next/Auth/Admin/seed/canonical catalog and in-memory repository. This includes direct route and seed loop execution, not just string inspections. TAP SHA-256 `38de083f60aa32e0963b215ca543c02538b9e76a5549dcdd420ec279d46c08cf`. Standalone canonical helper strict TypeScript PASS.
- Local reproducible evidence ZIP `/mnt/data/content-r130-native-seed-guard-evidence.zip`, SHA-256 `5630811f87a5e40b89362dd4cde741e3936342acbde889f7173db3e35bebebab`.
- **Not executed:** installed full PR #121 native npm/Next/Vitest/Playwright, Firebase Admin emulator and real provider identity, current consent/role authority, production deployment, real user data, signed owner-only downstream Content→Studio/Jobs→Storytime/Spatial Replay→deletion.

## Important tooling integrity note
An initial connector create receipt for the helper did not materialize in the new branch tree. The missing file was caught through exact branch readback, recreated, fetched and Git-blob verified **before** opening PR #121. Treat provider mutation receipts as provisional until exact branch readback succeeds.

## Hosted CI
Initial PR #121 commit `63db1e0783f397362783bf70371dfe4d604119f5`: [Visual #42551562153](https://github.com/LifeLoggerAI/urai-content/actions/runs/42551562153), [CI #42551562164](https://github.com/LifeLoggerAI/urai-content/actions/runs/42551562164), [Production Verify #42551562149](https://github.com/LifeLoggerAI/urai-content/actions/runs/42551562149). At first readback the run summaries said queued, while each of five returned jobs was already completed failed with **zero recorded steps**. This is runner/admission pre-execution evidence, not executed application test failure; recheck the final summaries and exact current-head CI on resumption.

## Next P0 and release HOLD
1. Restore a real protected executing CI or isolated full clone; run both committed test files, full npm checks, Next build/TS, Java21 Firebase Rules/emulator, Playwright and exact-source proof.
2. No durable seed activation until transactional canonical source/provenance, collision/rights and approval checks are owned and tested with genuine provider SDK and concurrency, including seed-token service identity.
3. Canonical Privacy C1/Auth write-time revocation ordering between separate Privacy and Content stores remains unresolved. Current pre/post requests and asynchronous revocation outbox cannot establish a linearizable late-write denial. Do not remove private/seed HOLD based on synthetic tests.
4. Verify cross-service protected Content→Studio/Jobs→Storytime→Spatial Replay→revocation/deletion and purge acknowledgment; Vercel READY, source/rollback, device/accessibility and independent owner/reviewer approval.

**NO-GO/HOLD.** Engineering safety stop does not imply end-to-end publishing works.
