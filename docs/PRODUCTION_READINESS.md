# URAI Content Production Readiness

Date: 2026-06-29
Branch: `production-lock/urai-content-done-done`
Base: `main` at `c5be02363475d18eb5e6fb0c63f7c7c346160d12`

## Blunt Verdict

URAI Content is **not production-ready** and is **not verified live-working** yet.

This branch moves the repo closer to launch by making unsafe states honest and fail-closed, but it does not provide live deployment, Firebase project, Stripe, DNS, storage, browser E2E, monitoring, rollback, or post-deploy smoke proof.

Current status after this pass: **repo-side production-lock hardening / deployment-ready-in-progress**, not DONE DONE.

Estimated readiness after this branch, pending CI: **38/100**.

## What This Branch Hardens

- Secret scanning no longer ignores the entire `apps/web/tests/api-routes.test.ts` file.
- The known dummy test token is narrowly redacted using a short replacement before scanning.
- Runtime persistence now reports an explicit status object.
- Production without Firebase Admin credentials is degraded and non-writable.
- Creator submissions, creator detail reads, admin queue reads, and moderation writes fail closed with `503 persistence_not_configured` when production persistence is unavailable.
- `/api/health` reports degraded status when production persistence is unsafe.
- `/api/system/firebase` reports persistence mode, writable state, preview mode, and production-safe state without exposing secrets.
- Web Firestore and Storage rules now use the same canonical custom-claim model as server auth: `role` / `roles` with `admin` and `internalAdmin`.
- Demo asset manifests, content packs, licenses, and export jobs are downgraded from production-looking published/complete states to review/failed states where actual storage/checksum/export proof is missing.
- Production seed tests assert that unverified assets and fake completed exports cannot count as production proof.

## What Is Still Blocked

| Area | Blocker | Required Proof |
| --- | --- | --- |
| Live deployment | No verified hosting/DNS/SSL/deployed URL in this pass | URL, deploy command output, route smoke against deployed host |
| Firebase Admin | No verified production service credentials/project access in this pass | Secret manager config, `/api/system/firebase`, rules deploy, emulator/staging proof |
| Firestore/Storage rules | Rules normalized, not deployed or emulator-tested here | Firebase emulator test output and deployment log |
| Stripe | No keys/webhook endpoint/checkout proof | Checkout session test, webhook fixture, entitlement write/read |
| Protected UI | Creator/admin/dashboard UI still incomplete or gated | Browser E2E screenshots/logs and route smoke |
| Export/media | Export worker/storage/download pipeline not implemented/proven | Create/status/download tests, storage object, checksum, authorization proof |
| Monitoring | No Sentry/alerts/uptime proof | Alert test, dashboard URL, incident path |
| Rollback | No rollback target or smoke proof | Rollback command and post-rollback smoke output |

## Operator Deployment Checklist

Run these only with real provider access and secrets configured in CI/secret manager, never committed to the repo.

```bash
npm ci
npm run check
npm run done
npm run web:install
npm run web:check
npm run web:smoke:routes
npm test
```

Required environment variables:

```bash
NEXT_PUBLIC_SITE_URL=https://www.uraicontent.com
FIREBASE_PROJECT_ID=<real project id>
FIREBASE_CLIENT_EMAIL=<service account client email>
FIREBASE_PRIVATE_KEY=<service account private key from secret manager>
FIREBASE_STORAGE_BUCKET=<real bucket>
FIREBASE_HOSTING_SITE=www-uraicontent
URAI_CONTENT_ADMIN_UIDS=<comma-separated admin uids>
URAI_CONTENT_SEED_TOKEN=<secret seed token>
STRIPE_SECRET_KEY=<required before checkout goes live>
STRIPE_WEBHOOK_SECRET=<required before checkout goes live>
```

Firebase proof commands:

```bash
firebase use <production-or-staging-project>
firebase emulators:exec --only firestore,storage "npm run web:check"
firebase deploy --only firestore:rules,firestore:indexes,storage
firebase deploy --only hosting:www-uraicontent
WEB_SMOKE_BASE_URL=https://www.uraicontent.com npm run web:smoke:routes
```

Do not mark production GREEN until every external proof item is attached to `docs/EVIDENCE_LOG.md`.
