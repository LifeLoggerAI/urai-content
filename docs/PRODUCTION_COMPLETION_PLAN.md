# URAI Content Production Completion Plan

Status: **implementation-control document**

This document turns the production-readiness audit into an executable completion plan for `LifeLoggerAI/urai-content` as both:

1. a standalone URAI Content runtime/product, and
2. the canonical content engine for the larger URAI system-of-systems.

It does **not** mark the repository production-ready. The standing rule is: **no evidence means no GREEN**.

## 1. Evidence-based current state

### Current classification

`urai-content` is **partially implemented**.

More specifically:

- Root TypeScript package: repo-ready foundation with schemas, registries, validators, service contracts, seed checks, tests, and build scripts.
- `apps/web`: standalone Next.js runtime scaffold with route/API shells and local verification commands.
- Firebase/Auth/Storage: contract/scaffold level until project, rules, indexes, credentials, emulator or staging evidence, and smoke output are attached.
- Stripe/entitlements: contract/scaffold level until checkout, webhook verification, price IDs, entitlement writes, and idempotency are implemented and tested.
- Marketplace/export pipeline: partial until live entitlement gating, export workers, Storage writes, downloads, retries, and ownership checks are implemented and tested.
- Ecosystem integration: contract-level until consuming repos verify package/API compatibility with tests.
- Production deployment: blocked until host, DNS, SSL, secrets, observability, smoke, and rollback evidence are attached.

### What is implemented

- Canonical content tree under `content/`.
- Root TypeScript package exports from `src/index.ts`.
- Zod schemas and TypeScript types in `src/schemas/content.ts`.
- Content registry, loaders, validators, and deterministic content index generation.
- Backend content service contracts and in-memory repository.
- Seed/demo checks.
- Web runtime scripts under `apps/web` where present.
- Firestore/Storage rule files where present.
- Deployment blockers and anti-fake-completion docs.

### What is not complete

- Live production deploy to `www.uraicontent.com`.
- DNS and SSL evidence.
- Production Firebase project verification.
- Firestore/Storage emulator and staging evidence.
- Auth/session/RBAC fail-closed browser and server evidence.
- Stripe checkout/webhooks/entitlement write implementation and tests.
- Export job worker, artifact Storage writes, download authorization, retries, and cleanup.
- Protected admin/editor UI flows.
- Protected creator submission flows.
- Full browser E2E against local and deployed URLs.
- Observability, uptime, alerting, request IDs, and rollback drill evidence.
- Cross-repo contract tests with URAI sister systems.

## 2. Canonical product definition

`urai-content` is URAI's canonical content operating layer: it defines, validates, publishes, gates, licenses, exports, and distributes URAI content across public, creator, marketplace, admin, and system integrations.

### Primary users

- URAI admins and editors managing canonical app/site/legal/content records.
- Creators submitting content packs, templates, narrator assets, and marketplace items.
- Internal engineers consuming stable content contracts.
- End users browsing public, tier-gated, or licensed content.
- Partner/enterprise users consuming licensed packs and export artifacts.

### Belongs in this repo

- Content schemas and validation.
- Canonical content records.
- Content lifecycle workflows.
- Publishing, moderation, provenance, release, and version contracts.
- Runtime content APIs and route shells.
- Admin/editor/creator workflow boundaries.
- Marketplace, entitlement, licensing, and export content contracts.
- Integration adapter contracts for other URAI repos.
- Production readiness and launch-governance evidence templates.

### Does not belong in this repo

- Raw passive-sensing ingestion.
- Therapy, diagnosis, or medical claims.
- Full analytics warehouse implementation.
- SMS/email provider implementation beyond content/event contracts.
- Asset rendering workers that belong in Asset Factory.
- AR/VR runtime engines that belong in Spatial.
- Company/legal operations beyond canonical published content and policy copy.

## 3. Standalone production architecture

### Runtime architecture

- `apps/web` owns the public URAI Content website and runtime API surface.
- Public routes must only render published public content.
- Protected admin and creator routes must fail closed server-side and client-side.
- Runtime APIs must never expose draft/private/tier-gated content without authorization.

### Package architecture

