# URAI Content Security and Privacy Audit

Audit date: 2026-07-06

## Verified controls

- Firebase bearer-token verification is implemented server-side.
- Production header authentication is disabled unless explicitly enabled.
- Runtime writes fail closed in production when Firebase Admin is unavailable.
- Firestore and Storage include deny-by-default fallback rules.
- Creator submission and export paths are owner-scoped in rules.
- Secret scanning and governance checks are part of repository CI.

These are source-level controls. Deployed rules, production claims, tenant isolation, backups and deletion behavior remain unverified.

## Priority findings

### P0 — Runtime records bypass canonical validation

The web runtime duplicates root domain types and represents several durable records as `Record<string, unknown>`. The Firestore adapter casts document data directly to application types. Invalid, old or hostile records can cross the persistence boundary without Zod validation.

Required remediation: import one versioned schema package into the runtime and validate all reads, writes, API bodies, queue messages and migration outputs.

### P0 — Firestore rules conflict with schemas

Public reads for marketplace items and content packs use a helper that expects publication and visibility fields not consistently present in their schemas. This can produce accidental denial or future accidental exposure when fields drift.

Required remediation: define collection-specific public-read predicates and test them against canonical valid and invalid documents in the emulator.

### P0 — Storage claim and upload controls are incomplete

Storage checks only the single `role` claim while server auth and Firestore also support a `roles` array. Creator uploads have no explicit maximum size, MIME allowlist or extension/content validation.

Required remediation: align claim parsing and add path-specific size/type restrictions plus post-upload validation and quarantine.

### P0 — Personal-data boundary is undefined

The broader URAI product includes highly sensitive memories, relationships, locations and health-adjacent material. This repository must not silently become their canonical database.

Required remediation: publish a data-classification and ownership policy. Store only reusable system content or consented references/derived manifests; delegate private source records to privacy-governed services.

### P1 — Deletion, retention and recovery are not complete

The repository contract includes hard deletion but no tombstone, retention state, purge receipt, restore workflow or verified backup. Provider deletion propagation is not implemented.

Required remediation: add retention policies, soft deletion, immutable audit evidence, export-before-delete support, purge jobs, backup and restore tests.

### P1 — Version creation is race-prone

Firestore version numbers are calculated from the current list length. Concurrent writes can produce duplicate or conflicting versions.

Required remediation: use transactions or an atomic revision counter and verify concurrency behavior.

### P1 — Analytics ingestion needs abuse and privacy controls

Signed-in clients may create analytics records, but no deployed schema enforcement, rate limit or privacy-safe field allowlist is proven.

Required remediation: validate events, minimize identifiers, enforce consent, rate-limit ingestion and test deletion propagation.

### P1 — Header-auth configuration is operationally sensitive

Header auth is useful for local and controlled test environments. Enabling it in production transfers trust to upstream header stripping and authentication controls.

Required remediation: keep it disabled in production, or require a documented trusted-proxy architecture and deployment test.

## Required privacy metadata

Durable content should include privacy classification, owner/service owner, consent reference, source provenance, allowed uses, retention schedule, deletion state, export eligibility, provider disclosure and regional restrictions where applicable.

## Release security gate

Production certification requires:

1. canonical schema validation at every boundary;
2. Firestore and Storage emulator tests;
3. deployed rules and index evidence;
4. owner/admin isolation tests with two independent users;
5. upload size/type and malware/quarantine controls;
6. retention, export, deletion and restore tests;
7. secret and dependency scans;
8. production observability without sensitive payload leakage;
9. legal review for privacy, licensing and generated-content ownership;
10. exact deployment and rollback evidence.
