# URAI Content Production Lock Audit

Date: 2026-06-30
Repo: LifeLoggerAI/urai-content
Default branch: main
Verified main commit: 9e86ad20b4e71d7403716c22476f0cccdc62917f
Verdict: PARTIAL / NOT READY FOR PUBLIC PRODUCTION LAUNCH
Readiness score: 62/100

## Scope

This audit inspected the repository as a content runtime/publishing/export/media system. It verifies what is real in repo code, what is partial, what is not started, and what must remain gated until provider-backed deployment evidence exists.

## Executive verdict

URAI Content is a real repo-side content domain package plus a Next.js runtime scaffold. It is not merely a static fake dashboard. It includes content schemas, validators, typed repository interfaces, canonical JSON content, a runtime API surface, Firebase Admin detection, Firestore repository adapter code, RBAC helpers, creator submission APIs, admin moderation APIs, storage/firestore rules, tests, and launch governance docs.

It is not production-ready as a live publishing/export/media system. Production deployment, Firebase project/rules deployment proof, DNS/SSL, provider secrets, observability, rollback, paid entitlement/payment flows, export workers/artifacts, upload/media validation, and deployed browser E2E evidence remain missing or explicitly blocked.

## Access and repo identity

- Repository access: confirmed.
- Permissions available to this audit session: admin, maintain, pull, push, triage.
- Repository visibility: public.
- Default branch: main.
- Main commit verified: 9e86ad20b4e71d7403716c22476f0cccdc62917f.

## What is real

### Root content package

Real repo-side package functionality exists:

- TypeScript package build scripts.
- Zod content schemas.
- Content workflow service with create, update, workflow transition, search, entitlement checks, moderation logging, telemetry logging, prompt/story/ritual/marketplace/export upserts.
- Canonical content registry and validation scripts.
- Seed/check scripts.
- Governance/secret/ecosystem checks.

Status: REAL repo-side package foundation.
Production status: PARTIAL until integrated and provider-verified in deployed runtime.

### Web runtime scaffold

A standalone Next.js app exists under apps/web with scripts for dev, build, start, lint, typecheck, tests, route smoke, and Playwright E2E.

Status: REAL scaffold.
Production status: PARTIAL because deployed URL/DNS/SSL/smoke/monitoring/rollback proof is missing.

### Public catalog/content API

Implemented:

- /api/catalog
- /api/content/[[...slug]]
- canonical JSON fallback for public reads
- Firestore-ready path when Firebase Admin is configured

Status: REAL for public canonical JSON reads.
Production status: PARTIAL because Firestore-backed browsing and deployed proof remain pending.

### Creator submissions

Implemented API surface:

- GET /api/creator/submissions
- POST /api/creator/submissions
- GET /api/creator/submissions/[id]

Implemented safety:

- request validation with Zod
- creator role checks
- owner-scope checks
- production writes disabled when Firebase Admin is not configured
- in-memory preview writes allowed only outside production

Status: REAL API foundation.
Production status: PARTIAL because Firebase-backed deployed writes and browser flow proof are missing.

### Admin moderation / queue

Implemented API surface:

- GET /api/admin/creator-submissions
- GET /api/admin/creator-submissions/[id]
- POST /api/admin/creator-submissions/[id]/moderate
- POST /api/admin/seed/canonical-content

Implemented safety:

- admin role checks
- moderation decisions logged through repository interface
- seed endpoint requires admin session or configured seed token
- seed endpoint refuses writes if Firebase Admin is not configured

Status: REAL API foundation.
Production status: PARTIAL/BLOCKED until provider-backed auth, claims, Firestore, audit proof, and deployed tests exist.

### Firebase/Firestore adapter and rules

Implemented:

- Firebase Admin environment parsing.
- Firebase Admin app/db/auth initialization helpers.
- Firestore repository adapter for content items, versions, moderation queue, publishing releases, telemetry events, entitlements, narrator prompts, story templates, ritual templates, marketplace items, creator submissions, export templates.
- firestore.rules and storage.rules with role/owner/public boundaries.

Status: REAL code and rules artifacts.
Production status: BLOCKED until provider project, deployed rules/indexes/storage/auth proof exist.