- Root package remains the stable content contract surface for sister repos.
- `src/schemas/content.ts` is the canonical schema source.
- `src/backend/types.ts` defines repository/service boundaries.
- `src/backend/contentService.ts` owns workflow rules and service-level validation.
- `src/backend/inMemoryRepository.ts` remains local/test-only.

### Firebase/Admin boundary

- Firebase Admin must be server-only.
- Browser bundles must never import service account credentials or Admin SDK modules.
- Live Firestore adapters must receive injected Admin/Firestore instances.
- Rules and indexes must be tested before staging or production claims.

### Auth and RBAC model

Required roles:

- anonymous: public published reads only.
- user: authenticated user content and owned exports.
- creator: creator submissions and owned draft workflows.
- studio: creator plus team/studio pack access.
- admin/internalAdmin: publishing, moderation, releases, entitlements, licenses, and emergency takedown.
- enterprise/licensing partner/foundation: licensed or scoped content access.

All protected writes must be server-side authorized and mirrored by Firestore/Storage rules where applicable.

### Required workflows

- Public content browsing.
- Admin/editor drafting, review, approval, publish, archive, and rollback.
- Creator submission and moderation.
- Marketplace browse, checkout, webhook entitlement, and gated access.
- Export request, worker processing, Storage artifact write, ownership-protected download, retry, and cleanup.
- Licensing approval and evidence-pack access.
- SEO/legal/privacy content publish and emergency takedown.

## 4. System-of-systems integration map

| System | Direction | Boundary | Required launch gate |
| --- | --- | --- | --- |
| URAI Home/Core | consumes public/canonical content | package import or runtime API | contract tests and public-content smoke |
| Jobs | consumes career/job marketing and legal copy where applicable | content pack/API | route/API contract tests |
| B2Bportal | consumes enterprise, partner, licensing, and case-study content | API/package content packs | partner-gated access tests |
| Asset Factory | consumes export templates, licensing metadata, artifact descriptors | export template contract/events | worker contract and artifact ownership tests |
| Analytics | receives content telemetry events | event schema/API | event validation and privacy tests |
| Communications | consumes campaign, notification, and email copy | content registry/API | template rendering and consent tests |
| Privacy | consumes legal/privacy/consent copy and records | policy content plus consent records | legal copy publish and consent tests |
| Studio | consumes creator packs/templates and submission workflow | creator APIs/events | creator RBAC and moderation tests |
| Spatial | consumes AR/VR/spatial content modules | expansion module contracts | feature-flag and entitlement tests |
| Admin | manages content publishing/moderation/releases | protected admin APIs | admin fail-closed E2E |
| Marketing | consumes public pages, SEO, launches, press copy | content package/API | SEO and canonical URL tests |
| Investors | consumes approved investor/press content | scoped content pack | access and freshness tests |
| Foundation | consumes public-good/foundation content packs | content pack/API | license/visibility tests |
| Licensing | consumes licenses, partner packs, evidence packs | license APIs/export artifacts | partner access and audit tests |

## 5. Data model and API contracts

Each production collection/entity must define required fields, optional fields, validation, visibility, owner/admin rules, lifecycle states, indexes, privacy concerns, and API/service methods before GREEN status.

Required entities:

- `contentItems`
- `contentPacks`
- `narratorPrompts`
- `storyTemplates`
- `ritualTemplates`
- `marketplaceItems`
- `creatorSubmissions`
- `moderationQueue`
- `publishingReleases`
- `contentVersions`
- `exportTemplates`
- `exportJobs`
- `userContentEntitlements`
- `contentLicenses`
- `consentRecords`
- `provenanceRecords`
- `analyticsEvents`
- `tierConfigs`
- `roadmapPhases`
- `expansionModules`
- `systemIntegrations`
- `seoPages`

Minimum API surface:

- `GET /api/health`
- `GET /api/version`
- `GET /api/catalog`
- `GET /api/content/[[...slug]]`
- `GET /api/system/firebase`
- `POST /api/admin/seed/canonical-content`
- `POST /api/admin/content`
- `PATCH /api/admin/content/:id`
- `POST /api/admin/content/:id/review`
- `POST /api/admin/content/:id/publish`
- `POST /api/admin/content/:id/archive`
- `POST /api/creator/submissions`
- `GET /api/creator/submissions`
- `POST /api/marketplace/checkout`
- `POST /api/stripe/webhook`
- `GET /api/entitlements`
- `POST /api/exports`
- `GET /api/exports/:id`
- `GET /api/exports/:id/download`

