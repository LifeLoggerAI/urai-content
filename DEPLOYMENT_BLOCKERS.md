# Deployment Blockers

This file prevents false completion claims for `urai-content`.

## Current truth

`urai-content` is now a package-plus-runtime repository:

- the root TypeScript package remains the canonical content/domain package for the URAI ecosystem
- `apps/web` is a standalone Next.js runtime scaffold for the public URAI Content site
- root package checks are covered by `npm run done`
- web runtime checks are covered by `npm run web:check`
- local route smoke is covered by `npm run web:smoke:routes`
- GitHub Actions now runs package validation, web validation, and local web route smoke coverage

This is not the same as a live production launch. `www.uraicontent.com` is not considered deployed until live hosting, DNS, SSL, secrets, and post-deploy smoke evidence are recorded.

## Blockers to live deployment at www.uraicontent.com

### 1. Hosting target and environment required

A deployable web surface exists in `apps/web`, but the production hosting target still must be selected/configured.

Acceptable options:

- Firebase Hosting with a Next-compatible runtime layer where needed
- Cloud Run behind Firebase Hosting rewrites
- Vercel or another Next-compatible host

Required evidence before closing this blocker:

- staging deployment URL
- production deployment URL
- release commit SHA
- rollback commit SHA or rollback procedure
- CI run URL
- smoke-test output

### 2. Firebase project configuration required

The deployment owner must provide or confirm:

- Firebase project ID
- Firebase Hosting site ID, if Firebase is selected
- Firestore database target
- Storage bucket
- Auth providers
- service account or CI deployment token
- production/staging environment separation
- Firestore rules and indexes
- Storage rules

### 3. DNS access required

The deployment owner must configure DNS for:

- `uraicontent.com`
- `www.uraicontent.com`

Required behavior:

- `uraicontent.com` redirects to `www.uraicontent.com`
- canonical site URL is `https://www.uraicontent.com`
- SSL is valid for apex and www

### 4. Runtime Firebase adapter and rules required

The web runtime has repository/API scaffolding, but production persistence and security rules still need final verification.

Required behaviors:

- public reads only for published public content
- authenticated reads for user/tier-specific content
- creator submission writes for creators
- admin/moderator writes for approval workflows
- entitlement checks server-side
- audit/provenance records server-side
- emulator or staging tests for rules and repository behavior

### 5. Stripe configuration required for paid tiers

To activate paid content and creator marketplace flows, the owner must provide:

- Stripe secret key
- Stripe webhook signing secret
- price IDs for all paid tiers
- success/cancel URLs
- tax/refund/support policy decisions

Until configured, marketplace checkout must remain in safe mock/dev mode.

### 6. E2E browser environment required

CI now performs local route smoke coverage against a started Next server. Full browser E2E is still required for production launch.

Required:

- Playwright or Cypress setup
- public route tests
- mobile viewport tests
- auth/dev mock flow
- admin/creator route tests
- export job tests
- marketplace gating tests
- deployed URL smoke tests after staging/prod launch

### 7. Monitoring and alerting required

Production cannot be called hardened until monitoring exists.

Required:

- uptime monitoring for staging and production
- Sentry or equivalent for frontend/server errors
- alert routing for 5xx spikes, auth/admin anomalies, Stripe webhook failures, and export job failures
- rollback drill evidence
- operational runbook

## What can be completed inside this repo

- package schemas
- content registries
- canonical content JSON
- validator scripts
- seed/demo content
- content-service workflow rules
- repository contracts
- integration contracts
- public web route shells
- route/API smoke scripts
- deployment docs
- roadmap docs
- package tests
- package build
- web runtime tests/build
- package and web CI

## What cannot be honestly claimed from this repo alone

Do not claim:

- `www.uraicontent.com` is live
- DNS is configured
- SSL is valid
- Firebase Hosting/Cloud Run/Vercel production is deployed
- Stripe is wired
- production Firestore/Storage rules are deployed
- browser E2E tests pass against the live standalone website
- admin/creator/payment/export flows are production-complete

unless those systems have actually been implemented and verified with command output, provider evidence, and URLs.

## Required owner actions

1. Choose the production host for `apps/web`.
2. Provide Firebase project and hosting details if Firebase is selected.
3. Provide DNS access for `uraicontent.com` and `www.uraicontent.com`.
4. Provide Stripe test/live keys when monetization should be activated.
5. Configure staging/prod environment variables and secrets.
6. Run deployment from an environment with npm registry access, GitHub write access, hosting provider access, and DNS permissions.
7. Attach smoke-test output and rollback evidence to issue #14.

## Required pre-launch commands

Repo/local gates:

```bash
npm ci
npm run done
npm run web:install
npm run web:check
npm run web:smoke:routes -- --base-url=http://127.0.0.1:3000
```

Live gates after deployment:

```bash
curl -I https://www.uraicontent.com
curl -I https://uraicontent.com
curl https://www.uraicontent.com/api/health
curl https://www.uraicontent.com/api/version
npm run web:smoke:routes -- --base-url=https://www.uraicontent.com
```

## Final rule

Every future completion claim must map to a real file change, command output, CI run, or live deployment URL.
