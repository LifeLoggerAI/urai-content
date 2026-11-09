# Reconstructed Content architecture and cross-system graph
## Actual code planes
**Static/public:** `content/brand`, `demo`, `legal`, `pages`, `seo`, `sprites` → loaders/validators `src/lib/content/*` → content index and catalog → Next.js web page/API presentation. Static content does not prove private user data ingestion.

**Durable editorial:** root `src/schemas/content.ts`, `src/backend/contentService.ts`, `src/editorial/workflow.ts`, `src/publishing/release.ts`, `src/governance/rights.ts`; web runtime `apps/web/src/server/content/{schemas,service,types,runtimeCatalog}.ts` and `apps/web/src/server/firebase/contentRepository.ts`. Schema sets differ: catalog `live/demo/prototype/planned/internal/archived` vs editorial `draft/review/approved/published/archived`. Firestore has contentItems/contentVersions/creatorSubmissions/marketplace/entitlements/moderation/publishing/telemetry/template collections. There is no verified single canonical migration across all planes.

**Private:** creator POST/GET and admin moderation API routes exist on main, but actual private-personal-data admission currently lacks a certified canonical Privacy decision. #96 supplies C1 `memory.storage` and C7 `data.export` requests via configurable Privacy callable service, real-token current account checks and bounded own-data export. Those are branch-source changes, not proven live provider access.

## Dependencies declared in `src/integrations/registry.ts`
| Provider/consumer | Content launchMaximum (source) | Responsibility | Source vs operational proof |
|---|---|---|---|
| urai-privacy | disabled | canonical consent, retention and deletion policy | #96 source-only C1/C7 bridge; no live receipt |
| urai-jobs | synthetic | durable asynchronous jobs | contract only in Content; no live signed dispatch |
| asset-factory | synthetic | generated asset provenance/promotion | local proof/synthetic content; actual promoted media absent |
| urai-spatial | synthetic | immersive UrAi world/scene consumption | no live owner-only Replay/device adoption |
| urai-studio | synthetic | creator studio/media orchestration | Studio exists independently; protected source integration absent |
| urai-storytime | disabled | private story/share lifecycle | Storytime separate callable foundation; no Content private data release |
| urai-analytics | synthetic | aggregate signal processing | API/event contract without provider lineage proof |
| urai-marketing | synthetic | public campaign content delivery | #110 issuer envelope not live |
| urai-communications | disabled | email/SMS delivery | provider adapters in sibling, no authorized Content distribution |
| b2bportal | disabled | professional/enterprise operations | no deployed tenant consent linkage |

`src/integrations/envelope.ts` defines producer/consumer, trace/idempotency, content version, provenance, optional consent and payload checksum, but *creating an envelope is not a transport or subscriber receipt*. `src/generation/contracts.ts` similarly implements a provider decision, not an external model call. `src/exports/jobs.ts` implements state transitions, not an external durable worker.

**Ownership priority:** private data decisions belong to Privacy; durable work to Jobs; asset promotion to Asset Factory. Content should curate/publish rights-approved, licensed content without minting private memory consent or ownership. Historical `LifeLoggerAI/UrAi` is a quarantined reference, not current consumer deployment authority. Cross-system source matches and cloud project IDs must be reconciled with actual authenticated deployed identities.