## 6. Content lifecycle workflows

Every workflow must include actor, trigger, preconditions, writes, emitted events, tests, failure modes, and acceptance criteria.

### Draft to review

- Actor: editor, creator, admin.
- Preconditions: authenticated, authorized, valid schema.
- Writes: content item/submission status moves to `review`.
- Events: `content.review_requested`.
- Tests: unauthorized user denied; invalid schema rejected; valid owner/admin accepted.

### Review to approved

- Actor: admin/moderator.
- Preconditions: item is in review, moderation notes present where required.
- Writes: moderation queue, content status `approved`.
- Events: `content.approved`.
- Tests: creator cannot self-approve; admin can approve.

### Approved to published

- Actor: admin/internalAdmin.
- Preconditions: approved item, visibility set, SEO/legal gates satisfied.
- Writes: publish timestamp, release record, version snapshot.
- Events: `content.published`.
- Tests: public API only returns published public content.

### Published to archived

- Actor: admin/internalAdmin.
- Preconditions: published content exists.
- Writes: archived status and release note.
- Events: `content.archived`.
- Tests: archived content no longer appears publicly.

### Export generation

- Actor: entitled user/creator/admin.
- Preconditions: entitlement verified server-side, template allowed, storage path scoped to user/org.
- Writes: export job record, Storage artifact, provenance record.
- Events: `export.created`, `export.completed`, `export.failed`.
- Tests: cross-user download denied; retry works; failed job exposes safe error.

## 7. Production gaps and fix plan

### P0 launch blockers

1. Select and verify hosting target.
2. Configure staging/prod environment variables and secrets.
3. Verify Firebase project, rules, indexes, Auth, and Storage.
4. Implement fail-closed auth/RBAC for admin and creator surfaces.
5. Add Firestore/Storage emulator tests.
6. Add deployed route/API smoke and browser E2E.
7. Configure DNS/SSL.
8. Configure uptime/error monitoring and alert routing.
9. Prove rollback path with release SHA and rollback SHA/procedure.

### P1 production hardening

1. Stripe checkout, webhook verification, idempotency, and entitlement writes.
2. Export queue/worker/storage/download pipeline.
3. Cross-repo package/API contract tests.
4. Accessibility, mobile, SEO, sitemap, and robots verification.
5. Audit logging and provenance reporting.

### P2 polish

1. Premium public UI polish.
2. Admin/editor productivity improvements.
3. Creator submission UX.
4. Marketplace browsing and licensing copy.
5. Operational dashboards.

### P3 later enhancements

1. Rich marketplace recommendations.
2. Advanced licensing partner portal.
3. Spatial/AR content visualization.
4. Multi-tenant enterprise content workspaces.

## 8. Ordered implementation checklist

1. Freeze product boundary.
2. Verify current `npm ci`, root checks, web checks, and route smoke.
3. Lock schemas/contracts and add schema regression tests.
4. Complete Firebase emulator tests for Firestore and Storage.
5. Complete Auth/RBAC guards and fail-closed tests.
6. Complete admin/editor workflows.
7. Complete creator workflows.
8. Complete marketplace/Stripe/entitlements.
9. Complete export pipeline.
10. Complete ecosystem adapters and contract tests.
11. Complete observability and alerting.
12. Complete deployment config.
13. Complete production smoke.
14. Complete rollback evidence.
15. Final production lock with owner/reviewer approval.

Each step must attach command output, CI URLs, screenshots/provider links when relevant, and updated evidence logs.

## 9. Test, CI/CD, and evidence gates

Required test matrix:

- Unit tests.
- Schema validation tests.
- Content index determinism tests.
- Seed checks.
- Firestore rules tests.
- Storage rules tests.
- Auth/RBAC tests.
- API route tests.
- Browser E2E.
- Mobile viewport E2E.
- Accessibility checks.
- SEO/sitemap/robots checks.
- Stripe/webhook/idempotency tests.
- Export ownership/security tests.
- Cross-repo contract tests.
- Production smoke.
- Rollback smoke.

Required evidence per release:

