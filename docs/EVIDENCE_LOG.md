# URAI Content Evidence Log

## 2026-06-29 CI Repair Pass

Branch: `ci-repair/urai-content-export-test`
Base inspected: `main` at PR #44 merge commit `b4d1c7dbe321a48ba23cadab1c3b53b03312ea03`
Repair PR: #45
Repair head verified: `5148bae3c286517b3d365e2a44a54de69ae0ebf8`
Repair merge commit: `b226b85ce3c3931a481d74a9b72f2afb7c02b2b3`

### Reason For This Pass

PR #44 was merged while CI was failing in root `npm test`. The failing test expected the seed `export-demo-ritual-card` record to remain `complete`, but PR #44 intentionally downgraded that seed export because it had no real storage object, download URL, or checksum proof.

### Evidence Collected In This Pass

| Check | Result | Evidence |
| --- | --- | --- |
| Export lifecycle test repair | Implemented and merged | PR #45 updated `tests/exports.test.ts` to create its own completed export fixture through `startExportJob()` and `completeExportJob()` instead of relying on fake completed seed proof. |
| Governance validation | Pass | Workflow run 94, run id `28339416684`, conclusion `success`. |
| URAI Production Verify | Pass | Workflow run 4, run id `28339416695`, conclusion `success`; typecheck, tests, build, and URAI QA completed successfully. |
| Main CI | Pass | Workflow run 586, run id `28339416685`, conclusion `success`. |

### Current Go/No-Go

Repository CI for PR #45: **GREEN**.

Deployment/provider evidence: **pending**. CI is green for the code repair. Launch evidence still needs to be attached for deployed URL, DNS/SSL, Firebase project/rules/emulator output, Stripe proof, export/storage proof, browser E2E screenshots, monitoring, and rollback proof.

---

## 2026-06-29 Production Lock Pass

Branch: `production-lock/urai-content-done-done`
Base inspected: `main` at `c5be02363475d18eb5e6fb0c63f7c7c346160d12`
Execution mode: GitHub connector-backed repo edits. Direct local clone/install/test was blocked because the container could not resolve `github.com`.

### Evidence Collected In This Pass

| Check | Result | Evidence |
| --- | --- | --- |
| Secret scanner scope | Hardened | `scripts/checkNoSecrets.ts` no longer excludes the entire API route test file; only the known dummy fixture value is redacted. |
| Secret scanner review feedback | Addressed | Redaction replacement is short (`redacted`) and only applied after a raw suspicious-pattern hit. |
| Production memory fallback | Hardened | `apps/web/src/server/content/service.ts` reports runtime persistence status and throws for production writes when Firebase Admin is missing. |
| Health status | Hardened | `/api/health` now returns degraded / `ok: false` when persistence is not production-safe. |
| Firebase status | Hardened | `/api/system/firebase` now reports runtime mode, writable status, preview mode, and production-safe state without secrets. |
| Creator submissions | Hardened | List/create/detail routes return `503 persistence_not_configured` instead of silently using memory in production without Firebase. |
| Admin moderation | Hardened | Admin queue and moderation write routes return `503 persistence_not_configured` instead of silently using memory in production without Firebase. |
| Firestore rules | Normalized | `apps/web/firestore.rules` now uses canonical `role` / `roles` custom claims and denies fallback. |
| Storage rules | Normalized | `apps/web/storage.rules` now uses canonical `role` / `roles` custom claims and denies fallback. |
| Asset/export truth | Hardened | Unverified seed asset manifests, packs, licenses, and exports were downgraded from production-looking states. |
| Asset/export tests | Added | `tests/production.test.ts` now rejects published assets with demo/unverified checksums and fake completed export proof. |
| Production persistence tests | Added | `apps/web/tests/runtime-persistence.test.ts` covers memory preview behavior, production fail-closed behavior, health degradation, Firebase status, and creator-submission 503 behavior. |
| Route/readiness docs | Added | `docs/PRODUCTION_READINESS.md`, `docs/ROUTE_AUDIT.md`, and `docs/BLOCKERS.md`. |

### Commands Attempted In This Pass

| Command | Result | Notes |
| --- | --- | --- |
| `git clone https://github.com/LifeLoggerAI/urai-content.git /mnt/data/urai-content` | Failed | DNS resolution for `github.com` failed in this environment. |
| `npm ci` | Not run | Blocked by unavailable local clone. Must run in CI/operator environment. |
| `npm run check` | Not run | Blocked by unavailable local clone. Must run in CI/operator environment. |
| `npm run done` | Not run | Blocked by unavailable local clone. Must run in CI/operator environment. |
| `npm run web:install` | Not run | Blocked by unavailable local clone. Must run in CI/operator environment. |
| `npm run web:check` | Not run | Blocked by unavailable local clone. Must run in CI/operator environment. |
| `npm run web:smoke:routes` | Not run | Blocked by unavailable local clone. Must run in CI/operator environment. |
| `npm test` | Not run | Blocked by unavailable local clone. Must run in CI/operator environment. |

### External Evidence Not Available In This Pass

