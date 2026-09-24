# URAI Ecosystem Integration Contract V1

## Authority split

The URAI launch chain is:

`UrAi -> urai-jobs -> urai-content -> asset-factory -> urai-spatial -> urai-studio -> B2Bportal`

Two contracts have intentionally separate authority:

1. **Whole-ecosystem base**
   - authority: `LifeLoggerAI/UrAi`
   - path: `docs/contracts/URAI_ECOSYSTEM_SCHEMA_V1.json`
   - id: `urai://contracts/ecosystem-schema-v1`
   - owns the shared cross-repository entity shapes for users, memories, emotional fields, Life Map nodes, generated assets, spatial scenes, jobs, base content packs, B2B accounts and XR scene objects.

2. **Content governance extension**
   - authority: `LifeLoggerAI/urai-content`
   - path: `docs/contracts/URAI_CONTENT_ECOSYSTEM_EXTENSION_V1.json`
   - id: `urai://contracts/content-ecosystem-extension-v1`
   - owns Content-specific lifecycle, visibility, integration-target, entitlement/provenance and publication-governance constraints.

Never publish two materially different schemas under the same contract id.

## Content-specific obligations

- Keep Content pack IDs, slugs and versions stable.
- Preserve downstream asset/scene references without taking ownership of Asset Factory or Spatial domains.
- Preserve moderation, release, provenance, accessibility, localization, visibility, entitlement and rights boundaries.
- Keep provider-backed and paid behavior fail-closed until its owning system authorizes activation.
- Do not claim a downstream system is live from schema compatibility alone.
- Consumer repositories must pin or validate the exact base/extension versions they support and re-prove compatibility after changes.

## Domain owners

- `UrAi`: launch-facing ecosystem base and public runtime composition.
- `urai-jobs`: durable asynchronous execution.
- `urai-content`: Content schemas, content-pack governance, editorial/publishing contracts and Content extensions.
- `asset-factory`: generated asset production/promotion.
- `urai-spatial`: immersive runtime and scene consumption.
- `urai-studio`: creator/admin authoring and approval orchestration.
- `urai-privacy`: consent, retention, export/delete and privacy release gates.
- `B2Bportal`: enterprise intake/account operations.

No repository may infer production activation from the presence of these contracts.