```text
Commit SHA:
CI run URL:
Package command output:
Web command output:
Route smoke output:
E2E output:
Staging URL:
Production URL:
Firebase project evidence:
Firestore/Storage rules evidence:
Stripe evidence:
Monitoring evidence:
Rollback evidence:
Final status: RED / YELLOW / GREEN
```

## 10. Security, privacy, compliance, billing, and cost gates

Production must prove:

- Secrets are never committed.
- Firebase Admin remains server-only.
- Public/private/draft content separation is enforced.
- User-owned exports cannot leak across users.
- Creator submissions are owner/admin scoped.
- Consent and provenance records are append-safe and auditable.
- Analytics events avoid unnecessary personal data.
- Legal/privacy copy has owner approval.
- Stripe webhooks verify signatures and are idempotent.
- Entitlement writes are server-side and auditable.
- Storage paths and Firestore indexes control cost.
- Abuse/rate limits exist for write-heavy routes.
- Admin and sensitive actions are audit logged.

## 11. Coding-agent prompt pack

### Repo baseline verifier

Inspect package, web, CI, docs, and scripts. Run install/check/build/test commands. Do not modify runtime behavior. Produce command output and exact blocker list.

### Schema/data-model completer

Inspect `src/schemas/content.ts`, backend types, Firestore rules, seed data, and tests. Add missing entity fields only with tests and migration-safe defaults. Do not break existing exports.

### Firebase rules/emulator tester

Inspect `firestore.rules`, `storage.rules`, indexes, and Firebase config. Add emulator tests for public read, private denial, admin write, creator submission, export ownership, entitlements, and default deny.

### Auth/RBAC implementer

Implement server-side session/role helpers and protected route/API guards. Add fail-closed tests for anonymous, user, creator, studio, admin, and internalAdmin.

### Admin/editor workflow implementer

Build the smallest protected workflow for draft, review, approve, publish, archive, version, and rollback. Add API and browser tests.

### Creator workflow implementer

Build protected creator submission create/list/update flows. Ensure users cannot read or mutate other creators' submissions. Add tests.

### Marketplace/Stripe implementer

Implement checkout, webhook signature verification, price mapping, idempotent entitlement writes, and safe dev-mode behavior. Add tests using Stripe test fixtures.

### Export pipeline implementer

Implement export create/status/download, worker contract, Storage writes, retries, failure states, and ownership checks. Add cross-user denial tests.

### Ecosystem adapter implementer

Add adapter contracts and contract tests for URAI Core/Home, B2Bportal, Asset Factory, Analytics, Communications, Privacy, Studio, Spatial, Admin, Marketing, Investors, Foundation, and Licensing.

### Observability/deployment implementer

Add deployment config, health/version evidence, request IDs, uptime checks, error monitoring hooks, alert checks, smoke scripts, and rollback smoke evidence.

### E2E QA implementer

Add Playwright coverage for public routes, mobile, SEO, auth mocks, admin, creator, marketplace, export, and deployed URL smoke.

### Final production lock auditor

Verify every P0/P1 gate with evidence. Do not mark GREEN without logs, CI URLs, deployed URLs, provider evidence, release SHA, rollback proof, and owner/reviewer approval.

## 12. Done-means-done checklist

A production lock requires evidence for:

- [ ] Clean install.
- [ ] Lint.
- [ ] Typecheck.
- [ ] Content validation.
- [ ] Sprite validation.
- [ ] Deterministic content index.
- [ ] Unit tests.
- [ ] Seed checks.
- [ ] Root build.
- [ ] Web check.
- [ ] Route smoke.
- [ ] Browser E2E.
- [ ] Firebase emulator tests.
- [ ] Firestore/Storage rules tests.
- [ ] Auth/RBAC fail-closed tests.
- [ ] Stripe/webhook test evidence.
- [ ] Export pipeline test evidence.
- [ ] Cross-repo integration tests.
- [ ] DNS.
- [ ] SSL.
- [ ] Production URL.
- [ ] Monitoring.
- [ ] Alerts.
- [ ] Rollback.
- [ ] Release SHA.
- [ ] CI URL.
- [ ] Owner approval.
- [ ] Reviewer approval.

Until every required item is checked with attached evidence, `urai-content` remains **not production locked**.
