# URAI Content Roadmap — Current Convergence Authority

Current candidate: PR #84 on `converge/content-terminal-runtime-future-20260923`.

This file describes the current execution state. Historical July roadmap text is superseded where it conflicts with this record. A source-complete or hard-off foundation is not equivalent to merged, deployed, provider-backed, human-approved, or production-live proof.

## Launch-required convergence

| Capability | Current state | Remaining proof / boundary |
| --- | --- | --- |
| Public authority + dependency remediation | source-complete in #81 lineage and inherited by #82/#84 | fresh #84 exact-head CI, independent review, merge/main proof |
| Editorial/archive design | source-complete in #82 lineage and inherited by #84 | fresh #84 visual/source proof and review |
| Firestore/Storage security rules | source + emulator implementation carried from #66 into #84 | fresh #84 emulator/CI, protected deploy and authenticated cloud proof |
| Runtime Firestore validation | implemented in #84 | exact-head web tests/build; protected provider-backed proof |
| Schema versioning/migration | v1 migration/compatibility foundation implemented in #84 | production migration dry-run against real governed data remains protected |
| Pagination | bounded deterministic cursor foundation implemented in #84 | wire provider queries to cursor/index strategy where live persistence requires it |
| Revision/concurrency | optimistic revision + tombstone foundation implemented in #84 | Firestore transaction-backed atomic revision allocation still requires provider adapter implementation/proof |
| Retention/restore/purge | soft-delete/restore/purge eligibility foundation implemented in #84 | durable purge worker and privacy-governed production receipts |
| Deployment | source/runtime scaffolds exist | protected hosting target, DNS/TLS, exact deployed SHA, smoke, monitoring and rollback |
| Independent review | not satisfied for #84 | request only after exact head freezes |

## Hard-off future foundations implemented before launch

| Capability | State | Activation boundary |
| --- | --- | --- |
| Deterministic export manifests | COMPLETE / HARD-OFF FOUNDATION | durable Jobs/Storage path + auth/privacy + deployment proof |
| Narrator contract | COMPLETE / HARD-OFF FOUNDATION | consent/provider/voice approval and accessibility acceptance |
| Marketplace lifecycle | COMPLETE / HARD-OFF FOUNDATION | legal/business approval, commerce/payout architecture, provider/payment proof |
| Taxonomy + relationships | COMPLETE / INTERNAL FOUNDATION | governed production data + migration/query adoption |
| 20-locale registry | COMPLETE / INTERNAL FOUNDATION | locale translations, native review, RTL/font/glyph QA, production admission |
| Translation bundles/staleness | COMPLETE / HARD-OFF FOUNDATION | reviewed translations and optional provider authorization |
| Accessibility manifests | COMPLETE / INTERNAL FOUNDATION | asset/runtime population and human/device acceptance |
| Provider generation governance | COMPLETE / HARD-OFF FOUNDATION | explicit provider authorization, credentials, cost/consent gates |
| Privacy-safe search contracts | COMPLETE / HARD-OFF FOUNDATION | production index/embedding provider and privacy approval |
| Versioned search documents | COMPLETE / INTERNAL FOUNDATION | durable index worker + deletion/reindex proof |
| Portable content package | COMPLETE / HARD-OFF FOUNDATION | production export/import lifecycle + Privacy approval |
| Rights decision contract | COMPLETE / INTERNAL FOUNDATION | human/legal rights approval; technical provenance is never legal approval |
| Durable content-job contract | COMPLETE / INTERNAL FOUNDATION | canonical Jobs worker integration and provider-backed receipts |

## Ecosystem contract authority

The prior duplicate use of `urai://contracts/ecosystem-schema-v1` for incompatible schemas is superseded.

- V1 is historical compatibility only; `LifeLoggerAI/UrAi` is legacy containment / NEVER DEPLOY.
- Current cross-repository compatibility authority: `docs/contracts/URAI_ECOSYSTEM_SCHEMA_V2.json` under Content PR #84.
- Current consumer runtime/release authority remains `LifeLoggerAI/urai-spatial`.
- Stronger Content-specific governance remains in `docs/contracts/URAI_CONTENT_ECOSYSTEM_EXTENSION_V1.json`.
- Consumer sync PRs must adopt V2 additively and earn local CI/review; schema compatibility does not transfer runtime authority.

## Governed launch locales

The current governed set is exactly:

`en, zh-Hans, hi, es, fr, ar, bn, pt-BR, ru, ur, id, de, ja, sw, tr, vi, fil, ko, it, fa`

Only English is treated as production-admitted by the current source registry. The other nineteen remain gated pending real translation coverage and human review. This is a 20-locale program, not proof of 20 production-ready translations.

## External / protected-environment work

The following cannot be certified from repository source alone:

- protected Firebase project selection/configuration and deployed rules;
- authenticated two-user/admin/creator cloud isolation proof;
- provider-backed content persistence;
- durable Jobs/Storage worker execution and deletion propagation;
- production hosting, DNS/TLS and deployed SHA;
- monitoring/alert delivery and rollback rehearsal;
- legal/licensing approval;
- native localization review;
- final accessibility/device acceptance;
- genuine independent exact-head human review.

## Release certification rule

A production release is certified only when the same frozen release SHA has the applicable source CI, rules/emulator proof, provider-backed staging proof, security/privacy checks, deployed smoke, observability, rollback and required human approvals. No predecessor SHA evidence transfers.
