# ONE URAI GENESIS — Content R127 source security continuation (not inventory)

**Checkpoint:** 2026-11-08 Central / 2026-11-09 UTC. **Release: NO-GO/HOLD.**

## Existing working branch chain (do not duplicate)
- Frozen main original-file bytes and branch-head metadata already covered in forensic PR #114: 388/388 main SHA-256 and all 99 visible branch heads.
- Controller #96 → combined publishing #115 → atomic moderation #116 → create-only creator writes #117 → anonymous unlisted indexing #118 → **new draft [#119](https://github.com/LifeLoggerAI/urai-content/pull/119)**.
- PR #119 branch `fix/content-private-mutations-hard-off-20261108` parent exact #118 `a66a8eaf49dc5726d192b2226f2eb14ddc1c9d8e`. Initial #119 source SHA `d49d611002fc2f90a56f56322932d08ce0eac8bb` (later documentation commit `8b2d85887fdf1a863ad13adb8d7f89e344da44a1`); re-read moving head.

## New cross-system verification
- Privacy main exact SHA `1163d6f32a123ef9a6638e092a3eee5ec4a3b317` has canonical C1 consent register and decision calls implemented in `functions/src/consent-api.ts` and `functions/src/consent-decision.ts`. Consent mutations and decision receipts run within Privacy Firestore transactions, not Content's separate creator transaction.
- Privacy `functions/src/consent-revocation.ts` publishes a revocation outbox asynchronously and receives consumer acknowledgements afterward. **Asynchronous revocation notices do not serialize Content's already-started private write.**
- Content `apps/web/src/server/privacy/canonicalConsent.ts` returns an evaluated boolean after checking a bounded canonical decision response, but no shared commit-time authority generation barrier exists. Privacy documentation says consent decision service implemented but not deployed at its source checkpoint. No provider deployment certified here.

## Source repair: safe hard-off, not false certification
- PR #119 introduces `apps/web/src/server/privacy/privateMutationHold.ts` with an unconditional production hard-off, without opt-in overrides.
- `apps/web/src/app/api/creator/submissions/route.ts` and `apps/web/src/app/api/admin/creator-submissions/[id]/moderate/route.ts` return generic HTTP 503 before their reviewed private repository mutation call; existing admission/current-role logic remains.
- Three Vitest files added/updated to reflect protected production behavior, while local fixture writes remain available. Moderation route hold placement was verified through exact GitHub blob readback, not exercised in the isolated native route harness.
- This stop applies to those **two reviewed private mutation routes**, not a blanket claim that every possible Content API or system mutation has been proved shut off.

## Actual native scoped tests
- Creator route exact committed Git blob `e7489597f357c2d9a4b77b4978fe6cc521633e25`; hold module exact Git blob `5de8d4d3f6959b797044faf293cae0882028bf65`. Native `git hash-object` matched both.
- Node v22.16.0 with mocked Next/Zod/Auth/C1/repository: **17/17 PASS**, including earlier create-only negative route cases and new hard-off, forbidden-actor, withdrawn-before-write, environment override and preview-fixture cases. Full TAP log SHA256 `9d35f258f037bfbbaa5202b942f660ec728de181e68654466d1efcc1e9ee26ad`.
- Separate model-only consent ordering simulation **6/6 PASS** demonstrating disconnected stale allow allows a late commit, while a hypothetical **same-authority transaction** could prevent it; log SHA256 `b4a0bc01d9f606686327ea29adacd7e3efef36f5c2ac7d040c15afb6f472274c`. **These six are design model tests, not Firebase/Privacy integration!**
- Standalone hold helper strict `tsc --noEmit` PASS with explicitly synthetic declarations because full repository @types/node unavailable. This is not a full TS build.
- Reproduction bundle `/mnt/data/content-r126-private-mutation-hold-evidence.zip`, SHA256 `fd5d89f01fe80da362d76e6d4ee5f8452557b28cc539aa0af172e3c3db2ac7fd`.

## GitHub Actions R127
PR #119 initial source commit `d49d611002fc2f90a56f56322932d08ce0eac8bb` had [CI #42549559444](https://github.com/LifeLoggerAI/urai-content/actions/runs/42549559444), [production verify #42549559419](https://github.com/LifeLoggerAI/urai-content/actions/runs/42549559419), and [visual #42549559455](https://github.com/LifeLoggerAI/urai-content/actions/runs/42549559455), all completed failed with **five jobs and zero recorded steps**. This is a pre-execution runner/admission blocker, not a failing application suite.

## Next acceptance (not release-ready)
1. Design jointly with Privacy the *authoritative cross-project revocation/commit ordering* (no cached consent, caller epoch, unverified mirror or merely asynchronous outbox). Need transactional commit-time fence or equivalent reviewed protocol with revocation acknowledgement semantics, crash/retry behavior, and downstream purge guarantees.
2. Run exact-branch repo tests (root/web npm, Next/TypeScript/Vitest/Playwright), actual moderator hold test, Java21 Firebase emulator and independent failure-injection/retry/race cases. Local git/npm DNS and GitHub Actions runner admission remain blockers.
3. Verify signed current C1/role decisions, service identity/IAM, project bindings; protected Content → Studio/Jobs/Storytime/Spatial Replay → revocation/deletion and downstream acknowledgements.
4. Verify protected Vercel READY compiled source SHA/rollback, visual/accessible devices and independent approval. Do not remove hard-off without completed authority replacement and explicit review.

**NO-GO/HOLD.** This PR makes a narrower mutation surface fail closed; it does not establish a functioning protected private Content pipeline.
