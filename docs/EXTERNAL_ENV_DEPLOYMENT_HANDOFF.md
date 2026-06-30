# External Environment Deployment Handoff

Date: 2026-06-30
Repo: `LifeLoggerAI/urai-content`
Current source status: repo-side DONE / external-env blocked
Current blocker tracker: https://github.com/LifeLoggerAI/urai-content/issues/61
Latest source handoff commit before this document: `d91b0f0d1e77fe665012ee372ca890a5576f2bfb`

## Purpose

This document is the one-place handoff for the remaining work needed to turn `urai-content` from repo-side complete into deployed production-live READY.

Do not use this document to claim production readiness by itself. Production-live READY requires attached evidence for deployment, provider runtime, smoke tests, monitoring, and rollback.

## Current truth

- Root package/library: implemented and repo-verified.
- Web runtime scaffold: implemented and repo-verified.
- Deployment: blocked until hosting/DNS/SSL are configured.
- Firebase/Auth/Firestore/Storage: blocked until real provider env and deployed rules are attached.
- Stripe/payments: not launch-ready unless explicitly implemented and verified.
- Export/media: not launch-ready unless explicitly implemented and verified.
- Observability/rollback: blocked until configured and smoke-tested.

## Local verification before deployment

Run from repository root:

```bash
npm ci
npm run check
npm run web:install
npm run web:check
npm run web:smoke:routes -- --base-url=http://127.0.0.1:3000
```

Expected result before deployment:

- root lint/typecheck/content validation/tests/build pass
- governance and secret scans pass
- web typecheck/lint/tests/build pass
- local route smoke passes

## Required environment inventory

Attach the exact env source in the release evidence. Do not paste secret values into GitHub issues, PRs, docs, or logs.

### Root/provider evidence checks

The repo contains these verification commands:

```bash
npm run check:provider-evidence
npm run check:observability
npm run check:alerts
npm run check:release-env
```

### Firebase/Auth/Data proof required

Evidence must show:

- Firebase project ID used for staging/production
- Auth provider configured
- user, creator, and admin/operator role claims verified
- Firestore rules deployed
- Storage rules deployed
- required indexes/buckets documented
- provider-backed content/catalog reads verified
- provider-backed creator submission create/list/read verified
- admin/operator moderation write verified with role guard

### Hosting/DNS/SSL proof required

Evidence must show:

- hosting provider
- deploy ID
- deployed URL
- custom domain, if used
- DNS target records
- SSL active
- release commit SHA visible in runtime

## Deployment command template

No hosting provider is committed in this repo yet. Choose one approved provider and record it in issue #61 before marking GREEN.

### Generic Next.js staging deploy flow

```bash
npm ci
npm run check
npm run web:install
npm run web:check
npm run web:build
# provider-specific deploy command goes here
```

Examples of provider-specific commands that may be used only after the provider is intentionally selected:

```bash
# Vercel example, if Vercel is selected and secrets are configured outside git
npx vercel --prod --cwd apps/web

# Firebase Hosting example, if Firebase Hosting is selected and configured outside git
npx firebase deploy --only hosting,firestore:rules,storage --project <project-id>
```

Do not add provider secrets to the repository.

## Deployed smoke commands

After deployment, run and attach output:

```bash
export URAI_CONTENT_BASE_URL=<deployed-url>

curl -I "$URAI_CONTENT_BASE_URL/"
curl -I "$URAI_CONTENT_BASE_URL/content"
curl "$URAI_CONTENT_BASE_URL/api/health"
curl "$URAI_CONTENT_BASE_URL/api/version"
npm run web:smoke:routes -- --base-url="$URAI_CONTENT_BASE_URL"
npm run smoke:production -- --base-url="$URAI_CONTENT_BASE_URL"
cd apps/web && PLAYWRIGHT_SKIP_WEB_SERVER=1 URAI_CONTENT_BASE_URL="$URAI_CONTENT_BASE_URL" npm run e2e
```

Protected/admin/operator routes must be verified as blocked without auth and allowed only with the correct role claim. Do not paste tokens or cookies into evidence.

## Rollback proof commands

After at least one successful deployment, record the previous deploy URL or rollback target and run:

```bash
npm run smoke:rollback -- --base-url="$URAI_CONTENT_BASE_URL" --rollback-url=<rollback-url>
```

Attach:

- deploy ID
- rollback target ID or URL
- command output
- timestamp
- commit SHA

## Evidence package required to close issue #61

Attach all of the following to issue #61 or the release proof folder:

- deploy URL
- deploy ID
- commit SHA
- timestamp
- provider name
- DNS/SSL proof
- Firebase project proof without secrets
- Auth role proof without tokens
- Firestore/Storage rules deployment proof
- route smoke output
- production smoke output
- browser E2E output or artifact
- observability check output
- alert test output
- rollback smoke output
- final privacy/terms/public-copy approval note

## Final rule

This repo may remain marked:

`repo-side DONE / external-env blocked`

It may only move to:

`production-live READY`

when issue #61 is closed with the evidence package above.
