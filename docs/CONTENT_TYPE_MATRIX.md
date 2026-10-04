# URAI Content Type Matrix — Current Convergence Authority

Maturity values distinguish source foundations from production certification.

| Area | Capability | Current source state | Remaining boundary |
| --- | --- | --- | --- |
| Public catalog | public/demo content registry | implemented/tested lineage | fresh #84 proof + deployed public smoke |
| Editorial | content workflow schemas/services | implemented/tested lineage | provider-backed persistence and operator E2E |
| Editorial | creator submissions/moderation/releases | implemented + fail-closed runtime schemas | authenticated staging owner/admin proof |
| Revisioning | history/version records | implemented foundation | atomic Firestore transaction allocation still unproven |
| Lifecycle | stale-write detection | implemented foundation | provider-backed transaction enforcement |
| Lifecycle | tombstone/restore/purge eligibility | implemented foundation | Privacy-governed worker + retention receipts |
| Pagination | opaque bounded cursors | implemented/tested foundation | provider query/index wiring |
| Marketplace | governed lifecycle + entitlement receipts | hard-off implementation foundation | payments/payout/legal/provider gates |
| Export | deterministic manifests/checksums/idempotency | hard-off implementation foundation | Jobs/Storage execution and auth/download/delete proof |
| Jobs | durable Content job state contract | implemented foundation | canonical urai-jobs worker integration |
| Media | asset manifests | existing schema foundation | Asset Factory promotion + storage/delivery proof |
| Narrator | consent/quiet-hours/equivalent-media contract | hard-off implementation foundation | provider/voice activation + review |
| Taxonomy | hierarchy/aliases/deprecation/replacements | implemented/tested foundation | governed production registry adoption |
| Relationships | typed provenance-bound relationships | implemented/tested foundation | consumer integration and deletion propagation |
| Localization | governed 20-locale registry | implemented/tested foundation | 19 non-English locales are not production-admitted |
| Localization | translation lifecycle/staleness/bundles | implemented/tested foundation | real translated corpus + native review + RTL/font/glyph QA |
| Accessibility | image/audio/video/spatial manifest rules | implemented/tested foundation | populate final assets and human/device acceptance |
| Provenance | provenance records | existing production schema | must be wired to every durable generation/publication path |
| Rights | licenses + rights decision state | implemented foundation | human/legal approval and rights evidence |
| Consent | consent schema/rules | existing foundation | Privacy remains canonical authority; protected lifecycle proof |
| Search | privacy-safe index decision | hard-off implementation foundation | production index/embedding service |
| Search | versioned locale-aware search document | implemented/tested foundation | index worker/reindex/delete proof |
| Generation | provider-neutral authorization/cost/idempotency | hard-off implementation foundation | credentials, explicit authorization, provider receipts |
| Portability | deterministic package/checksum/re-import validation foundation | hard-off implementation foundation | real user export/import + Privacy approval |
| Ecosystem | whole-ecosystem base | authority restored to `LifeLoggerAI/UrAi` | consumer draft PR CI/review |
| Ecosystem | Content governance extension | implemented in #84 | consumer compatibility adoption |
| Security | Firestore/Storage rule hardening | carried into #84 from #66 | fresh #84 emulator + protected deploy proof |
| Runtime | Firestore record parsing | fail-closed Zod validation implemented in #84 | fresh web CI + protected provider evidence |
| AI prompt library | governed prompt source/evals | remains separate PR #67 authority | fresh independent human release review |

## Canonical durable-content expectations

Where applicable, durable Content records or their linked governance records must expose:

- stable identity and explicit schema/version authority;
- bounded-context content type and lifecycle state;
- ownership/privacy classification and visibility;
- locale, source-locale and translation review state;
- accessibility equivalents and review state;
- provenance and transformation/provider references;
- consent reference for user-derived/provider processing;
- rights/license state;
- revision and relationship references;
- retention/deletion state;
- media checksums/source receipts;
- moderation/publication state.

Not every field belongs physically on every record. Separate governed records are preferred over duplicating domain authority.

## Language readiness

The governed program contains 20 locales:
`en, zh-Hans, hi, es, fr, ar, bn, pt-BR, ru, ur, id, de, ja, sw, tr, vi, fil, ko, it, fa`.

The registry and governance contracts are implemented. Production translation completeness is **not** proven. Non-English admission remains gated by translation coverage, untranslated-string scans, native review, specialist legal/privacy review where applicable, RTL QA, font/glyph coverage, localized accessibility/media, screenshots/listings where required, and rollback identity.
