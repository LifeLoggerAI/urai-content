# URAI Content

Canonical content engine, asset/story library, and launch-governed web-runtime scaffold for the URAI ecosystem.

`urai-content` is URAI's **content domain engine**: a typed contract, validation system, and backend service layer for narrator prompts, ritual/story templates, marketplace assets, publishing workflow, export copy, and canonical app content.

The repo also contains a standalone Next.js runtime scaffold under `apps/web` for the future URAI Content public site and runtime route/API surface. The runtime scaffold is repo-side work; production deployment remains blocked until Firebase/hosting/DNS/secrets/Stripe/observability/rollback evidence is complete.

## Current Production Status

Repo-side production-lock work is complete and merged, but the public production launch remains **external-env blocked** until deployment/provider evidence is attached.

- Production-lock merge commit: `431cdf1189ec01ed5c519ce19c2f03801df92dbf`
- Proof folder: `launch-proof/urai-content-production-lock/2026-06-30T011500-0500/`
- Open blocker tracker: https://github.com/LifeLoggerAI/urai-content/issues/61
- External deployment handoff: `docs/EXTERNAL_ENV_DEPLOYMENT_HANDOFF.md`

Do **not** mark this repository production-live READY until issue #61 is closed with URLs, commands, timestamps, deploy IDs, Firebase/Auth/Firestore/Storage proof, smoke-test evidence, observability evidence, and rollback evidence.

## Repo Type

This repository is both:

1. a root TypeScript content package/library, and
2. a launch-governed standalone web runtime scaffold under `apps/web`.

The package provides typed content registries, schemas, loaders, validators, backend service contracts, and seed/demo story assets for other URAI apps.

The web runtime provides route/API scaffolding and local verification for the public URAI Content site. It must not be called production-launched until deployed URL, smoke, monitoring, secrets, and rollback evidence exist.

## Repository Role In URAI

This repo is the content backbone used by app/admin/runtime repos. It centralizes:

- content schemas
- canonical brand, page, demo, legal, sprite, and SEO content
- typed content registries and loaders
- publishing workflow rules
- moderation and release logging contracts
- entitlement-aware content access checks
- telemetry event contracts
- demo seed packs for local/staging
- runtime route/API scaffolding under `apps/web`
- launch governance, evidence, and blocker tracking

## Structure

- `content/` - canonical source of truth for brand, pages, demo, legal, sprites, and SEO JSON
- `src/lib/content/` - schema, loaders, registry, and validators
- `src/schemas/content.ts` - centralized Zod schemas and TypeScript types
- `src/backend/contentService.ts` - workflow, versioning, search, entitlements, moderation/release/telemetry hooks
- `src/backend/types.ts` - repository interface for Firebase adapter implementation
- `src/backend/inMemoryRepository.ts` - local/testing repository implementation
- `src/index.ts` - stable package exports
- `src/seed/` - demo seed content and schema validation script
- `scripts/contentIndex.ts` - deterministic generated content index
- `scripts/checkGovernanceDocs.ts` - governance/docs integrity check used by `npm run check:governance`
- `scripts/checkNoSecrets.ts` - repository secret leakage scan used by `npm run check:secrets`
- `scripts/checkObservabilityEnv.ts` - production observability environment verifier used by `npm run check:observability`
- `scripts/productionSmoke.ts` - deployed runtime smoke verifier used by `npm run smoke:production`
- `scripts/rollbackSmoke.ts` - rollback runtime verifier used by `npm run smoke:rollback`
- `tests/` - smoke and unit tests
- `apps/web/` - standalone Next.js runtime scaffold, public route/API surface, route smoke checks, and Playwright E2E
- `.github/` - issue templates, PR template, CODEOWNERS, governance workflow, and web E2E workflow
- `docs/` - implementation status, route coverage, launch runbook, E2E runbook, issue control, evidence, branch, maintainer, and readiness docs

## Canonical Package Command Order

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run validate:content`
5. `npm run validate:sprites`
6. `npm run content:index`
7. `git diff --exit-code`
8. `npm run content:check`
9. `npm test`
10. `npm run build`
11. `npm run seed:check`
12. `npm run check:governance`
13. `npm run check:secrets`
14. `npm run check`
15. `npm run done`

`npm run check` includes governance, secret scanning, and ecosystem contract checks, so required launch-control docs, README references, PR/issue templates, CODEOWNERS, critical evidence-gate language, and likely secret leaks are verified automatically.

## Canonical Web-Runtime Command Order

Run these when changing `apps/web` or making route/runtime claims:

1. `npm run web:install`
2. `npm run web:check`
3. `npm run web:smoke:routes -- --base-url=http://127.0.0.1:3000`
4. `cd apps/web && npm run e2e`

For deployed launch claims, run route smoke, production smoke, observability checks, rollback smoke, and browser E2E against the deployed staging or production URL and attach output in an evidence log:

```bash
npm run check:observability
npm run web:smoke:routes -- --base-url=<staging-or-production-url>
npm run smoke:production -- --base-url=<staging-or-production-url>
npm run smoke:rollback -- --base-url=<staging-or-production-url> --rollback-url=<rollback-url>
cd apps/web && PLAYWRIGHT_SKIP_WEB_SERVER=1 URAI_CONTENT_BASE_URL=<staging-or-production-url> npm run e2e
```

## Governance And Evidence Rule

The launch rule is simple: no evidence means no GREEN. A route, workflow, deployment, Firebase environment, Stripe integration, DNS record, SSL certificate, browser E2E pass, rollback path, or monitoring path is not complete until the matching evidence is attached in the repo or CI artifacts.

Important governance files:

- `docs/PRODUCTION_READINESS_DASHBOARD.md`
- `URAI_FINAL_COMPLETION_AUDIT.md`
- `docs/IMPLEMENTATION_STATUS.md`
- `DEPLOYMENT_BLOCKERS.md`
- `docs/ROUTE_COVERAGE.md`
- `docs/E2E_VERIFICATION_RUNBOOK.md`
- `docs/PRODUCTION_LAUNCH_RUNBOOK.md`
- `docs/ISSUE_LAUNCH_CONTROL.md`
- `docs/EVIDENCE_LOG_TEMPLATE.md`
- `docs/MAINTAINER_RELEASE_CHECKLIST.md`
- `docs/BRANCH_AND_GOVERNANCE_STATUS.md`

CI/governance workflow references:

- `.github/workflows/governance.yml`
- `.github/workflows/web-e2e.yml`
- `web-e2e.yml`

Run these governance gates before claiming release readiness:

```bash
npm run check:governance
npm run check:secrets
npm run check:observability
npm run smoke:production -- --base-url=<staging-or-production-url>
npm run smoke:rollback -- --base-url=<staging-or-production-url> --rollback-url=<rollback-url>
```
