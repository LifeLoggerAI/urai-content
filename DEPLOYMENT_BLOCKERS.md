# Deployment Blockers

This file prevents false completion claims for `urai-content`.

## Current truth

`urai-content` is now a package-plus-runtime repository:

- the root TypeScript package remains the canonical content/domain package for the URAI ecosystem
- `apps/web` is a standalone Next.js runtime scaffold for the public URAI Content site
- root package checks are covered by `npm run done`
- web runtime checks are covered by `npm run web:check`
- local route smoke is covered by `npm run web:smoke:routes`
- local public-route browser smoke is covered by `npm run web:e2e`
- GitHub Actions runs package validation, web validation, local web route smoke, and isolated browser-smoke coverage

This is not the same as a live production launch. `www.uraicontent.com` is not considered deployed until live hosting, DNS, SSL, provider runtime evidence, secrets, post-deploy smoke, monitoring, and rollback evidence are recorded.

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
- deployment token or provider-side deploy identity
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

### 5. Payment configuration required for paid tiers

To activate paid content and creator marketplace flows, the owner must provide provider-backed payment and entitlement proof.

Until configured, marketplace checkout must remain disabled, gated, or safe dev-only.

### 6. Browser and deployed-route evidence required

CI performs local route smoke and repo-side public-route browser smoke against a started Next server. Full deployed browser E2E is still required for production launch.

Current repo-side evidence:

- local route smoke is green in CI
- isolated browser-smoke is green in CI
- full deployed browser E2E/visual evidence is not attached

Required before live launch:

- public route tests against the deployed production URL
- mobile viewport tests against the deployed production URL
- auth/dev mock or provider-backed auth flow evidence
- admin/creator route tests
- export job tests
- marketplace gating tests
- deployed URL smoke tests after staging/prod launch
- screenshots or artifacts for launch-critical browser flows

### 7. Monitoring and alerting required

Production cannot be called hardened until monitoring exists.

Required:

- uptime monitoring for staging and production
- frontend/server error monitoring
- alert routing for 5xx spikes, auth/admin anomalies, payment webhook failures, and export job failures
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
- local browser smoke tests
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
- paid payment flows are wired
- production Firestore/Storage rules are deployed
- browser E2E tests pass against the live standalone website
- admin/creator/payment/export flows are production-complete

unless those systems have actually been implemented and verified with command output, provider evidence, and URLs.

## Required owner actions

1. Choose the production host for `apps/web`.
2. Provide Firebase project and hosting details if Firebase is selected.
3. Provide DNS access for `uraicontent.com` and `www.uraicontent.com`.
4. Provide payment provider test/live configuration when monetization should be activated.
5. Configure staging/prod environment variables and deployment identity.
6. Run deployment from an environment with npm registry access, GitHub write access, hosting provider access, and DNS permissions.
7. Attach smoke-test output and rollback evidence to issue #14 or the release evidence log.

## Required pre-launch commands

Repo/local gates:

```bash
npm ci
npm run done
npm run web:install
npm run web:check
npm run web:smoke:routes -- --base-url=http://127.0.0.1:3000
npm run web:e2e
```

Live gates after deployment:

```bash
curl -I https://www.uraicontent.com
curl -I https://uraicontent.com
curl https://www.uraicontent.com/api/health
curl https://www.uraicontent.com/api/version
npm run web:smoke:routes -- --base-url=https://www.uraicontent.com
URAI_CONTENT_BASE_URL=https://www.uraicontent.com npm run web:e2e
```

## Final rule

Every future completion claim must map to a real file change, command output, CI run, or live deployment URL.
