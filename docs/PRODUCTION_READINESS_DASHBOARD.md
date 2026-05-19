# URAI Content Production Readiness Dashboard

Date: 2026-05-16
Repo: `LifeLoggerAI/urai-content`
Default branch: `main`

This dashboard is the single-glance status view for repo-side and production-side readiness.

Status key:

- **GREEN**: verified with evidence.
- **YELLOW**: partially implemented, local-only, or not fully verified.
- **RED**: missing, blocked, unsafe, or not verified.
- **N/A**: not applicable to this repo or launch lane, with evidence.

Final rule: no evidence means no GREEN.

## Executive status

| Area | Status | Why |
| --- | --- | --- |
| Repo identity | GREEN | `LifeLoggerAI/urai-content` on `main`. |
| Package architecture | GREEN/YELLOW | Root content package, schemas, contracts, validators, and seed systems exist; keep command evidence current per release SHA. |
| Web runtime scaffold | GREEN/YELLOW | `apps/web` runtime scaffold and route/API surfaces exist; production deployment evidence is missing. |
| Operational governance | GREEN | Audit, launch runbook, issue control, evidence template, maintainer checklist, PR template, issue templates, branch status, and CODEOWNERS exist. |
| CI live state | YELLOW | CI architecture exists, but each release still needs current run URL and status evidence. |
| Firebase production readiness | RED | Project, hosting target, rules, indexes, Auth, Storage, and staging/prod config not verified. |
| Auth/RBAC readiness | RED | Creator/admin/user role enforcement and fail-closed E2E evidence not verified. |
| Stripe/payment readiness | RED | Checkout, webhook verification, price IDs, entitlement writes, and idempotency not verified. |
| Export pipeline readiness | RED | Worker/queue, Storage artifacts, ownership checks, retries, and E2E not verified. |
| Browser E2E readiness | RED | Full browser E2E for public/auth/admin/creator/marketplace/export/mobile/SEO not verified. |
| Production deployment | RED | DNS, SSL, production URL, smoke output, monitoring, and rollback evidence missing. |

## Current release blockers

| Priority | Blocker | Owner | Next action | Evidence needed |
| --- | --- | --- | --- | --- |
| P0 | Hosting architecture undecided or unverified | Infra/Jacob | Choose Firebase Hosting + runtime layer, Cloud Run rewrites, Vercel, or other Next-compatible host | Provider decision, staging URL, deployment config |
| P0 | Firebase production target unverified | Firebase/backend | Confirm project ID, hosting site, Firestore DB, Storage bucket, Auth providers, service account/CI token | Provider screenshots/links, config files, emulator/staging test output |
| P0 | Secrets/env unverified | Infra/Jacob | Configure and verify provider/CI secrets | Secret names only, provider evidence, no secret values committed |
| P0 | Firestore/Storage rules unverified | Security/backend | Add/verify rules, indexes, and tests | Rules files, index config, emulator/staging test output |
| P0 | Auth/admin/creator fail-closed behavior unverified | Full stack/auth | Implement and test role/session guards | Unit/integration/E2E evidence |
| P0 | Production deployment evidence missing | Infra/Jacob | Deploy staging/production after all safety gates pass | Release SHA, CI URL, deployment URL, smoke output, rollback path |
| P1 | Stripe/payment system incomplete | Payments/full stack | Add checkout, webhook verification, entitlement writes | Stripe test evidence, webhook logs, entitlement records |
| P1 | Export pipeline incomplete | Backend/QA | Add APIs, worker/queue, Storage writes, downloads, retries | API tests, worker tests, cross-user denial tests, E2E |
| P1 | Browser E2E missing | QA/frontend | Add Playwright/Cypress coverage for launch flows | E2E run logs and artifacts |
| P1 | Observability missing | Infra/security | Add uptime, error monitoring, alerts, traces, rollback drill | Monitor URLs, sample alerts, rollback drill evidence |

## Launch lanes

| Lane | Status | Required next action |
| --- | --- | --- |
| Repo verification | YELLOW | Rerun `npm ci`, `npm run done`, `npm run web:install`, `npm run web:check`, attach logs/CI URL. |
| Runtime route QA | YELLOW | Attach route smoke, mobile QA, metadata/canonical, sitemap/robots, and deployed smoke evidence. |
| Firebase readiness | RED | Confirm project/hosting/Firestore/Storage/Auth and rules/indexes/tests. |
| Auth and RBAC | RED | Implement/test anonymous, user, creator, admin, forbidden, and server-side guard cases. |
| Stripe and entitlements | RED | Implement/test checkout, verified webhooks, idempotency, and entitlement writes. |
| Export pipeline | RED | Implement/test export create/status/download, worker, Storage, ownership checks, retries. |
| Observability | RED | Add uptime, error reporting, alerts, request IDs, dependency scan, rollback rehearsal. |
| Live deployment | RED | Deploy only after all stop rules pass; attach release SHA, deploy URL, smoke output, rollback proof. |

## Evidence links to attach per release

Use `docs/EVIDENCE_LOG_TEMPLATE.md` and attach:

```text
Commit SHA:
CI run URL:
Package command output:
Web command output:
Route smoke output:
E2E output:
Staging URL:
Production URL:
Firebase project evidence:
Firestore/Storage rules evidence:
Stripe evidence:
Monitoring evidence:
Rollback evidence:
Final status: RED / YELLOW / GREEN
```

## Stop rules

Stop and mark RED if any of these are true:

- Firebase project is uncertain.
- Hosting target is uncertain.
- Secrets are missing or unverified.
- CI fails without explicit owner-approved override.
- Firestore or Storage rules are missing or untested where applicable.
- Auth/admin routes fail open.
- Stripe checkout is reachable without verified configuration.
- Export artifacts can leak across users.
- Public APIs expose draft/private content.
- Production smoke tests fail.
- Rollback path is missing.

## Final production-readiness claim

Do not claim `urai-content` is production-ready until every P0 blocker is GREEN with evidence and every remaining P1 blocker has either a GREEN status or an explicit launch deferral signed off by the owner.
