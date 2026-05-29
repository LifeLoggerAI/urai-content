# URAI Content Completion Audit

Date: 2026-05-29
Branch: `codex/content-stabilization-phase-0-1`
Base inspected: `43491aa9b1c12b3b6978479fbc0933bf9a1eae96`

## Current Classification

Status: **YELLOW / Phase 0-1 integration hardening branch**

URAI Content has a root TypeScript content package plus a Next.js web runtime under `apps/web`. This branch fixes the Phase 1 runtime service mismatch, ports the safe parts of the open auth/ecosystem work, and adds validation evidence. It does not claim production deployment readiness. Production remains blocked until live Firebase, DNS, SSL, Stripe, monitoring, rollback, CI, browser E2E, and deployed smoke evidence are available.

## What I Inspected

- Root package scripts and content package contract in `package.json`.
- Web runtime package scripts in `apps/web/package.json`.
- Runtime catalog wiring in `apps/web/src/server/content/runtimeCatalog.ts`.
- Runtime content service in `apps/web/src/server/content/service.ts`.
- Runtime content types and repository implementation in `apps/web/src/server/content/types.ts` and `apps/web/src/server/content/inMemoryRepository.ts`.
- Firebase Admin server files in `apps/web/src/server/firebase/admin.ts`, `adminEnv.ts`, and `contentRepository.ts`.
- Admin canonical seed route in `apps/web/src/app/api/admin/seed/canonical-content/route.ts`.
- Open PR #39 auth/runtime work and PR #40 ecosystem/XR/failsafe docs.

## Phase 0 / Phase 1 Changes

- Confirmed `runtimeCatalog.ts` imported `createRuntimeContentService` while `service.ts` did not export it on main.
- Added `RuntimeContentService` and `createRuntimeContentService()`.
- Kept local/dev/test memory fallback stable while preserving Firebase repository mode when Admin config exists.
- Added published-only runtime search behavior for public catalog usage.
- Added Firebase Admin Auth helper for server-side ID token verification when configured.
- Added canonical server auth roles, permissions, session parsing, guards, and JSON auth failure helpers.
- Preserved local/test header auth but made production fail closed by default unless `URAI_ENABLE_HEADER_AUTH=1` is intentionally configured.
- Hardened `POST /api/admin/seed/canonical-content` to require a valid seed token or admin/internalAdmin session.
- Added and repaired tests for runtime memory fallback, published-only filtering, auth/RBAC behavior, and production header-auth denial.
- Ported PR #40 ecosystem contract docs and added a machine-readable ecosystem schema plus a root check script/test.
- Made route smoke startup/cleanup portable on Windows by using `npm.cmd` and process-tree cleanup.
- Updated README and implementation/evidence docs to keep governance status truthful.

## Evidence Status

| Area | Status | Evidence | Remaining Risk |
| --- | --- | --- | --- |
| Runtime service mismatch | Done | `apps/web/src/server/content/service.ts`, `apps/web/tests/runtime-content-service.test.ts`; web tests pass from `apps/web`. | Needs CI confirmation. |
| Auth/RBAC foundation | Partial | `apps/web/src/server/auth/*`, `apps/web/tests/authorization.test.ts`, `apps/web/tests/rbac.test.ts`. | Firebase Auth live token verification requires configured Admin credentials and broader protected-route coverage. |
| Admin seed route guard | Partial | `apps/web/src/app/api/admin/seed/canonical-content/route.ts`. | Needs staged/deployed route smoke with admin token/session evidence. |
| Ecosystem contract docs | Partial | `docs/contracts/*`, `docs/XR_CONTENT_PACK_CONTRACT.md`, `docs/FAILSAFE_DIAGNOSTICS.md`. | Contract consuming repos still need adoption. |
| Ecosystem contract validation | Done | `scripts/checkEcosystemContracts.ts`, `tests/ecosystem-contracts.test.ts`, `npm run check:ecosystem` passed. | Needs CI confirmation. |
| Root package validation | Done locally | `npm run check` passed after fixes. | No CI URL in this pass. |
| Web runtime validation | Partial | `apps/web`: lint/typecheck/test/build passed individually; route smoke checked 35 routes. | Aggregate `web:check`/`apps/web npm run check` hits a Windows sandbox chained-npm/Vitest config access issue; verify in CI/Linux. |
| Production deployment | Blocked | No deployed URL, DNS, SSL, monitoring, rollback, Stripe, or Firebase production evidence in this pass. | External credentials/provider access required. |

## Commands Run

See `docs/EVIDENCE_LOG.md` for command-by-command pass/fail notes. Key successful gates:

- `npm ci`
- `npm run check`
- `npm run check:ecosystem`
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` from `apps/web` individually
- `npm run smoke:routes` from `apps/web`

## Remaining Blockers

- `npm run web:check` / `apps/web npm run check` needs CI/Linux confirmation because the chained npm script hits a Windows sandbox access-denied issue while loading `vitest.config.ts`; individual equivalent gates pass.
- Live Firebase verification requires project access and Admin credentials.
- Firestore/Storage emulator tests are not yet completed in this Phase 0/1 pass.
- Stripe checkout/webhook/entitlements remain incomplete and must not be described as live.
- Browser E2E/visual smoke is not yet complete in this Phase 0/1 pass.
- Production deployment, DNS, SSL, monitoring, rollback, and provider evidence remain unavailable.

## Done-Done Checklist

- [x] Runtime service mismatch fixed on branch.
- [x] Published-only runtime catalog search added.
- [x] Auth/RBAC server foundation added.
- [x] Production header-auth default denial added.
- [x] Admin seed route guard hardened.
- [x] Ecosystem/XR/failsafe contract docs ported.
- [x] Ecosystem contract schema/check/test added.
- [x] Root checks executed successfully on this branch.
- [x] Web lint/typecheck/test/build executed successfully as individual gates.
- [x] Web route smoke executed successfully locally.
- [ ] Web aggregate check confirmed in CI/Linux.
- [ ] Firebase emulator/rules tests completed.
- [ ] Stripe fixture tests completed.
- [ ] Browser E2E/visual smoke completed.
- [ ] Live production deployment evidence collected.
