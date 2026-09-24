# URAI Ecosystem Integration Contract — Current Authority

## Current estate authority

- `LifeLoggerAI/urai-spatial` is the current consumer product/release authority.
- `LifeLoggerAI/UrAi` is legacy containment and **NEVER DEPLOY** under current estate canon.
- `LifeLoggerAI/urai-content` owns the current versioned Content/system-of-systems compatibility contract used for Content-facing cross-repository integration.
- Domain-specific repositories retain their own runtime authority; this contract does not transfer ownership of Jobs, Privacy, Assets, Spatial, Studio, Storytime, Analytics, Communications, Marketing or B2B behavior.

## Contract generations

### V1 — historical compatibility

`docs/contracts/URAI_ECOSYSTEM_SCHEMA_V1.json`

Contract id: `urai://contracts/ecosystem-schema-v1`

V1 exists because multiple repositories historically copied schemas under this identity. Those copies diverged. V1 is therefore retained for compatibility/history only and must not be used to infer current global authority.

### V2 — current compatibility contract

`docs/contracts/URAI_ECOSYSTEM_SCHEMA_V2.json`

Contract id: `urai://contracts/ecosystem-schema-v2`

V2 is the current governed cross-repository compatibility schema. It preserves the detailed historical entity shapes for users, memories, emotional fields, Life Map nodes, generated assets, spatial scenes, Jobs records, Content packs, B2B accounts and XR scene objects while adding additive governance fields.

### Content governance extension

`docs/contracts/URAI_CONTENT_ECOSYSTEM_EXTENSION_V1.json`

Contract id: `urai://contracts/content-ecosystem-extension-v1`

The Content extension applies stronger Content-specific lifecycle, visibility, integration-target and provenance requirements without redefining non-Content domain ownership.

## Domain owners

- `urai-spatial`: current consumer runtime/release composition.
- `urai-content`: Content schemas, packs, editorial/publishing contracts and Content-facing compatibility governance.
- `urai-jobs`: durable async execution.
- `urai-privacy`: consent, retention, export/delete and privacy release gates.
- `asset-factory`: generated-asset production and promotion.
- `urai-studio`: creator/admin authoring and approval orchestration.
- `urai-storytime`: private story generation/share lifecycle.
- `urai-analytics`: analytics/signal processing.
- `urai-communications`: provider delivery.
- `urai-marketing`: campaigns/publication.
- `B2Bportal`: enterprise intake/account operations.

## Compatibility rules

- Do not publish materially different schemas under the same contract id.
- A consumer must explicitly declare the V2 version it supports.
- Content pack IDs, slugs and versions must remain stable across consumers.
- Asset/scene/job/privacy references do not transfer domain ownership into Content.
- Mock/synthetic compatibility is not provider/runtime proof.
- Contract compatibility is not deployment certification.
- Production activation remains governed by the owning system's privacy, security, provider, review and release gates.
