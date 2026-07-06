# URAI Content Canonical Audit

Audit date: 2026-07-06  
Audited branch: `main`  
Audited SHA: `0630ad96b49db5d70555c5019431af1ce3d273c0`

## Current verdict

`urai-content` is a public Apache-2.0 repository containing two related products:

1. a private npm TypeScript package that defines reusable URAI content schemas, seed registries, validation, publishing contracts, and in-memory backend services; and
2. a Next.js runtime scaffold in `apps/web` with public pages, read APIs, creator/admin APIs, Firebase adapters, rules, route smoke tests, and Playwright tests.

The repository is **implemented and tested as a source-level scaffold**, but it is **not a verified production content platform**. No deployed URL, live SHA, provider-backed persistence proof, storage/export proof, monitoring proof, or tested rollback target is recorded. The package and runtime also duplicate key models and are not yet a single canonical data architecture.

## Verified working

| Capability | Evidence | Maturity |
| --- | --- | --- |
| Root lint, typecheck, schema validation, tests, build, governance and secret checks | GitHub Actions `ci` run `28432792723`, validate job | implemented and tested |
| Web typecheck, lint, tests and Next.js build | GitHub Actions `ci` run `28432792723`, web and browser-smoke jobs | implemented and tested |
| Browser smoke suite | GitHub Actions `ci` run `28432792723`, browser-smoke job | implemented and tested |
| Typed root schemas for content, templates, marketplace, submissions, moderation, releases, exports, consent, provenance, licenses and manifests | `src/schemas/*.ts` | implemented and tested |
| Firestore and Storage deny-by-default rules | `firestore.rules`, `storage.rules` | implemented but unverified |
| Firebase Admin token verification and role parsing | `apps/web/src/server/auth/session.ts` | implemented and tested |
| Memory fallback disabled for production writes when Firebase Admin is absent | `apps/web/src/server/content/service.ts` | implemented and tested |
| Manual Vercel deployment workflow with post-deploy smoke and evidence artifact | `.github/workflows/deploy-vercel-production.yml` | implemented but unverified |

## Major gaps

### Canonical model drift

- Root Zod schemas and `apps/web/src/server/content/types.ts` duplicate the same domain.
- Runtime types reduce submissions, templates, marketplace records, moderation records and releases to `Record<string, unknown>`.
- Firestore reads cast raw documents directly into application types without runtime validation.
- Lifecycle, tier and content-type enums overlap but are not shared from one versioned package.

### Persistence and lifecycle

- Firestore version numbering uses `versions.length + 1`, which is not transaction-safe.
- Repository reads list entire collections and perform in-process filtering; there is no pagination contract.
- `deleteContent` is a hard delete with no tombstone, retention state, provenance write or restore path.
- There is no migration framework, schema version on stored records, conflict-resolution policy, backup proof or restore test.
- Creator/admin flows exist at route and adapter level, but provider-backed end-to-end evidence is missing.

### Rules and schema contradictions

- `marketplaceItems` public reads use `isPublishedPublic()`, but the marketplace schema uses `moderationStatus` and does not define `status` plus `visibility/publicVisibility`.
- `contentPacks` public reads also use `isPublishedPublic()`, but the content-pack schema has `status` and `tierVisibility`, not `visibility/publicVisibility`.
- Storage rules inspect only the single `role` claim while Firestore rules and server auth also accept a `roles` array.
- Creator uploads have no file-size, MIME-type or extension restrictions in Storage rules.
- Signed-in clients can create analytics records without a schema or per-user/rate constraint.

### Content platform completeness

- Search is a linear lowercase substring scan over all loaded content; there is no full-text, semantic, multilingual or incremental index.
- Localization is limited to a locale string and a small localization map; there is no locale registry, translation catalog, completeness check, review state, RTL strategy or nineteen-language evidence.
- Asset manifests are schemas only. There is no media ingestion, transcoding, thumbnailing, caption generation, variant pipeline, signed-delivery policy or durable generation receipt store.
- Provider support is governance-only. No provider-neutral generation interface, cost ledger, idempotency key, retry policy, budget enforcement or provider implementation is present.
- Ecosystem adapters are mock adapters that report success while explicitly not writing externally.
- No durable queue worker or export worker is implemented in this repository.

## Canonical responsibility

The canonical responsibility of `urai-content` should be:

> Versioned, validated, provenance-aware reusable content packages and publishing contracts for URAI product surfaces.

It should own editorial/system copy, reusable story/ritual/narrator templates, replay/content manifests, localization bundles, accessibility metadata, media-manifest metadata, publication state, provenance and distribution contracts.

It should **not** become the primary database for private memories, journals, health-adjacent signals, relationship graphs or precise location history. Those user-owned records should remain in privacy-governed domain services. `urai-content` may store references and generated package manifests only after explicit consent and provenance checks.

## Production truth

- Canonical branch: `main`
- Audited SHA: `0630ad96b49db5d70555c5019431af1ce3d273c0`
- Package manager: npm
- Root runtime: TypeScript 5.7 package
- Web runtime: Next.js 15.3 / React 19 under `apps/web`
- CI Node version: 22
- Deployment workflow: manual Vercel workflow
- Verified deployed URL: none
- Verified live SHA: none
- Verified rollback SHA/URL: none
- Provider-backed production persistence: not proven

## Validation evidence

The latest fully inspected green source run is GitHub Actions run `28432792723` on commit `457a2a3d4b9bb621eef13b488c1a3b5826f6c71f`. It passed:

- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run validate:content`
- `npm run validate:sprites`
- `npm run content:index`
- `git diff --exit-code`
- `npm run smoke`
- `npm test`
- `npm run build`
- `npm run seed:check`
- `npm run seed:system:check`
- `npm run verify`
- `npm run done`
- `npm run web:install`
- `npm run web:check`
- route smoke
- Playwright browser smoke

The audited `main` SHA is five commits ahead of the production-lock merge and adds deployment/documentation work. No live deployment evidence is attached.

## Priority order

1. Unify root and runtime schemas; validate every persistence boundary.
2. Fix Firestore/Storage rule-to-schema contradictions and add emulator tests.
3. Add schema versioning, transactions, pagination, tombstones, migrations and restore tests.
4. Prove Firebase/Auth/Firestore/Storage creator and admin flows in staging.
5. Implement durable export/media jobs with idempotency, receipts and cost gates.
6. Replace mock ecosystem adapters with versioned authenticated contracts and consumer tests.
7. Add localization/accessibility registries and measurable language completeness.
8. Add production deployment, observability, backup, rollback and release certification evidence.

## Evidence index

- `README.md`
- `package.json`
- `apps/web/package.json`
- `src/schemas/content.ts`
- `src/schemas/production.ts`
- `src/schemas/system.ts`
- `src/backend/types.ts`
- `apps/web/src/server/content/types.ts`
- `apps/web/src/server/content/service.ts`
- `apps/web/src/server/firebase/contentRepository.ts`
- `apps/web/src/server/auth/session.ts`
- `src/integrations/adapters.ts`
- `firestore.rules`
- `storage.rules`
- `.github/workflows/*.yml`
- issue `#61`
