# URAI Spatial XR Schema Dependency Evidence Gate

This evidence file records what `LifeLoggerAI/urai-content` must prove before `LifeLoggerAI/urai-spatial` or native XR clients can claim shared schema/content readiness.

## Current status

- Dependency status: `not-production-locked-for-xr`.
- Canonical consumer: `LifeLoggerAI/urai-spatial`.
- Canonical role: typed content, schema, registry, workflow, moderation, entitlement, telemetry, and runtime route/API contract source.
- Production XR claim status: blocked until package, web-runtime, staging/production smoke, observability, rollback, and schema-compatibility evidence are recorded.

## Required evidence before URAI Spatial may claim shared content readiness

| Gate | Required evidence | Result | Notes |
| --- | --- | --- | --- |
| Package validation | `npm ci`, `npm run lint`, `npm run typecheck`, `npm run validate:content`, `npm run validate:sprites`, `npm run content:check`, `npm test`, `npm run build`, `npm run check` | Not recorded | Required before any shared content/schema lock claim. |
| Generated index stability | `npm run content:index` followed by clean `git diff --exit-code` | Not recorded | Required before clients pin generated content indexes. |
| Web runtime validation | `npm run web:install`, `npm run web:check`, route smoke, and web E2E | Not recorded | Required before runtime route/API claims. |
| Deployed smoke | Production or staging route smoke and `npm run smoke:production` against deployed URL | Not recorded | Required before production content service claims. |
| Observability | `npm run check:observability` with production/staging env evidence | Not recorded | Required before launch readiness. |
| Rollback | `npm run smoke:rollback` or equivalent rollback evidence | Not recorded | Required before release packet approval. |
| XR schema compatibility | Versioned content/schema contract consumed by `urai-spatial` and native XR clients | Not recorded | Required before Quest/WebXR/visionOS/handheld AR content claims. |
| Moderation and entitlement | Workflow, moderation, release logging, and entitlement evidence | Not recorded | Required before marketplace, UGC, or paid content claims. |

## Integration contract for URAI Spatial and XR clients

`urai-spatial` must keep content/schema rows as `Not recorded` or `Not validated` until this repo provides:

1. Passing canonical package command order output.
2. Passing canonical web-runtime command order output if runtime routes are being claimed.
3. Clean generated content index evidence.
4. Deployed route/API smoke evidence for any production runtime claim.
5. Observability and rollback evidence.
6. A versioned schema/content contract that XR clients can pin.
7. Moderation, entitlement, and release logging evidence for paid, marketplace, or UGC content.

## Release decision

Do not use this file to mark `urai-content` production-live. It is a dependency ledger for `urai-spatial` and future XR clients. The authoritative repo gates remain the README command order, governance docs, issue control docs, launch runbooks, and evidence logs under `docs/`.
