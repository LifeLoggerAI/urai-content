# ADR 0001: Convert `urai-content` into a package-plus-runtime monorepo

## Status

Accepted for implementation.

## Context

The current `urai-content` repository is a TypeScript content package/library. It owns canonical content schemas, validators, seed data, content service contracts, export helpers, and system roadmap data.

The product target is larger than the current package role. URAI Content must become:

- the canonical content package for the URAI ecosystem
- the standalone runtime system
- the public website at `https://www.uraicontent.com`
- the owner of route, API, auth, database, integration, deployment, smoke-test, and release evidence for the URAI Content surface

Two architecture options were considered:

1. Keep this repository as a package and create a separate `urai-content-web` app.
2. Convert this repository into a monorepo with the existing package preserved and a deployable web runtime added.

The audit originally recommended a separate web app as the safest boundary-preserving path. The current implementation request, however, explicitly asks to implement the complete standalone system and website for the `urai-content` repository itself. That makes a monorepo the clearest path.

## Decision

Convert `urai-content` into a package-plus-runtime monorepo.

Target layout:

```txt
apps/
  web/                 # standalone website/runtime for www.uraicontent.com
packages/
  content/             # future home of the current package code
content/               # canonical content source during migration
src/                   # existing package source during transition
scripts/               # existing package scripts during transition
```

The migration will be staged rather than a one-shot destructive move.

## Implementation strategy

### Stage 1 — Add runtime app without moving package files

Add `apps/web` as a deployable Next.js/Firebase-capable runtime that imports the existing root package code by relative path or workspace alias. Preserve existing root package scripts until the web app is stable.

### Stage 2 — Add workspace orchestration

Add workspace-level scripts for package and web checks while preserving existing package commands.

### Stage 3 — Implement runtime services

Implement:

- public routes
- core APIs
- Firebase Admin adapter
- Auth/session guards
- creator/admin flows
- marketplace gates
- export job runtime
- smoke/E2E tests

### Stage 4 — Move package into `packages/content`

Move existing package files only after the runtime app proves it can consume the package cleanly. This avoids breaking existing validators, content scripts, and package CI before the new app exists.

### Stage 5 — Deploy and harden

Configure staging and production hosting, DNS, secrets, smoke tests, rollback evidence, and monitoring.

## Consequences

### Benefits

- The repository can honestly become the complete standalone URAI Content system.
- Package and runtime changes can be reviewed together.
- Route coverage, runtime APIs, and deployment evidence live near the canonical content source.
- The issue backlog can map directly to repository files and CI jobs.

### Costs

- Build/CI complexity increases.
- Existing package consumers may be affected if the package move is rushed.
- Root scripts need careful compatibility handling during transition.
- Deployment credentials and DNS are still external blockers.

## Non-negotiable guardrails

- Do not remove the package/library role.
- Do not move existing package files until the web runtime is stable.
- Do not claim `www.uraicontent.com` is live without deployment evidence.
- Do not introduce Firebase Admin SDK into browser bundles.
- Do not enable Stripe live mode without production secrets and webhook verification.
- Do not mark routes done until they exist and have route tests.

## Acceptance criteria for this ADR

- `apps/web` is the selected runtime target.
- Existing root package commands remain supported during transition.
- Future PRs can implement Issues #8 through #15 against this architecture.
- `docs/IMPLEMENTATION_STATUS.md` and `docs/ROUTE_COVERAGE.md` remain the source of truth until route tests and deployment evidence supersede them.

## Follow-up issues

- #8 Scaffold deployable URAI Content web runtime
- #9 Implement Firestore ContentRepository adapter
- #10 Add core runtime APIs
- #11 Implement public website routes and SEO coverage
- #12 Implement auth, creator, admin, marketplace, and payments flows
- #13 Implement export pipeline and QA suite
- #14 Configure production deployment, DNS, and launch evidence
- #15 Add post-launch monitoring, alerts, and hardening
