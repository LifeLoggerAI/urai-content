# URAI Content Production Readiness

Date: 2026-06-29
Branch: `production-lock/urai-content-done-done`
Base: `main` at `c5be02363475d18eb5e6fb0c63f7c7c346160d12`

## Blunt Verdict

URAI Content is **CI-backed on the repository side** after the production-lock hardening and follow-up repair passes.

Deployment/provider evidence is **pending**. This means launch proof still needs to be attached for live deployment, Firebase project, Stripe, DNS, storage, browser E2E, monitoring, rollback, and post-deploy smoke output.

Current status after these passes: **repo-side production-lock hardening complete / deployment evidence pending**, not a provider-verified launch claim.

Estimated readiness after this branch and green CI repair: **repo foundation substantially hardened; external launch proof still outstanding**.

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

## Deployment Evidence Still Pending

| Area | Pending Evidence | Required Proof |
| --- | --- | --- |
| Live deployment | Hosting/DNS/SSL/deployed URL proof was not attached in this pass | URL, deploy command output, route smoke against deployed host |
| Firebase Admin | Production service credentials/project access proof was not attached in this pass | Secret manager config, `/api/system/firebase`, rules deploy, emulator/staging proof |
| Firestore/Storage rules | Rules normalized; deploy/emulator evidence still needs to be attached | Firebase emulator test output and deployment log |
| Stripe | Keys/webhook endpoint/checkout proof still needs to be attached | Checkout session test, webhook fixture, entitlement write/read |
| Protected UI | Creator/admin/dashboard UI proof still needs browser E2E evidence | Browser E2E screenshots/logs and route smoke |
| Export/media | Export worker/storage/download pipeline proof still needs to be attached | Create/status/download tests, storage object, checksum, authorization proof |
| Monitoring | Sentry/alerts/uptime proof still needs to be attached | Alert test, dashboard URL, incident path |
| Rollback | Rollback target/smoke proof still needs to be attached | Rollback command and post-rollback smoke output |

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

Required provider configuration evidence:

- Public site URL configured for the deployed host.
- Firebase project, service-account identity, storage bucket, hosting site, and admin UID list configured through CI or secret manager.
- Seed/admin tokens configured through CI or secret manager.
- Stripe API and webhook credentials configured through Stripe/provider secrets.
- No secret values committed to the repository.

Firebase proof commands:

```bash
firebase use <production-or-staging-project>
firebase emulators:exec --only firestore,storage "npm run web:check"
firebase deploy --only firestore:rules,firestore:indexes,storage
firebase deploy --only hosting:www-uraicontent
WEB_SMOKE_BASE_URL=https://www.uraicontent.com npm run web:smoke:routes
```

Attach every external proof item to `docs/EVIDENCE_LOG.md` before making a provider-verified launch claim.
