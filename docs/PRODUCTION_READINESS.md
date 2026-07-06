# URAI Content Production Readiness

Last audited: 2026-07-06  
Canonical branch: `main`  
Audited SHA: `0630ad96b49db5d70555c5019431af1ce3d273c0`

## Verdict

URAI Content is **source-level CI backed**. It is not a verified production content platform.

The root package and web runtime have passing source checks and browser smoke evidence. Production readiness remains blocked by canonical-schema drift, rule/schema contradictions, provider-backed staging proof, durable export/media execution, live deployment evidence, observability, backup/restore and rollback proof.

No production URL, live SHA, provider project, rollback target or production traffic is proven in this repository.

## Verified repository-side evidence

- Root lint, typecheck, content validation, seed validation, tests and TypeScript build passed in GitHub Actions.
- Web typecheck, lint, tests and Next.js build passed.
- Local route smoke and Playwright browser smoke passed in CI.
- Production writes fail closed when Firebase Admin is unavailable.
- Firebase bearer-token verification and RBAC helpers exist.
- Firestore and Storage rules deny unmatched paths by default.
- Governance, secret checks, release-evidence gates and a manual Vercel deployment workflow exist.

The fully inspected green source run is `ci` run `28432792723` on commit `457a2a3d4b9bb621eef13b488c1a3b5826f6c71f`.

## Source blockers before deployment

| Area | Blocker | Required proof |
| --- | --- | --- |
| Canonical schemas | root and web runtime duplicate types; several runtime records are untyped | one versioned schema package and validation at every persistence/API boundary |
| Firestore rules | marketplace/content-pack public predicates do not align cleanly with their schemas | collection-specific rules plus emulator tests |
| Storage rules | claim handling differs from server/Firestore and uploads lack explicit constraints | role/roles parity, size/MIME rules and upload tests |
| Revisions | version number is derived from list length | transactional concurrent revision test |
| Deletion | hard delete exists without retention, tombstone, purge or restore evidence | deletion lifecycle, receipts and restore test |
| Search | full collection substring scan | paginated/indexed search and delete/reindex proof |
| Integrations | ecosystem adapter is a mock | versioned real contracts and staging consumer tests |
| Providers | evidence checks exist but provider implementations do not | cost-gated provider operation and receipt proof |

## External evidence still pending

| Area | Required proof |
| --- | --- |
| Live deployment | successful deploy run, public URL, SSL/DNS, route smoke and live SHA |
| Firebase | project identity, Auth, Firestore, indexes, Storage and rules deployment evidence |
| Creator/admin | two-user owner isolation, moderation and audit evidence against durable persistence |
| Export/media | queued job, worker, artifact, checksum, authorization, retry and failure recovery |
| Payments | owner-approved provider, verified webhook and entitlement lifecycle |
| Monitoring | health/uptime, structured logs, error alerts, provider-spend alerts and incident path |
| Backups | backup artifact and successful restore drill |
| Rollback | rollback SHA/URL, command record and post-rollback smoke |
| Legal/privacy | reviewed privacy, licensing, generated-content ownership and personal-data boundaries |

## Release certification commands

Source checks:

```bash
npm ci
npm run check
npm run done
npm run web:install
npm run web:check
npm run web:smoke:routes -- --base-url=http://127.0.0.1:3000
cd apps/web && npm run e2e
```

Deployed checks:

```bash
npm run check:release-env
npm run web:smoke:routes -- --base-url=<deployed-url>
npm run smoke:production -- --base-url=<deployed-url>
npm run smoke:rollback -- --base-url=<deployed-url> --rollback-url=<rollback-url>
cd apps/web && PLAYWRIGHT_SKIP_WEB_SERVER=1 URAI_CONTENT_BASE_URL=<deployed-url> npm run e2e
```

Provider, emulator, backup and restore tests must also pass and reference the same release SHA.

## Certification rule

A release may be called production-ready only when all source, schema/rules, security/privacy, provider-backed staging, deployment, observability, backup/restore and rollback evidence is attached for one exact SHA. Until then the truthful status is:

> implemented and tested as a repository scaffold; production deployment and operations blocked.
