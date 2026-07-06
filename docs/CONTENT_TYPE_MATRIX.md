# URAI Content Type Matrix

Maturity values: verified production, implemented and tested, implemented but unverified, partial, scaffold only, documentation only, missing, blocked, obsolete.

| Area | Content type | Evidence | Maturity | Primary gap |
| --- | --- | --- | --- | --- |
| Core text | UI, onboarding, help, privacy, accessibility, status, errors, marketing, SEO | `content/`, `src/lib/content/`, public page registries | implemented and tested | no unified localization catalog or editorial ownership workflow |
| Templates | Narrator prompts | `narratorPromptSchema`, seed data | implemented and tested | no provider execution/version receipt |
| Templates | Story templates and beats | `storyTemplateSchema` | implemented and tested | no durable media/replay rendering pipeline |
| Templates | Ritual templates | `ritualTemplateSchema` | implemented and tested | no safety-review workflow evidence |
| Editorial | Creator submissions | schema, APIs, Firestore adapter, tests | implemented but unverified | staging persistence and owner-scope proof missing |
| Editorial | Moderation queue and release records | schemas, admin APIs, repository methods | implemented but unverified | durable audit/release proof missing |
| Marketplace | Marketplace items and entitlements | schemas, routes, rules | partial | rules/schema mismatch, payment and entitlement proof missing |
| Export | Export templates | schema and package services | implemented and tested | only templates, not artifact generation |
| Export | Export jobs/artifacts | production schema and seed records | scaffold only | worker, storage, checksums, retries and authorization missing |
| Media | Asset manifests | `assetManifestSchema` | scaffold only | no ingestion, variants, transcoding or object proof |
| Media | Images, thumbnails, audio, video, captions, subtitles | manifest kinds and docs | documentation only | processing and delivery pipelines missing |
| Spatial | 3D/XR content packs | XR contract docs and generic manifests | documentation only | no versioned runtime assets or consumer proof |
| Personal life | Memories, journals, life events, reflections, goals, routines | no canonical schema in audited runtime | missing | should be owned by privacy-governed personal-data service |
| Personal life | Relationship, family, legacy and place memories | no canonical schema | missing | define references and consent boundaries, not copied records |
| Personal life | Voice transcripts and imported personal data | no ingestion schema/lifecycle | missing | privacy classification, consent, retention and deletion required |
| Replay | Replay manifests and emotional beats | story/export concepts only | partial | dedicated replay schema, media timeline and provenance missing |
| Structured | Taxonomies, tags and collections | tags arrays only | partial | registry, hierarchy, governance and migrations missing |
| Structured | Localization keys and translations | locale fields/localization map | partial | language registry, key completeness and review state missing |
| Structured | Provenance and AI attribution | `provenanceRecordSchema` | scaffold only | not wired to every write/generation path |
| Structured | Consent | `consentRecordSchema` and rules | scaffold only | consent authority and lifecycle integration missing |
| Structured | Rights and licenses | `contentLicenseSchema` | scaffold only | legal review, enforcement and artifact proof missing |
| Structured | Revision history | `contentVersionSchema`, repository methods | partial | race-safe transactions and immutable history missing |
| Structured | Retention/deletion | hard delete only | missing | tombstones, purge jobs, export/deletion receipts missing |
| Search | Keyword discovery | runtime substring scan | partial | pagination, indexes, ranking and multilingual support missing |
| AI | Text/image/audio/video/translation/moderation providers | evidence scripts/docs only | missing | provider-neutral interfaces and implementations missing |

## Required canonical fields

Every durable content record should define:

- stable ID and schema version;
- owner/tenant or explicit system ownership;
- content type and lifecycle state;
- privacy classification and visibility;
- locale, translation status and source locale;
- accessibility alternatives;
- provenance, author and generation attribution;
- consent reference where personal data is involved;
- rights/license state;
- revision and parent relationships;
- retention, archival and deletion state;
- media variants, checksums and source receipt;
- moderation and publication state.

## Language readiness

The audited repository does not prove nineteen-language readiness. It supports locale strings and a localization object, but has no authoritative locale registry, translation catalogs, completeness report, review states, RTL validation, localized media/captions or per-language moderation/search evidence.
