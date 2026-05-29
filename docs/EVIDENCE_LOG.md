# URAI Content Evidence Log

Date: 2026-05-29
Branch: `codex/content-stabilization-phase-0-1`
Base inspected: `43491aa9b1c12b3b6978479fbc0933bf9a1eae96`

## Evidence Collected In This Pass

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

## Commands Run

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

## External Evidence Not Available In This Pass

- CI run URL.
- Deployed URL.
- DNS/SSL validation.
- Firebase production project/rules/emulator output.
- Stripe webhook fixture/prod endpoint evidence.
- Monitoring/alert evidence.
- Rollback target and rollback smoke output.

## Current Go/No-Go

Production: **not GREEN**.

This branch is a Phase 0/1 stabilization branch. It is suitable for review once CI confirms the web aggregate command in a normal runner, but it is not a production launch artifact without the missing external evidence above.
