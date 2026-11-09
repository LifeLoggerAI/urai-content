# ONE URAI GENESIS — Content R125 next-worker continuation

**Continuation ONLY. Do not repeat earlier byte inventory.**
Prior source baseline 388/388 frozen main SHA256 and 99 branch-head tree census remain in PR #114. The stack remains #96 → #115 (publisher integration) → #116 (atomic moderation) → #117 (create-only creator POST) → **new [draft PR #118](https://github.com/LifeLoggerAI/urai-content/pull/118)** (unlisted public-catalog enumerability). All original workers remain open and untouched.

## New R125 finding and source candidate
- Exact parent PR #117 head `21cf963882623c56d3c081c449194e506227714f`. New branch `fix/content-unlisted-public-index-20261108`, PR #118 draft. Recheck moving HEAD.
- `apps/web/src/server/content/service.ts` previously listed published unlisted alongside published public via `listPublishedCatalogPage`; anonymous `/api/catalog` exposed both.
- New candidate lists published **public only**, while `getPublishedContentBySlug` continues allowing published unlisted records via direct URL. Drafts, private and archived remain excluded.
- `apps/web/tests/runtime-content-service.test.ts` adds a negative mixed-visibility fixture and direct-link assertion; `apps/web/tests/runtime-catalog-firestore.test.ts` adjusts list fixture expectations to public-only. Only these two tests plus service and evidence doc change.

## Native isolated evidence (new, actual execution)
The exact edited service source was independently reproduced locally with `git hash-object` equal to GitHub blob `d30cec3d1ed69587fbfc400b922d573cda57867e` (4,422 original bytes; SHA256 `2f483d971c5d0136092758248edba4183a74a5cfbf65ed87ed1f834b28d57e40`). Node v22.16.0 / TypeScript 5.8.3 transpilation and a synthetic injected repository exercised the unchanged service behavior: **8/8 PASS, 0 fail/skip**. Includes public-only enumeration, cursor, unlisted direct slug, private/draft denial, ambiguous canonical/legacy slugs, unknown slug and public-only search defaults. TAP SHA256 `0cf1413ab8e2229421c8f305b133118dca5529745ff9bd4dd7664a63de1f8dc3`. Local reproducible ZIP: `/mnt/data/content-r125-native-public-catalog.zip`, SHA256 `8b35fba313db65a74d9681fd6cf7c6afa42b7ebe8f1d678e9746c098e77c4abb`.

**Scope:** isolated exact-original-module test, *not* whole-app Next or real Firebase Auth/emulator acceptance. The two committed Vitest files are **not yet executed** under the full repository dependencies. Legacy canonical JSON demo samples intentionally remain public-safe and can still appear in fallback demo lists.

## Cross-Privacy current-state authority finding
Read Privacy main exact source `1163d6f32a123ef9a6638e092a3eee5ec4a3b317`:
- `functions/src/consent-api.ts` canonical `setCanonicalConsent` commits an authoritative `consentRecords` record, event and audit in a Privacy transaction. `evaluateCanonicalConsent` reads Privacy's `consentRecords` and `privacyDeletionTombstones` and writes a `dataAccessEvents` evaluation receipt in another Privacy transaction.
- Content's PR #117 Auth/C1 rechecks happen before and after Content's separate Firestore creator-write transaction. **A Privacy allow decision is not a commit-time lock.** The shared epoch/consent revocation synchronization model is neither implemented nor accepted as a cross-project atomic guarantee.
- Privacy `docs/CONSENT_DECISION_SERVICE.md` declares `IMPLEMENTED BUT NOT DEPLOYED` at main; do not substitute documentation for provider readback.
- Independent solution needs Privacy/Content owner-approved canonical revocation ordering and a consistent authority fence, valid through Content commit; test withdrawal acknowledged vs pending writes, stale reads, absent/expired consent, tombstone, service outage, replay, role change, and downstream acknowledgement. No local duplicate consent authority permitted.

## CI / release
Initial PR #118 source `a66a8eaf49dc5726d192b2226f2eb14ddc1c9d8e`: [Visual #42548315634](https://github.com/LifeLoggerAI/urai-content/actions/runs/42548315634), [Verify #42548315631](https://github.com/LifeLoggerAI/urai-content/actions/runs/42548315631), [CI #42548315648](https://github.com/LifeLoggerAI/urai-content/actions/runs/42548315648). At latest readback all **five jobs recorded zero steps**, with failure conclusions; Visual workflow status had briefly remained in_progress although its single job was complete. Classify as runner admission blocker, not executed application tests. Re-fetch exact current PR #118 HEAD and runs before acceptance.
No local native full checkout (GitHub/npm DNS unavailable); no provider production change, Firebase effective IAM/rules, licensed media, signed cross-service lifecycle, Vercel READY or independent release approval.

**NO-GO/HOLD.** Next worker: full PR #118 checkout/CI/Next/Vitest/Java21 emulator; canonical Privacy↔Content commit-time C1/role fence and deletion; complete protected Content→Studio/Jobs→Storytime→Spatial Replay→purge acknowledgement; preview SHA parity and rollback. No inventory restart.
