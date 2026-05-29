# URAI Content Evidence Log

Date: 2026-05-29
Branch: `codex/content-stabilization-phase-0-1`
Base inspected: `43491aa9b1c12b3b6978479fbc0933bf9a1eae96`

## Evidence Collected In This Pass

| Check | Result | Evidence |
| --- | --- | --- |
| Runtime mismatch inspection | Confirmed | `apps/web/src/server/content/runtimeCatalog.ts` imported `createRuntimeContentService`; main `apps/web/src/server/content/service.ts` did not export it. |
| Runtime mismatch repair | Implemented on branch | `apps/web/src/server/content/service.ts` now exports `RuntimeContentService` and `createRuntimeContentService()`. |
| Runtime behavior tests | Added | `apps/web/tests/runtime-content-service.test.ts`. |
| Auth/RBAC foundation | Implemented on branch | `apps/web/src/server/auth/roles.ts`, `rbac.ts`, `session.ts`, `guards.ts`, `errors.ts`. |
| Header auth production fail-closed behavior | Implemented on branch | `apps/web/src/server/auth/session.ts`, `apps/web/tests/authorization.test.ts`. |
| Admin seed route guard | Implemented on branch | `apps/web/src/app/api/admin/seed/canonical-content/route.ts`. |
| Ecosystem contracts | Implemented on branch | `docs/contracts/URAI_ECOSYSTEM_SCHEMA_V1.json`, `URAI_ECOSYSTEM_INTEGRATION_V1.md`, `docs/XR_CONTENT_PACK_CONTRACT.md`, `docs/FAILSAFE_DIAGNOSTICS.md`. |
| Ecosystem contract check | Implemented on branch | `scripts/checkEcosystemContracts.ts`, `tests/ecosystem-contracts.test.ts`, `npm run check:ecosystem`. |

## Commands Planned For Operator/CI

These commands still need to run from a checkout with dependency access:

```bash
npm ci
npm run lint
npm run typecheck
npm run validate:content
npm run validate:sprites
npm run content:index
git diff --exit-code
npm test
npm run build
npm run seed:check
npm run seed:system:check
npm run check:governance
npm run check:secrets
npm run check:ecosystem
npm run check
npm run web:install
npm run web:check
npm run web:smoke:routes
```

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

This branch is a Phase 0/1 stabilization branch. It can move toward review once CI/local checks pass, but it is not a production launch artifact without the missing external evidence above.