- Deployed URL.
- DNS/SSL validation.
- Firebase production project/rules/emulator output.
- Stripe checkout/webhook/entitlement proof.
- Browser E2E screenshots.
- Monitoring/alert evidence.
- Rollback target and rollback smoke output.

### Current Go/No-Go

Repository hardening status: **CI-backed after follow-up repair**.

Deployment/provider evidence: **pending**. This branch makes several unsafe states honest and fail-closed. Final launch evidence still needs to be attached for provider configuration, deployment, and smoke proof.

---

## 2026-05-29 Stabilization Pass

Date: 2026-05-29
Branch: `codex/content-stabilization-phase-0-1`
Base inspected: `43491aa9b1c12b3b6978479fbc0933bf9a1eae96`

### Evidence Collected In This Pass

| Check | Result | Evidence |
| --- | --- | --- |
| Runtime mismatch inspection | Confirmed | `apps/web/src/server/content/runtimeCatalog.ts` imported `createRuntimeContentService`; main `apps/web/src/server/content/service.ts` did not export it. |
| Runtime mismatch repair | Implemented on branch | `apps/web/src/server/content/service.ts` now exports `RuntimeContentService` and `createRuntimeContentService()`. |
| Runtime behavior tests | Added and passing | `apps/web/tests/runtime-content-service.test.ts`; web tests pass from `apps/web` with 13 files / 56 assertions. |
| Auth/RBAC foundation | Implemented on branch | `apps/web/src/server/auth/roles.ts`, `rbac.ts`, `session.ts`, `guards.ts`, `errors.ts`. |
| Header auth production fail-closed behavior | Implemented and tested | `apps/web/src/server/auth/session.ts`, `apps/web/tests/authorization.test.ts`. |
| Admin seed route guard | Implemented on branch | `apps/web/src/app/api/admin/seed/canonical-content/route.ts`. |
| Ecosystem contracts | Implemented on branch | `docs/contracts/URAI_ECOSYSTEM_SCHEMA_V1.json`, `URAI_ECOSYSTEM_INTEGRATION_V1.md`, `docs/XR_CONTENT_PACK_CONTRACT.md`, `docs/FAILSAFE_DIAGNOSTICS.md`. |
| Ecosystem contract check | Passing | `npm run check:ecosystem` passed. |
| Route smoke | Passing locally | `npm run smoke:routes` from `apps/web` checked 35 routes and all returned 200. |

### Commands Run

| Command | Result | Notes |
| --- | --- | --- |
| `npm ci` | Pass | Installed 164 root packages; npm reported 6 moderate audit findings. |
| `npm run lint` | Pass | Root lint passed. |
| `npm run typecheck` | Failed, then pass | Initial NodeNext import-extension failure in `tests/ecosystem-contracts.test.ts`; fixed by importing `../scripts/checkEcosystemContracts.js`. |
| `npm test` | Pass | Root tests: 8 files / 36 assertions passed. |
| `npm run validate:content` | Pass | Content validator passed. |
| `npm run validate:sprites` | Pass | Sprite validator alias passed. |
| `npm run content:index` | Pass | Generated content index with no content diff. |
| `npm run build` | Pass | Root TypeScript build passed. |
| `npm run seed:check` | Pass | Seed data validated. |
| `npm run seed:system:check` | Pass | System seed counts emitted successfully. |
| `npm run check:governance` | Failed, then pass | README governance references were stale; fixed README and reran successfully. |
| `npm run check:secrets` | Pass | Secret leakage check passed. |
| `npm run check:ecosystem` | Pass | Ecosystem schema/check passed. |
| `npm run check` | Pass | Full root aggregate check passed after fixes. |
| `npm run web:install` | Pass after escalation | Initial sandbox network EACCES/timeout; reran with network approval and installed 505 web packages. |
| `npm run typecheck` from `apps/web` | Failed, then pass | RBAC compatibility/test typing issues fixed; rerun passed. |
| `npm test` from `apps/web` | Pass | Web tests: 13 files / 56 assertions passed. |
| `npm run lint` from `apps/web` | Pass | Web lint passed. |
| `npm run build` from `apps/web` | Pass | Next build passed; 35/35 static pages generated. |
| `npm run smoke:routes` from `apps/web` | Failed, then pass | Windows spawn/cleanup issues fixed in smoke script; rerun checked 35 routes successfully. |
| `npm run web:check` / `npm run check` from `apps/web` | Blocked in this Windows sandbox | The chained npm script can make Vitest/esbuild attempt an access-denied upward path read while loading `vitest.config.ts`; the equivalent individual gates above pass. Needs CI/Linux confirmation. |

### External Evidence Not Available In This Pass

- CI run URL.
- Deployed URL.
- DNS/SSL validation.
- Firebase production project/rules/emulator output.
- Stripe webhook fixture/prod endpoint evidence.
- Monitoring/alert evidence.
- Rollback target and rollback smoke output.

### Current Go/No-Go

Repository stabilization status: **review-ready pending current CI confirmation**.

Deployment/provider evidence: **pending**. This Phase 0/1 stabilization branch was suitable for review once CI confirmed the web aggregate command in a normal runner. Final launch evidence still requires provider and deployment proof.
