# URAI Content Architecture

## Canonical responsibility

`urai-content` owns versioned, validated, reusable content packages for URAI: editorial and system copy, story and ritual templates, narrator and replay manifests, localization bundles, accessibility metadata, publication state, provenance, rights metadata, media-manifest metadata and distribution contracts.

Private memories, journals, relationship graphs, precise location history and health-adjacent user records belong in privacy-governed personal-data services. This repository should store only consented references or derived package manifests for those records.

## Current layers

| Layer | Paths | Status |
| --- | --- | --- |
| Canonical JSON and registries | `content/`, `src/lib/content/` | implemented and tested |
| Root schemas and package services | `src/schemas/`, `src/backend/`, `src/index.ts` | implemented and tested |
| Ecosystem adapters | `src/integrations/` | mock/scaffold only |
| Standalone web runtime | `apps/web/src/app/` | implemented and tested as a scaffold |
| Runtime auth and persistence | `apps/web/src/server/` | partial |
| Provider rules | `firestore.rules`, `storage.rules` | implemented but unverified |
| CI and release gates | `.github/workflows/`, `scripts/` | source checks implemented; live deploy unverified |

## Target boundaries

### Canonical schema package

Use one versioned Zod schema source for root code, web runtime, persisted documents and API payloads. Add stable IDs, schema version, ownership scope, lifecycle state, provenance, consent reference, accessibility metadata, locale state, retention/deletion state and media checksums.

### Repository layer

Repository methods must accept actor/scope context and support paginated reads, owner-scoped writes, transactional versions, tombstones, migration state, audit writes, idempotency and export/deletion receipts.

### Lifecycle services

Separate ingestion, editorial review, localization, accessibility, generation, moderation, publishing, indexing, export, archive and deletion services from route handlers.

### Provider adapters

A provider operation must be fail-closed and produce a receipt containing request ID, idempotency key, provider/model version, approved budget, attempts, output checksum, provenance and deletion state. Mock success must never count as an external write.

### Ecosystem contracts

Spatial, Studio, Asset Factory, Storytime, Jobs, Analytics and Privacy integrations must be versioned and define authentication, ownership, schemas, retries, idempotency, privacy classification and contract tests.

## Ownership map

| Capability | Recommended owner |
| --- | --- |
| Reusable copy, templates, manifests, localization and accessibility metadata | `urai-content` |
| Editorial and administrative UI | `urai-studio` or admin app |
| Asset generation execution | `asset-factory` and `urai-jobs` |
| Personal memory and relationship data | privacy-governed personal-data service |
| Consent policy and deletion authority | `urai-privacy` |
| Analytics aggregation | `urai-analytics` |

## Decisions still required

1. Confirm whether `apps/web` is a permanent public product or a service/demo shell.
2. Publish schema-version and migration policy.
3. Lock canonical collections, indexes and storage paths.
4. Define personal-data reference rules.
5. Define provider cost and data-transfer rules.
6. Define package compatibility and release versioning.
7. Define backup, restore, export and deletion guarantees.
