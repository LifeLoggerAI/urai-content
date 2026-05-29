# URAI Content Completion Audit

Date: 2026-05-29
Branch: `codex/content-stabilization-phase-0-1`
Base inspected: `43491aa9b1c12b3b6978479fbc0933bf9a1eae96`

## Current Classification

Status: **YELLOW / integration hardening in progress**

URAI Content now has a root TypeScript content package plus a Next.js web runtime under `apps/web`. This branch fixes the Phase 1 runtime service mismatch and ports the safe parts of the open auth/ecosystem work, but it does not claim production deployment readiness. Production remains blocked until live Firebase, DNS, SSL, Stripe, monitoring, rollback, CI, and deployed smoke evidence are available.

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
- Added tests for runtime memory fallback, published-only filtering, auth/RBAC behavior, and production header-auth denial.
- Ported PR #40 ecosystem contract docs and added a machine-readable ecosystem schema plus a root check script/test.

## Evidence Status

| Area | Status | Evidence | Remaining Risk |
| --- | --- | --- | --- |
| Runtime service mismatch | Done on branch | `apps/web/src/server/content/service.ts`, `apps/web/tests/runtime-content-service.test.ts` | Needs CI/local verification on this branch. |
| Auth/RBAC foundation | Partial | `apps/web/src/server/auth/*`, `apps/web/tests/authorization.test.ts` | Firebase Auth live token verification requires configured Admin credentials and route coverage beyond seed route. |
| Admin seed route guard | Partial | `apps/web/src/app/api/admin/seed/canonical-content/route.ts` | Needs integration test against deployed/staged Next runtime. |
| Ecosystem contract docs | Partial | `docs/contracts/*`, `docs/XR_CONTENT_PACK_CONTRACT.md`, `docs/FAILSAFE_DIAGNOSTICS.md` | Contract consuming repos still need adoption. |
| Ecosystem contract validation | Done locally in code | `scripts/checkEcosystemContracts.ts`, `tests/ecosystem-contracts.test.ts`, `npm run check:ecosystem` | Needs CI/local execution. |
| Production deployment | Blocked | No deployed URL, DNS, SSL, monitoring, rollback, Stripe, or Firebase production evidence in this pass. | External credentials/provider access required. |

## Canonical Command Order

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run validate:content`
5. `npm run validate:sprites`
6. `npm run content:index`
7. `git diff --exit-code`
8. `npm test`
9. `npm run build`
10. `npm run seed:check`
11. `npm run seed:system:check`
12. `npm run check:governance`
13. `npm run check:secrets`
14. `npm run check:ecosystem`
15. `npm run check`
16. `npm run web:install`
17. `npm run web:check`
18. `npm run web:smoke:routes`

## Remaining Blockers

- Local validation is blocked in this Codex workspace unless the private repository can be cloned or checked out.
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
- [ ] Root checks executed successfully on this branch.
- [ ] Web checks executed successfully on this branch.
- [ ] Firebase emulator/rules tests completed.
- [ ] Stripe fixture tests completed.
- [ ] Browser E2E/visual smoke completed.
- [ ] Live production deployment evidence collected.