## What is partial

| Area | Status | Why |
| --- | --- | --- |
| Public site routes | Partial | Route shells and local coverage exist, but final deployed proof and browser E2E are missing. |
| Public content rendering | Partial | Canonical JSON content can render; Firestore-backed live content browsing remains pending. |
| Creator workflow | Partial | API writes exist with auth/owner checks, but deployed Firebase persistence and browser UX proof are missing. |
| Admin moderation | Partial | Server API exists with admin guard, but deployed admin role claims, UI/browser proof, and operational audit proof are missing. |
| Publishing workflow | Partial | Package service supports workflow transitions and release logging, but no fully deployed admin publishing UI/E2E proof. |
| Entitlements | Partial | Types/service checks/rules exist; Stripe/payment/provider entitlement writes are missing. |
| Telemetry | Partial | Telemetry contracts/repository methods exist; privacy-safe deployed analytics endpoint/dashboard proof missing. |
| Firebase readiness | Partial/Blocked | Adapter/rules exist; project deployment proof and emulator/staging proof missing. |
| CI/local checks | Partial | Scripts and tests exist, but this audit did not run npm locally due no networked clone/npm install in the current execution environment. |

## What is not started or not production-implemented

| Area | Status | Notes |
| --- | --- | --- |
| Live production deployment | Not ready | No DNS/SSL/deployed smoke/rollback evidence verified in this audit. |
| Export pipeline | Not started/blocked | Export templates exist, but no worker/storage artifact/create-status-download E2E verified. |
| Media pipeline/upload validation | Not started/blocked | Storage rules exist, but no full media processor/upload validator/virus scan/type-size checks verified. |
| Paid checkout | Not started/blocked | No provider-backed Stripe checkout/webhook/entitlement proof. |
| Full creator/admin UI | Blocked/partial | API foundations exist; protected browser flows and deployed role proof missing. |
| Monitoring/alerting | Blocked | No uptime/error/alert/rollback drill proof attached here. |
| Data deletion/export user controls | Not verified | Privacy-facing controls are not verified in this repo audit. |

## Mock/demo/fake surface controls

The repo mostly avoids fake production claims. Existing docs explicitly state:

- production launch is blocked until provider and deployment evidence exists;
- canonical JSON fallback is used when Firebase Admin is not configured;
- production writes are disabled without Firebase Admin;
- marketplace checkout/payment/export flows must remain gated until wired.

Required ongoing rule: any public page or dashboard that displays unavailable publishing/export/admin/payment/media capabilities must clearly label them as preview, scaffold, unavailable, or blocked, not live.

## Security/privacy findings

### Strong controls found

- Server-side RBAC helper functions exist.
- Production header auth is disabled unless URAI_ENABLE_HEADER_AUTH=1.
- Bearer token Firebase verification is attempted only when Firebase Admin is configured.
- Production persistence writes fail closed without Firebase Admin.
- Firestore rules restrict public reads to published/public content and restrict creator/admin writes.
- Storage rules restrict creator submissions, exports, licenses, admin paths, and default deny all other paths.

### Risks / blockers

- Header-based auth must never be enabled in public production unless behind a trusted identity proxy that strips spoofed headers.
- Firestore rules and app collection names must be reconciled before production: app code uses userContentEntitlements, while firestore.rules contains userEntitlements. This may create entitlement access gaps or rule mismatch unless corrected/verified.
- Root package creatorSubmissionSchema uses pending/accepted/rejected and requires contentItemId/notes, while web runtime creator submission API creates submitted/approved/rejected/changes_requested style records with title/body. Runtime uses loose Record types, so schema drift must be resolved before calling creator submissions production canonical.
- Firebase Admin, Firestore rules, Storage rules, Auth custom claims, and provider deployment have not been proven in a real staging/prod environment.
- Export/media pipelines require file validation, ownership, retention/deletion, malware/content scanning decision, and download authorization proof.

## Build/test/deploy proof status

### Script inventory found

Root scripts include lint, typecheck, tests, build, content validation, seed checks, production smoke, rollback smoke, observability checks, governance checks, secret checks, web install/dev/typecheck/test/build/check/e2e/smoke routes, and a blocked deploy script.

