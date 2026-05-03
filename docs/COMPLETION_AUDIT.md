# Completion Audit

## What exists

- TypeScript content package with strict scripts for build, typecheck, lint, validation, tests, build, seed checks, and final package checks.
- Canonical `content/` JSON source tree.
- Centralized Zod schema contracts for URAI content and telemetry.
- Typed content registries, loaders, validators, and deterministic content index generation.
- Backend service and repository abstraction with workflow transitions, versioning, moderation logging, release logging, telemetry logging, and entitlement checks.
- In-memory repository implementation for local smoke behavior and tests.
- Demo seed packs for narrator, ritual, story, marketplace, and export template entities.
- Unit tests for workflow, search, versioning, and entitlement checks.

## What was broken originally

- Repository had only a README and no executable system.
- Content schemas, validators, service contracts, seed packs, tests, and build pipeline were missing or incomplete.
- Firebase/live deployment wiring was implied but not actually implemented inside this package.

## Canonical command order

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run validate:content`
5. `npm run validate:sprites`
6. `npm run content:index`
7. `git diff --exit-code`
8. `npm test`
9. `npm run build`
10. `npm run seed:check`
11. `npm run check`

## Firebase adapter status

`urai-content` does not initialize Firebase Admin and does not ship a live Firestore adapter. Consuming backend repos must implement `ContentRepository` using injected Firestore/Admin SDK and wire it into `ContentService`.

## What is still external

- Live Firebase wiring: Firestore, Storage, Auth claims checks, rules deployment, and target project credentials.
- Stripe purchase verification and webhook handling, which require Stripe account secrets and endpoint registration.
- Consuming-repo Firebase adapter implementation and deployment.
- Infra repo rules/index rollout.

## Systems needing wiring in consuming deployment

- Implement `ContentRepository` with Firebase Admin SDK and Firestore collections.
- Apply Firestore rules/index patches from `docs/FIREBASE_RULES_PATCH.md`.
- Attach service methods to API/function handlers in the deployment environment.
- Configure environment variables and secrets for Firebase, Stripe, CI, and deployment targets.
- Run the full canonical command order before merging or deploying.

## Done-done checklist

- [x] Typed schemas for all requested entities.
- [x] Canonical content JSON structure.
- [x] Registry, loader, and validator layer.
- [x] Deterministic content index generation.
- [x] Workflow enforcement and version history hooks.
- [x] Entitlement guard path through server-side service method.
- [x] Moderation logging contract.
- [x] Release logging contract.
- [x] Telemetry event contract and persistence interface.
- [x] In-memory repository for tests and local smoke behavior.
- [x] Seed/demo data pack with validation.
- [x] Unit tests for key behavior.
- [x] Deployment/testing documentation.
- [ ] Live cloud credentials configured.
- [ ] Firebase adapter implemented in consuming backend repo.
- [ ] Firestore rules/index patches deployed.
- [ ] Stripe verification/webhooks wired in consuming deployment.