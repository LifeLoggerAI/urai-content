# URAI Content

Canonical content engine and asset/story library for the URAI ecosystem.

`urai-content` is URAI's **content domain engine**: a typed contract, validation system, and backend service layer for narrator prompts, ritual/story templates, marketplace assets, publishing workflow, export copy, and canonical app content.

## Repo type

This repository is a **content package/library** with a launch-governed web runtime scaffold under `apps/web`. It provides typed content registries, schemas, loaders, validators, backend service contracts, route/API scaffolding, and seed/demo story assets for other URAI apps.

Do not call this repo production-launched until deployment, DNS, SSL, monitoring, rollback, and post-deploy smoke evidence are attached.

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
- `apps/web/` — standalone Next.js runtime scaffold where present
- `docs/` — launch runbooks, evidence templates, readiness docs, and completion governance

## Canonical command order

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

## Web-runtime command order

Run these when changing `apps/web` or making route/runtime claims:

1. `npm run web:install`
2. `npm run web:check`
3. `npm run web:smoke:routes -- --base-url=http://127.0.0.1:3000`

## Firebase adapter status

`urai-content` does not initialize Firebase Admin in browser code. Any live Firestore adapter must be server-only and must implement `ContentRepository` using injected Firestore/Admin SDK.

Firebase, Firestore, Storage, Auth, rules, indexes, and hosting are not production-GREEN until project IDs, rules, indexes, tests, provider evidence, deployed smoke, and rollback proof are attached.

## Governance and launch docs

Start here before claiming readiness:

- `docs/PRODUCTION_COMPLETION_PLAN.md` — executable standalone and system-of-systems completion plan
- `DEPLOYMENT_BLOCKERS.md` — live deployment blockers and owner actions
- `docs/PRODUCTION_READINESS_DASHBOARD.md` — RED/YELLOW/GREEN production status, if present
- `AUDIT_REPORT.md` — audit findings and local verification evidence, if present
- `docs/TESTING.md` — package quality gate
- `docs/DEPLOYMENT.md` — deployment command order and integration notes

Repo rule: **no evidence means no GREEN**.

## Env

See `.env.example` and `apps/web/.env.example` where present. Do not commit private values.

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
- env configured in the deployment provider
- Firestore/Storage rules and indexes tested where applicable
- auth/admin/creator flows fail closed
- payment and entitlement flows verified where applicable
- export artifacts are ownership-protected
- browser E2E and route smoke pass
- DNS/SSL verified
- monitoring/alerts configured
- rollback path rehearsed or documented with evidence
