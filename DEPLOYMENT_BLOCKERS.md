# Deployment Blockers

This file prevents false completion claims for `urai-content`.

## Current truth

`urai-content` is currently a TypeScript content package/library. It is not yet a standalone deployed web application. The package can be consumed by URAI app/admin/backend deployments, but it does not itself initialize Firebase Admin, run Firebase Hosting, or provide a Next.js public website.

## Blockers to live deployment at www.uraicontent.com

### 1. Standalone web surface missing

A deployable web surface must exist before `www.uraicontent.com` can go live.

Acceptable options:

- Create a separate consuming app such as `urai-content-web`.
- Or convert this repo to a workspace with:
  - `packages/content` for the current package
  - `apps/web` for the standalone Next/Firebase site

### 2. Firebase project configuration required

The deployment owner must provide or confirm:

- Firebase project ID
- Firebase Hosting site ID
- Firestore database target
- Storage bucket
- Auth providers
- service account or CI deployment token
- production/staging environment separation

### 3. DNS access required

The deployment owner must configure DNS for:

- `uraicontent.com`
- `www.uraicontent.com`

Required behavior:

- `uraicontent.com` redirects to `www.uraicontent.com`
- canonical site URL is `https://www.uraicontent.com`

### 4. Runtime Firebase adapter required

The consuming runtime must implement the `ContentRepository` contract using Firebase Admin SDK or equivalent server-side infrastructure.

Required behaviors:

- public reads only for published public content
- authenticated reads for user/tier-specific content
- creator submission writes for creators
- admin/moderator writes for approval workflows
- entitlement checks server-side
- audit/provenance records server-side

### 5. Stripe configuration required for paid tiers

To activate paid content and creator marketplace flows, the owner must provide:

- Stripe secret key
- Stripe webhook signing secret
- price IDs for all paid tiers
- success/cancel URLs
- tax/refund/support policy decisions

Until configured, marketplace checkout must remain in safe mock/dev mode.

### 6. E2E browser environment required

This package can run package-level tests, but true website E2E requires a deployed or locally served web app.

Required:

- Playwright or Cypress setup in the consuming web app
- smoke tests for public pages
- auth/dev mock flow
- admin/creator route tests
- export job tests
- marketplace gating tests

## What can be completed inside this repo

- package schemas
- content registries
- canonical content JSON
- validator scripts
- seed/demo content
- content-service workflow rules
- repository contracts
- integration contracts
- deployment docs
- roadmap docs
- package tests
- package build
- package CI

## What cannot be honestly claimed from this repo alone

Do not claim:

- `www.uraicontent.com` is live
- Firebase Hosting is deployed
- Stripe is wired
- production Firestore rules are deployed
- browser E2E tests pass against the standalone website
- admin/creator UI exists

unless those systems have actually been implemented and verified in a runtime app/deployment.

## Required owner actions

1. Decide whether `urai-content` remains a package with a separate `urai-content-web` app, or becomes a monorepo.
2. Provide Firebase project and hosting details.
3. Provide DNS access for `uraicontent.com` and `www.uraicontent.com`.
4. Provide Stripe test/live keys when monetization should be activated.
5. Run deployment from an environment with npm registry access, GitHub write access, Firebase CLI access, and DNS permissions.

## Final rule

Every future completion claim must map to a real file change, command output, CI run, or live deployment URL.
