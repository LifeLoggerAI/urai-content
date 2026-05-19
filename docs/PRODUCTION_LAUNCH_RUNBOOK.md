# URAI Content Production Launch Runbook

This runbook turns the remaining `urai-content` production launch work into an evidence-driven checklist.

Source of truth: `docs/IMPLEMENTATION_STATUS.md`, `DEPLOYMENT_BLOCKERS.md`, `docs/ROUTE_COVERAGE.md`, and `URAI_FINAL_COMPLETION_AUDIT.md`.

## Current launch position

`urai-content` is a TypeScript content-domain package with a standalone Next.js web runtime scaffold under `apps/web`.

Repo-side evidence currently supports:

- root package architecture
- canonical content validation
- package checks
- web runtime scaffold
- local web build/test/smoke path
- route/API scaffold inventory

Repo-side evidence does **not** yet support:

- live production deployment
- DNS/SSL completion
- Firebase production readiness
- Stripe readiness
- browser E2E readiness
- production monitoring readiness
- rollback readiness

## Launch lanes

### Lane 1 — Repo verification

Owner: Jacob / repo operator

Required evidence:

```bash
npm ci
npm run done
npm run web:install
npm run web:check
git status --short
```

GREEN only when:

- all commands pass on a clean checkout
- generated files are committed or intentionally unchanged
- CI passes on the same commit SHA
- command output or CI links are attached to the release record

### Lane 2 — Runtime route QA

Owner: Frontend / QA

Required local evidence:

```bash
npm run web:smoke:routes -- --base-url=http://127.0.0.1:3000
```

Required browser/E2E evidence:

- public route navigation
- mobile viewport coverage
- metadata/SEO basics
- 404 behavior
- CTA behavior
- marketplace safe state when Stripe is not configured
- export safe state when worker/storage is not configured

GREEN only when:

- public routes are covered by smoke or E2E
- protected routes fail closed when auth is missing
- no route exposes admin/dev-only controls publicly

### Lane 3 — Firebase readiness

Owner: Firebase / backend / security

Required decisions:

- Firebase project ID
- Firebase Hosting site or alternative host
- Firestore database
- Storage bucket
- Auth providers
- staging/prod separation
- service account or deployment token

Required evidence:

- `.firebaserc` or host configuration points to the approved project only
- Firestore rules committed or externally referenced
- Storage rules committed or externally referenced
- Firestore indexes committed or externally referenced
- emulator or staging rules tests pass
- no Firebase Admin initialization runs in browser code
- API endpoints redact provider status and never expose secrets

GREEN only when project IDs, rules, indexes, tests, and staging smoke evidence are attached.

### Lane 4 — Auth and RBAC

Owner: Auth / full stack

Required behavior:

- Firebase Auth sign-in/sign-out/session path
- dashboard requires authenticated user
- creator routes require creator role
- admin routes require admin role
- server-side authorization protects admin APIs
- role and entitlement checks fail closed
- audit events are emitted for privileged actions

GREEN only when unit/integration/E2E evidence covers anonymous, user, creator, admin, and forbidden cases.

### Lane 5 — Stripe and entitlements

Owner: Payments / full stack

Required decisions:

- Stripe account mode
- product IDs
- price IDs
- success URL
- cancel URL
- refund/support policy
- tax handling decision

Required behavior:

- checkout session creation only after config is present
- webhook signature verification
- entitlement writes from verified webhook only
- idempotent webhook handling
- safe unavailable UI when Stripe is not configured

GREEN only when checkout, webhook, entitlement persistence, and failure paths are tested.

### Lane 6 — Export pipeline

Owner: Backend / infra / QA

Required behavior:

- export create API
- export status API
- queue or worker execution
- SRT/export artifact generation
- Storage writes
- signed or authorized downloads
- failure/retry metadata
- user ownership checks

GREEN only when API tests, worker tests, storage access tests, and E2E export status coverage pass.

### Lane 7 — Observability

Owner: Infra / security / Jacob

Required behavior:

- uptime monitoring for staging and production
- Sentry or equivalent error reporting
- request IDs or trace IDs in logs
- Stripe webhook failure alerts
- export job failure alerts
- 5xx alert routing
- dependency/security scan schedule
- rollback rehearsal record

GREEN only when monitoring URLs, alert recipients, sample events, and rollback evidence are attached.

### Lane 8 — Live deployment

Owner: Infra / Jacob

Required preflight:

```bash
npm run done
npm run web:check
```

Required live smoke:

```bash
curl -I https://www.uraicontent.com
curl -I https://uraicontent.com
curl https://www.uraicontent.com/api/health
curl https://www.uraicontent.com/api/version
npm run web:smoke:routes -- --base-url=https://www.uraicontent.com
```

GREEN only when:

- release SHA recorded
- deployment URL recorded
- CI run URL recorded
- smoke output recorded
- rollback SHA or rollback procedure recorded
- DNS and SSL verified
- production-impact risks documented

## Release evidence template

```text
Date:
Release owner:
Repo:
Branch:
Commit SHA:
CI run URL:
Package check result:
Web check result:
Browser E2E result:
Staging URL:
Production URL:
Firebase project:
Hosting target:
Firestore rules evidence:
Storage rules evidence:
Stripe mode:
Monitoring status:
Smoke command output:
Rollback SHA/procedure:
Open blockers:
Final launch status: RED / YELLOW / GREEN
```

## Stop rules

Stop the launch and mark RED if any of the following are true:

- Firebase project is uncertain
- hosting target is uncertain
- production secrets are missing or unverified
- CI fails without explicit owner-approved override
- Firestore or Storage rules are untested where applicable
- auth/admin routes do not fail closed
- Stripe checkout is reachable without verified configuration
- export downloads can be accessed cross-user
- production smoke tests fail
- rollback path is missing

## Final rule

No production launch claim is valid without attached evidence. Screenshots, command logs, CI URLs, provider URLs, deployed URLs, and commit SHAs are acceptable evidence. Verbal confirmation alone is not enough.
