# URAI Content Implementation Status

Date: 2026-05-29
Branch: `codex/content-stabilization-phase-0-1`

This file is the source-of-truth status snapshot for `urai-content` on this branch.

## Current Verified Repository Role

`urai-content` is a TypeScript content-domain package with a standalone Next.js web runtime under `apps/web`.

The root package owns schemas, canonical content, validators, seed data, content service contracts, export helpers, telemetry contracts, integration contracts, and package-level tests.

The `apps/web` runtime owns the public website shell, route/API scaffolds, runtime content catalog, Firebase Admin/Firestore repository boundary, server auth/RBAC foundation, and route smoke/build path for the future `www.uraicontent.com` deployment.

This branch fixes a known runtime catalog/service mismatch and ports the safe parts of the auth and ecosystem-contract work. It is not verified as a live production deployment.

## Status Key

- **Done**: Implemented in this repository and verifiable with committed files plus package or web checks.
- **Partial**: Code, docs, schemas, or tests exist, but full production behavior or external evidence is incomplete.
- **Not Started**: Required by docs/roadmap/product claims but no implementation exists in this repository.
- **Blocked**: Cannot be completed until an external credential, DNS, provider, live deployment, or product decision is made.
- **Unknown**: Not verified from repository evidence; requires command output or external system access.

## Major System Status

| Area | Current status | Evidence | Required next step |
| --- | --- | --- | --- |
| Package/library role | Done | Root `package.json`, `src/index.ts`, schemas, seed checks, and package tests remain intact. | Preserve package API while hardening runtime behavior. |
| Package validation scripts | Done | `package.json` defines lint, typecheck, content validation, tests, build, smoke, verify, done, and ecosystem contract checks. | Run checks in CI/local checkout. |
| Web runtime scaffold | Partial | `apps/web` exists with Next runtime, route/API scaffolds, and tests. | Run `npm run web:check` and route smoke on this branch. |
| Runtime content catalog | Done on branch | `apps/web/src/server/content/service.ts` now exports `RuntimeContentService` and `createRuntimeContentService()`. | Verify with web typecheck/test/build. |
| Published-only public catalog behavior | Done on branch | `searchPublishedContent()` filters status and visibility; tests cover draft/private exclusion. | Add API route tests in later phases. |
| Content service | Partial | `ContentService` provides create, update, workflow transition, search, entitlement, moderation, telemetry, and upsert helpers. | Add production authorization, pagination, full tier support, and runtime persistence tests. |
| In-memory repository | Done for local/test scope | `InMemoryContentRepository` implements the repository contract in memory. | Keep local/test only; avoid silent production persistence. |
| Firebase repository | Partial | Runtime Firestore adapter and Admin helper exist. | Add emulator-backed tests and production project evidence. |
| Firebase Admin Auth | Partial | `getFirebaseAdminAuth()` and server session token verification path exist. | Verify against configured Firebase project/session cookies or bearer ID tokens. |
| Firebase rules/indexes | Blocked | Rules/index files exist under `apps/web`, but final project/emulator evidence is not recorded here. | Add and run emulator tests, then record staging/prod deployment evidence. |
| Auth/RBAC foundation | Partial | `apps/web/src/server/auth/*` adds canonical roles, permissions, session parsing, and guards; tests cover core behavior. | Expand guards across all protected routes and wire real Firebase Auth in staging. |
| Admin seed route guard | Partial | Seed route accepts seed token or admin/internalAdmin session and fails closed otherwise. | Add route-level integration tests and deployed smoke. |
| Stripe | Not Started | Stripe checkout/webhook behavior is not implemented or verified. | Implement checkout/webhook signature verification and entitlement writes before enabling paid flows. |
| Dashboard/creator/admin UI | Partial | Public route shells exist; protected workflows are incomplete. | Implement guarded creator/admin workflows and tests. |
| Marketplace | Partial | Schemas, tier config, and public marketplace shell exist; no live checkout/gating. | Implement catalog gates, checkout, entitlements, and moderation. |
| Export system | Partial | SRT/export utilities and shell exist. | Implement API, queue/worker, Storage writes, downloads, and owner/admin guards. |
| Ecosystem integration contracts | Partial | Ecosystem schema/docs/check/test exist on this branch. | Have consuming URAI repos adopt and validate the shared contract. |
| Observability | Partial | Optional `SENTRY_DSN` env exists; live monitoring is not verified. | Add safe logging/alerts and record uptime/monitoring evidence. |
| Browser E2E / visual tests | Partial | Route smoke exists; full browser E2E/visual evidence is incomplete. | Add/verify Playwright browser flows and screenshots. |
| CI | Partial | Existing workflows need confirmation against this branch. | Run GitHub Actions and record CI URL/evidence. |
| Deployment to www.uraicontent.com | Blocked | No live deploy, DNS, SSL, monitoring, or rollback evidence in this pass. | Configure hosting/secrets, run deployed smoke, and record evidence. |

## Current Local Command Evidence

This branch was edited through the GitHub connector because the private repository is not checked out in the current Codex workspace. The following commands are required from CI or a local checkout before calling repo-side readiness:

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

## Anti-Fake Completion Rule

Do not mark deployment, DNS, SSL, Firebase production, Stripe, live monitoring, browser E2E, rollback, or post-deploy smoke complete unless there is real command output, commit SHA, deployed URL, provider evidence, and blocker status recorded in `docs/EVIDENCE_LOG.md` or release evidence.

## Launch Readiness Commands After Hosting Is Configured

```bash
curl -I https://www.uraicontent.com
curl -I https://uraicontent.com
curl https://www.uraicontent.com/api/health
curl https://www.uraicontent.com/api/version
npm run web:smoke:routes -- --base-url=https://www.uraicontent.com
```

These commands are not enough by themselves for GREEN status; Firebase, Stripe, monitoring, rollback, CI, browser E2E, and security evidence must also be present.
