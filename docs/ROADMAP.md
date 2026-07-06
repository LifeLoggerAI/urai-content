# URAI Content Roadmap

Audit baseline: `main` at `0630ad96b49db5d70555c5019431af1ce3d273c0`

Sizes: XS, S, M, L, XL. Order is dependency order, not a calendar promise.

## Immediate stabilization

| Order | Deliverable | Owner | Size | Acceptance and proof |
| --- | --- | --- | --- | --- |
| 1 | Replace runtime duplicate records with imports from one versioned Zod schema package | `urai-content` | L | root and web compile; every API and repository boundary validates; drift tests fail on incompatible changes |
| 2 | Repair collection-specific Firestore rules and align Storage role handling | `urai-content` + `urai-privacy` | M | emulator tests cover public/private, owner/admin, role/roles, invalid document and cross-user cases |
| 3 | Add upload constraints and quarantine metadata | `urai-content` + storage operator | M | size/MIME restrictions, rejected fixture tests and safe post-upload state |
| 4 | Add schema version, migrations and compatibility policy | `urai-content` | L | migration runner, fixtures from old versions, rollback and idempotency tests |
| 5 | Add pagination, transactions and soft-deletion semantics | `urai-content` | L | concurrent revision test, cursor tests, tombstone and purge tests |

## Production foundation

| Order | Deliverable | Owner | Size | Acceptance and proof |
| --- | --- | --- | --- | --- |
| 6 | Prove Firebase Auth, Firestore, Storage and indexes in staging | platform owner | L | deployed rules/index logs and two-user creator/admin E2E evidence |
| 7 | Implement backup, restore, retention and deletion receipts | platform + privacy | XL | backup artifact, restore drill, export/delete/purge evidence |
| 8 | Establish observability and incident controls | platform owner | M | structured logs, request IDs, dashboards, alerts and incident runbook test |
| 9 | Certify reproducible deployment and rollback | platform owner | M | deploy URL, live SHA, immutable artifact, rollback SHA/URL and smoke output |

## Ecosystem integration

| Order | Deliverable | Owner | Size | Acceptance and proof |
| --- | --- | --- | --- | --- |
| 10 | Publish versioned integration envelope and consumer fixtures | `urai-content` | M | contract package and compatibility tests |
| 11 | Connect Studio editorial workflow | `urai-studio` + content | L | draft/review/publish/unpublish and audit E2E |
| 12 | Connect Jobs and Asset Factory | `urai-jobs` + `asset-factory` + content | XL | idempotent job, retry/dead-letter, budget gate, receipt and checksum |
| 13 | Connect Spatial and Storytime consumers | consuming repos + content | L | replay/scene package rendering and fallback tests |
| 14 | Connect Privacy and Analytics | privacy/analytics owners | L | consent decision, event allowlist and deletion propagation tests |

## Content expansion

| Order | Deliverable | Owner | Size | Acceptance and proof |
| --- | --- | --- | --- | --- |
| 15 | Canonical taxonomy, collection and relationship models | `urai-content` | M | validated registry, migration and query tests |
| 16 | Replay, media timeline and accessibility manifest schemas | content + spatial | L | captions, transcript, audio description, reduced-motion and consumer tests |
| 17 | Media ingestion and variant pipeline | asset/jobs/content | XL | thumbnails, mobile variants, checksums, provenance and signed delivery proof |
| 18 | Localization registry and review workflow | content + Studio | XL | locale catalog, missing-key report, fallback/RTL/pluralization tests |
| 19 | Prove nineteen-language readiness | localization owner | XL | per-language completeness, human review, localized media and moderation/search evidence |

## Intelligent content platform

| Order | Deliverable | Owner | Size | Acceptance and proof |
| --- | --- | --- | --- | --- |
| 20 | Provider-neutral generation interfaces | content + asset factory | L | text/image/audio/video/translation/moderation interfaces and test doubles |
| 21 | Cost, idempotency and receipt governance | jobs + finance owner | L | dry-run, budget limits, duplicate protection, measured cost and receipt verification |
| 22 | Privacy-safe search and embeddings | content + privacy | XL | index/delete/reindex tests, consent policy and multilingual relevance evaluation |
| 23 | Moderation and recommendation services | content + privacy | XL | explainable decisions, language coverage, appeals and safety evaluation |

## Global scale and long-term platform

| Order | Deliverable | Owner | Size | Acceptance and proof |
| --- | --- | --- | --- | --- |
| 24 | Regional policy and retention profiles | legal/privacy | XL | approved policy matrix and enforcement tests |
| 25 | Scalable delivery, indexing and disaster recovery | platform owner | XL | load tests, cache invalidation, restore objectives and regional failure drill |
| 26 | Versioned SDK and partner APIs | content | XL | stable SDK, authentication, quotas, deprecation policy and partner sandbox |
| 27 | Durable user-owned export package | content + privacy | XL | documented open format, checksums, provenance, portability and re-import test |
| 28 | Advanced spatial/XR content packaging | content + spatial | XL | versioned scenes, accessibility metadata, device variants and rollback-safe delivery |

## Release certification

A release is certified only when source CI, schema/rules emulator tests, provider-backed staging E2E, security/privacy checks, deployed smoke, observability alerts, backup/restore and rollback evidence all reference the same release SHA.
