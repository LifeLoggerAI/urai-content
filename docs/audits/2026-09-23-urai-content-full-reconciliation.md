# URAI Content Full Reconciliation — 2026-09-23

Status: **execution record / exact-head successor required after this file is committed**

This document reconciles current URAI Content authority discovered across GitHub and Google Drive. It is not production-live certification and does not transfer review, CI, deployment, provider, legal, or runtime evidence between different SHAs.

## 1. Authority map

- `main`: `4b38589be76dff88e310fc11b9bba5ce8b793d19`
- PR #81: `75e2343c9cdf34f4a67b3806e67307400b580e1c` — public-authority / dependency / press terminal candidate; 6/6 exact-head workflows previously green; unmerged and undeployed; independent reviewer eligibility remains admin-blocked.
- PR #82: `dbb6df12dd43369be70542ba74d69c3c1fdd1ba7` — editorial/archive design child of #81; six commits ahead of #81; unmerged and undeployed.
- PR #66: `7818f6bd1c181efe60c9fc4da5626a44df3cedaf` — Firestore/Storage rules + emulator authority; diverged from main; unmerged and undeployed.
- PR #67: `e2b2ae5481a22514e005cfc79d6b0dcbf7c049b2` — prompt governance/evaluation authority; diverged from main; provider-backed semantic evaluation and fresh independent release review remain separate gates.
- PR #83: bounded post-launch expansion/prebuild lane. Re-fetch its live head before using any workflow evidence.

No PR above supersedes the others outside its documented scope. A final convergence must explicitly reconcile them and earn fresh proof on the resulting successor SHA.

## 2. Current canonical-system findings

### Separate content domains exist and are not yet one canonical runtime schema

The repository currently carries multiple related but incompatible content models:

1. public/catalog content under `src/lib/content/schema.ts`, with catalog lifecycle states such as `live`, `demo`, `prototype`, `planned`, `internal`, and `archived`;
2. editorial/runtime content under `src/schemas/content.ts` and the content service, with workflow states such as `draft`, `review`, `approved`, `published`, and `archived`;
3. duplicated web runtime/catalog type and schema definitions under `apps/web`.

This is a real authority boundary, not a documentation-only issue. Do not collapse these types without a migration/compatibility plan and fresh package + web proof.

### Ecosystem schema is copied across repositories

`docs/contracts/URAI_ECOSYSTEM_SCHEMA_V1.json` is present across Content, Jobs, Asset Factory, Spatial, Studio and B2B. The Content copy is materially richer than multiple sister-repository copies that accept broad arrays without the same detailed definitions.

Classification: **schema-drift risk / versioned distribution strategy still required**.

### Security-rules hardening exists but is not main/live authority

PR #66 provides:
- collection-specific public-read predicates;
- scalar and list role-claim compatibility;
- creator owner boundaries;
- upload size/MIME restrictions;
- analytics owner/shape/event allowlisting;
- deny-by-default fallbacks;
- Firebase emulator behavior tests.

Classification: **source candidate complete for that slice / unmerged / undeployed / independently gated**.

### Dependency remediation exists but is not main authority

PR #81 carries the bounded dependency remediation lineage that records zero root and web vulnerabilities and six successful exact-head workflows.

Classification: **source candidate solved / main still older graph / review + merge + fresh main proof required**.

## 3. Work completed in PR #83 during the 2026-09-23 audit

### Stable package exposure

The expansion modules are exported from `src/index.ts` and covered by a public-package regression test.

### Deterministic export foundation

Includes:
- deterministic artifact manifests;
- SHA-256 checksums;
- normalized source references;
- manifest verification;
- idempotency derivation;
- traversal rejection.

This does not activate a production export worker or storage path.

### Provider-neutral Narrator foundation

Includes:
- synthetic session contract;
- consent and quiet-hours boundaries;
- captions/transcript/silence equivalents;
- provenance/source references.

Provider dispatch and personalized voice remain disabled.

### Hard-off marketplace foundation

Includes:
- rights-holder/license/provenance fields;
- governed lifecycle;
- moderation requirement;
- terminal withdrawn/revoked states;
- synthetic entitlement receipts.

Checkout, payment capture, seller payouts and unrestricted uploads remain disabled.

### Taxonomy and relationship foundation

Includes:
- canonical term IDs/slugs;
- parent-reference validation;
- duplicate detection;
- alias normalization;
- provenance-bound typed content relationships.

### Localization governance foundation

Includes:
- locale registry;
- LTR/RTL direction;
- registered fallback locales;
- draft/review/approved translation states;
- source-version and source-checksum binding;
- stale-translation detection;
- reviewer identity/timestamp required for approved translations.

This does not claim translated-language completeness and does not activate a translation provider.

### Accessibility manifest foundation

Includes:
- image alt-text requirement;
- audio transcript requirement;
- video captions + transcript requirement;
- animation/spatial reduced-motion equivalent requirement;
- provenance binding.

This is a contract foundation, not proof that every production asset currently has an accepted accessibility equivalent.

### Provider/cost/idempotency foundation

Includes:
- provider-neutral generation request contract;
- deterministic idempotency keys;
- provider-off and non-billable mock modes;
- explicit provider authorization requirement;
- positive bounded call and spend limits before provider dispatch.

