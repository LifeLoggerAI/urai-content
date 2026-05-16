# URAI Content

Canonical content engine, asset/story library, and launch-governed web-runtime scaffold for the URAI ecosystem.

`urai-content` is URAI's **content domain engine**: a typed contract, validation system, and backend service layer for narrator prompts, ritual/story templates, marketplace assets, publishing workflow, export copy, and canonical app content.

The repo also contains a standalone Next.js runtime scaffold under `apps/web` for the future URAI Content public site and runtime route/API surface. The runtime scaffold is repo-side work; production deployment remains blocked until Firebase/hosting/DNS/secrets/Stripe/observability/rollback evidence is complete.

## Repo type

This repository is both:

1. a root TypeScript content package/library, and
2. a launch-governed standalone web runtime scaffold under `apps/web`.

The package provides typed content registries, schemas, loaders, validators, backend service contracts, and seed/demo story assets for other URAI apps.

The web runtime provides route/API scaffolding and local verification for the public URAI Content site. It must not be called production-launched until deployed URL, smoke, monitoring, secrets, and rollback evidence exist.

## Repository role in URAI

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

- `content/` — canonical source of truth for brand, pages, demo, legal, sprites, and SEO JSON
- `src/lib/content/` — schema, loaders, registry, and validators
- `src/schemas/content.ts` — centralized Zod schemas and TypeScript types
- `src/backend/contentService.ts` — workflow, versioning, search, entitlements, moderation/release/telemetry hooks
- `src/backend/types.ts` — repository interface for Firebase adapter implementation
- `src/backend/inMemoryRepository.ts` — local/testing repository implementation
- `src/index.ts` — stable package exports
- `src/seed/` — demo seed content and schema validation script
- `scripts/contentIndex.ts` — deterministic generated content index
- `tests/` — smoke and unit tests
- `apps/web/` — standalone Next.js runtime scaffold, public route/API surface, and web checks
- `.github/` — issue templates, PR template, CODEOWNERS, and workflow governance
- `docs/` — implementation status, route coverage, launch runbook, issue control, evidence, branch, maintainer, and readiness docs

## Canonical package command order

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
12. `npm run check`
13. `npm run done`

## Canonical web-runtime command order

Run these when changing `apps/web` or making route/runtime claims:

1. `npm run web:install`
2. `npm run web:check`
3. `npm run web:smoke:routes -- --base-url=http://127.0.0.1:3000`

For launch claims, run route smoke against the deployed staging or production URL and attach output in an evidence log.

## Firebase adapter status

`urai-content` does not initialize Firebase Admin in browser code. Any live Firestore adapter must be server-only and must implement `ContentRepository` using injected Firestore/Admin SDK.

Firebase, Firestore, Storage, Auth, rules, indexes, and hosting are not production-GREEN until project IDs, rules, indexes, tests, provider evidence, deployed smoke, and rollback proof are attached.

## Env

- `NEXT_PUBLIC_GITHUB_ISSUES_URL`
- `NEXT_PUBLIC_CI_RUN_URL`
- Firebase/Stripe variables in `.env.example` and `apps/web/.env.example` for consuming runtime/deployment environments.

Never commit secret values. Provider/CI secret names may be documented; values must stay in the provider secret manager.

## Governance and launch docs

Start here before claiming readiness:

- `docs/PRODUCTION_READINESS_DASHBOARD.md` — single-glance RED/YELLOW/GREEN production status
- `URAI_FINAL_COMPLETION_AUDIT.md` — final audit and done-done gate
- `docs/IMPLEMENTATION_STATUS.md` — current implementation evidence
- `DEPLOYMENT_BLOCKERS.md` — live deployment blockers
- `docs/ROUTE_COVERAGE.md` — public/protected/API route status
- `docs/PRODUCTION_LAUNCH_RUNBOOK.md` — launch lanes and stop rules
- `docs/ISSUE_LAUNCH_CONTROL.md` — issue-to-launch control matrix
- `docs/EVIDENCE_LOG_TEMPLATE.md` — required evidence capture format
- `docs/MAINTAINER_RELEASE_CHECKLIST.md` — maintainer merge/release checklist
- `docs/BRANCH_AND_GOVERNANCE_STATUS.md` — branch truth and stale-branch warning

Repo rule: **no evidence means no GREEN**.

## Consumption

```ts
import { registry, validateContent } from 'urai-content';

validateContent();
console.log(registry.home.title);
```

## Production readiness

`urai-content` is not production-launched until all P0 production blockers are GREEN with evidence:

- hosting architecture selected and verified
- Firebase project/hosting/Firestore/Storage/Auth verified where applicable
- env/secrets configured in provider/CI secret manager
- Firestore/Storage rules and indexes tested where applicable
- auth/admin/creator flows fail closed
- Stripe checkout/webhooks/entitlements verified where applicable
- export artifacts are ownership-protected
- browser E2E and route smoke pass
- DNS/SSL verified
- monitoring/alerts configured
- rollback path rehearsed or documented with evidence