Web scripts include dev, build, start, lint, typecheck, tests, route smoke, Playwright E2E, and check.

### Executed in this audit

- GitHub repo metadata lookup: PASS.
- main vs main comparison: PASS, identical, commit 9e86ad20b4e71d7403716c22476f0cccdc62917f.
- Source inspection: PASS for package, README, runtime service, Firebase env/admin, RBAC, content APIs, creator/admin APIs, Firestore adapter, rules, route docs, readiness docs, blockers docs, and route tests.

### Not executed in this audit

- npm ci
- npm run lint
- npm run typecheck
- npm test
- npm run build
- npm run web:install
- npm run web:check
- npm run web:smoke:routes
- npm run web:e2e
- live deployed curl/smoke checks

Reason: current execution environment could not clone GitHub over network, so npm install/build/test execution was not possible here. These must be run from a networked local/CI environment and attached to this folder or docs/EVIDENCE_LOG.md.

## Blockers

### P0

1. Attach current CI/local command output for root and web checks.
2. Deploy staging URL and record release SHA.
3. Configure Firebase Admin/Firestore/Storage/Auth custom claims in staging.
4. Deploy and test firestore.rules and storage.rules against emulator/staging.
5. Run route smoke and browser E2E against deployed staging.
6. Prove admin/creator forbidden/allowed flows with provider-backed auth.
7. Attach production URL, DNS, SSL, smoke, monitoring, and rollback evidence before public launch.

### P1

1. Resolve schema drift between root creatorSubmissionSchema and web runtime creator submissions.
2. Resolve collection naming mismatch risk around userContentEntitlements vs userEntitlements.
3. Add or verify export create/status/download worker and storage artifact lifecycle.
4. Add media upload validation and ownership checks.
5. Add observability: uptime, error reporting, alert routing, request IDs.

### P2

1. Complete protected creator/admin UI flows.
2. Complete marketplace and entitlement read/write proof.
3. Add deployment screenshots/artifacts to evidence log.
4. Add privacy/data export/deletion route integration if this repo owns any content data controls.

### P3

1. Polish public copy, SEO metadata, Open Graph, sitemap/robots host behavior.
2. Add visual regression/mobile viewport evidence.
3. Link cross-repo contracts to admin, analytics, privacy, storytime, studio, jobs, and marketing repos.

## Completion plan to 100%

1. Freeze truth labels: keep all incomplete public/admin/export/payment/media surfaces gated or marked preview.
2. Run root gates: npm ci, npm run lint, npm run typecheck, npm test, npm run build, npm run check.
3. Run web gates: npm run web:install, npm run web:check, npm run web:smoke:routes, npm run web:e2e.
4. Fix any failing tests/build/type issues.
5. Resolve schema and collection mismatches.
6. Configure Firebase staging: project, service account, Firestore, Storage, Auth providers/custom claims, rules, indexes.
7. Seed canonical content into staging with dry-run and real-run evidence.
8. Verify API lifecycle: create creator submission, persist, read owner-scoped, admin list, admin moderate, moderation log persisted.
9. Add publishing lifecycle proof: draft/review/approved/published/archive with version and release logs.
10. Add export lifecycle proof: create job, process worker, write artifact, read status, download owned artifact, deny unauthorized read, retry/fail audit.
11. Add media lifecycle proof: upload validation, storage path ownership, content type/size checks, delete/revoke.
12. Add payment/entitlement lifecycle proof if paid launch is in scope.
13. Deploy staging; run deployed smoke and Playwright against staging.
14. Deploy production; attach DNS, SSL, release SHA, smoke output, observability, rollback evidence.
15. Update readiness docs from RED/YELLOW to GREEN only when evidence is attached.

## Proof folder path

launch-proof/urai-content-production-lock/2026-06-30T000000-0500/

## Final verdict

FINAL VERDICT: PARTIAL — real content package/runtime/API foundations exist, but production launch is blocked until Firebase/provider deployment, auth/role proof, export/media/payment pipelines, deployed smoke/E2E, observability, and rollback evidence are completed.