No provider call is performed by this implementation.

### Privacy-safe search foundation

Includes:
- private/deleted content exclusion;
- tiered-content policy gate;
- user-derived content requiring policy authorization + consent reference;
- semantic/embedding indexing gated separately from text indexing.

No embedding provider or production search index is activated.

### Portable content-package foundation

Includes:
- deterministic portable package format;
- versioned record references;
- per-record checksums and provenance;
- artifact-manifest checksum references;
- deterministic package verification suitable for future export/re-import work.

No production export/import or storage migration is activated.

### Seeded authority truth repair

The seeded deployment record no longer incorrectly states that the standalone web app is absent. It now truthfully records that `apps/web` exists while hosting, DNS/SSL, deployed SHA, live smoke and rollback evidence remain outstanding.

## 4. Launch-required gaps that remain real

These are not closed by the expansion work:

1. Explicit convergence/restack of #81, #82, #66, #67 and any accepted #83 work onto one reviewed successor without transferring predecessor evidence.
2. Canonical schema/persistence convergence:
   - one intentional versioned schema authority across package/web/API/persistence boundaries;
   - runtime validation of Firestore/API records;
   - migration/compatibility policy and fixtures;
   - transaction-safe revision numbering;
   - pagination;
   - soft-delete/tombstone/purge semantics.
3. Protected Firebase/runtime evidence:
   - selected project/environment;
   - deployed Firestore/Storage rules;
   - authenticated user/creator/admin denial and isolation proof;
   - indexes/buckets;
   - provider-backed persistence.
4. Creator/editor/operator runtime proof:
   - create/read/list;
   - owner scope;
   - moderation approval/rejection;
   - audit evidence.
5. Durable export/media execution if in launch scope:
   - queue/worker;
   - retries, timeout, cancellation and dead-letter;
   - idempotent persistence;
   - authorized artifact storage/download/delete;
   - checksums and provenance receipts.
6. Observability and operations:
   - health/uptime;
   - error reporting;
   - alert route;
   - rollback rehearsal;
   - backup/restore/retention/deletion proof.
7. Localization production proof:
   - actual locale files/coverage;
   - untranslated-string scan;
   - native review;
   - RTL/font/glyph QA;
   - localized accessibility/captions/narration where applicable.
8. Accessibility production proof for final runtime/assets.
9. Legal/rights/licensing approval where human/legal judgment is required.
10. Independent exact-head human review.
11. Deployed URL, TLS/DNS, exact deployed SHA and public/runtime smoke evidence.

## 5. Post-launch capability classification

### HARD-OFF BUT PREBUILT / CONTRACT-COMPLETE FOUNDATION

- deterministic export manifests;
- Narrator session/consent/equivalent-media contracts;
- marketplace lifecycle/right/provenance/entitlement contracts;
- taxonomy and typed relationships;
- localization governance and stale-translation detection;
- accessibility manifests;
- provider authorization/cost/idempotency contracts;
- privacy-safe search-index decision contracts;
- portable content package format.

### FOUNDATION COMPLETE / RUNTIME IMPLEMENTATION DEFERRED

- durable provider-backed generation;
- production semantic search/embeddings;
- production translation pipeline;
- production export/re-import workers;
- production marketplace commerce/payouts;
- cross-repository schema distribution/SDK consumption.

### EXTERNALLY OR GOVERNANCE BLOCKED

- eligible independent review;
- protected environment/provider credentials and deployment proof;
- DNS/TLS/public deployment;
- production provider receipts;
- legal/licensing approval;
- human language/accessibility acceptance.

## 6. System-of-systems boundaries

Content is a supporting authority in a wider chain and must not duplicate other domain owners:

- Privacy owns consent, retention, export/delete and privacy release gates.
- Communications owns live communications/provider delivery.
- Spatial owns current immersive runtime authority.
- Asset Factory owns generated-asset production/promotion boundaries.
- Studio owns studio authoring/approval orchestration where established.
- Jobs owns durable async execution where established.

Content contracts may reference those systems, but provider activation or duplicated domain logic is not authorized merely by a shared schema or adapter stub.

## 7. Evidence rule

A green predecessor SHA is not proof for a successor.

After this reconciliation file is committed:
- re-fetch PR #83;
- bind all CI/workflow evidence to its new exact head;
- keep PR #83 draft until the exact-head matrix is terminal and any required review is valid;
- do not merge/deploy merely because contract tests pass.

## 8. Terminal classification for this audit pass

- **Main:** not production-live certified.
- **#81:** terminal source candidate for public-authority/dependency scope; unmerged/un-deployed/review blocked.
- **#82:** design child of #81; unmerged/un-deployed.
- **#66:** source-complete rules/emulator slice; unmerged/un-deployed/review gated.
- **#67:** governed prompt-source/eval slice; live-provider/manual-release evidence still separate.
- **#83:** post-launch/prelaunch-safe foundation lane; implementation materially expanded in this audit; exact-head CI must be re-earned after this file commit.

The remaining work is now narrower and explicit: convergence, canonical schema/persistence, durable runtime/provider paths, protected deployment proof, operations, production localization/accessibility proof, legal/rights decisions and independent exact-head human review.
