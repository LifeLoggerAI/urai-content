# Data Schema Audit

Starting SHA: 4366390d7691d0cf5b3e728f2452c729a75b893f
Ending SHA: final branch head after proof commits; see PR/final response.
Branch: production-lock-content-2026-06-30
Evidence scope: source-level schema/rules inspection and edits.

## Creator submission schema

Status: SOURCE-FIXED / NEEDS CI.

Change made:

- Canonical statuses now match runtime route behavior: submitted, approved, rejected, changes_requested.
- Canonical fields now match runtime submissions: id, creatorId, title, body, contentType, tags, locale, status, submittedAt, updatedAt, moderation notes/metadata.
- Optional migration fields were added for sourceContentItemId and migrationSource so old records can be migrated without treating legacy shape as current production input.
- Tests were added to accept runtime shape and reject old accepted/pending style drift.

Remaining required proof:

- Run npm test and web tests in CI.
- If legacy records exist, migrate them to the new canonical shape before launch.

## Entitlement collection naming

Status: SOURCE-FIXED / NEEDS RULES DEPLOYMENT PROOF.

Canonical collection: userContentEntitlements.

Change made:

- Firestore rules now grant owner/admin reads and admin writes on userContentEntitlements.
- Legacy userEntitlements is explicitly denied to avoid silent writes to the wrong collection.
- .env.example documents the canonical collection and legacy migration requirement.

Remaining required proof:

- Deploy rules to staging.
- Run emulator/staging rules tests.
- Migrate any legacy userEntitlements records before production.

## Catalog/content schema

Status: REAL / PARTIAL.

Content item, workflow, access tier, template, marketplace, export template, entitlement, and telemetry schemas exist. Production proof requires source tests and provider-backed integration evidence.

## Release/version schema

Status: REAL / PARTIAL.

Version and publishing release schemas exist and root service logs releases when published. Production proof requires admin workflow, deployed persistence, and audit log verification.

## Export/media schema

Status: PARTIAL/BLOCKED.

Export template schema exists. Export job, artifact storage, download, retry, revocation, and media upload schemas/lifecycle are not fully verified in production.

## Remaining schema risks

- CI may reveal follow-up typing/test updates required after schema alignment.
- Any existing persisted creator submissions or entitlement documents require migration before launch.
- Payment, export, and media schemas are not enough to claim live functionality.
