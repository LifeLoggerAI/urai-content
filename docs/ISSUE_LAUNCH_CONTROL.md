# URAI Content Issue Launch Control

This document maps the open GitHub issue backlog to the production launch gates for `urai-content`.

Use this as the execution control layer between:

- `URAI_FINAL_COMPLETION_AUDIT.md`
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/ROUTE_COVERAGE.md`
- `DEPLOYMENT_BLOCKERS.md`
- `docs/PRODUCTION_LAUNCH_RUNBOOK.md`

## Status rules

- **GREEN** means the issue/gate is complete with evidence.
- **YELLOW** means partially implemented or locally scaffolded but missing live/provider/E2E evidence.
- **RED** means missing, unsafe, blocked, or not verified.
- **BLOCKED** means owner input, credentials, provider setup, or architecture decision is required before implementation can safely continue.

No issue should be closed as complete unless the acceptance criteria have matching command output, CI links, deployed URLs, source files, or provider evidence.

## Launch issue matrix

| Issue / gate | Launch lane | Current status | Evidence required to close | Owner |
| --- | --- | --- | --- | --- |
| #5 — Typed content engine, live adapter boundaries, generation contracts | Repo verification / package contract | YELLOW | package exports verified, adapter boundaries documented, generation contracts tested, package checks pass | Repo/package |
| #9 — Firestore `ContentRepository` adapter | Firebase readiness | RED/BLOCKED | server-only adapter, emulator tests, rules/index docs, staging proof, no browser Admin SDK | Backend/Firebase |
| #10 — Core runtime APIs | Runtime API QA | YELLOW | health/version/catalog/detail contract tests, 200/400/403/404 behavior, deployed smoke | Backend/QA |
| #11 — Public website routes and SEO | Runtime route QA | YELLOW | route smoke, metadata, canonical URLs, sitemap, mobile QA, deployed URL proof | Frontend/QA |
| #12 — Auth, creator, admin, marketplace, payments | Auth/RBAC + Stripe | RED/BLOCKED | Firebase Auth, role guards, creator/admin flows, marketplace gates, Stripe test checkout/webhooks, E2E | Full stack |
| #13 — Export pipeline, QA suite, deployment smoke tests | Export pipeline + E2E | RED/BLOCKED | export APIs, worker, Storage artifacts, retries, ownership checks, smoke/E2E artifacts | Backend/QA |
| #14 — Production deployment, DNS, launch evidence | Live deployment | RED/BLOCKED | staging/prod URLs, DNS, SSL, env/secrets, release SHA, CI URL, smoke output, rollback SHA | Infra/Jacob |
| #15 — Monitoring, alerts, hardening | Observability | RED/BLOCKED | uptime checks, Sentry/equivalent, webhook/export alerts, request IDs, dependency checks, rollback rehearsal | Infra/Security |

## Dependency order

1. **Confirm launch architecture**
   - Decide final host: Firebase Hosting + Cloud Run/functions rewrites, Vercel, or another Next-compatible host.
   - Confirm whether Firebase remains the system of record for content/runtime state.

2. **Lock environment configuration**
   - Confirm staging and production Firebase projects.
   - Confirm all required env/secrets.
   - Ensure secrets are configured in provider/CI, not committed.

3. **Finish persistence and security**
   - Implement or finalize Firestore repository adapter.
   - Add/verify Firestore rules, Storage rules, and indexes.
   - Run emulator or staging rules tests.

4. **Finish runtime API contracts**
   - Harden health/version/catalog/detail/status APIs.
   - Add success and failure contract tests.
   - Ensure private/draft/admin data is never public.

5. **Finish public web route QA**
   - Final copy.
   - SEO metadata.
   - canonical URLs.
   - sitemap/robots.
   - mobile viewport QA.
   - local route smoke.
   - deployed route smoke.

6. **Finish protected runtime systems**
   - Firebase Auth/session.
   - dashboard guard.
   - creator/admin role claims.
   - server-side API authorization.
   - fail-closed behavior.

7. **Finish payments and entitlements**
   - Stripe checkout.
   - verified webhook handling.
   - idempotent entitlement writes.
   - marketplace gating.
   - safe disabled state when config is absent.

8. **Finish exports**
   - create/status APIs.
   - queue/worker.
   - artifact generation.
   - Storage writes.
   - authorized downloads.
   - retry/failure metadata.

9. **Finish E2E and observability**
   - Browser E2E for public/auth/admin/creator/marketplace/export/mobile/SEO.
   - uptime monitoring.
   - error monitoring.
   - alerts.
   - traces/request IDs.

10. **Launch and evidence capture**
    - Deploy staging.
    - Run staging smoke.
    - Deploy production.
    - Run production smoke.
    - Record release SHA, CI URL, deployment URL, smoke output, rollback SHA.

## Issue close checklist

Before closing any launch issue:

```text
Issue:
Owner:
Commit SHA:
CI run URL:
Commands run:
Test output:
Deployed URL, if applicable:
Provider evidence, if applicable:
Docs updated:
Remaining risk:
Final status: GREEN / YELLOW / RED
```

## GitHub issue update template

```md
## Launch-control update

Status: RED / YELLOW / GREEN

### Evidence
- Commit SHA:
- CI run:
- Commands:
- Logs/artifacts:
- Deployed URL:

### Completed
- [ ]

### Remaining blockers
- [ ]

### Next action

### Owner
```

## Stop rules

Do not close or mark GREEN if:

- evidence is only verbal
- deployment URL is missing for deployment issues
- CI is failing without documented override
- secrets are unknown
- Firebase project is unknown
- auth/admin routes fail open
- Stripe webhook is unverified
- export artifacts are not ownership-protected
- rollback path is missing

## Final rule

The issue tracker is not a wish list. It is the launch control surface. Every issue must converge on evidence, ownership, and a clear RED/YELLOW/GREEN state.
