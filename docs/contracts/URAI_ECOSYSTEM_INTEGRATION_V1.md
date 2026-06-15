# URAI Ecosystem Integration Contract V1

Content repo is the schema/content-pack governance owner in the URAI chain:

`UrAi -> urai-jobs -> urai-content -> asset-factory -> urai-spatial -> urai-studio -> B2Bportal`

Use `URAI_ECOSYSTEM_SCHEMA_V1.json` as the shared contract.

## Consuming systems

- URAI Home/Core
- Jobs
- B2Bportal
- Asset Factory
- Analytics
- Communications
- Privacy
- Studio
- Spatial
- Admin
- Marketing
- Investors
- Foundation
- Licensing

## Content-specific obligations

- Keep `contentPack.slug` and versioning stable for downstream consumers.
- Ensure content packs map to generated asset IDs and scene IDs.
- Preserve moderation/release controls.
- Preserve visibility and entitlement boundaries.
- Keep fallback content for no-secret environments.
- Do not claim a downstream system is live unless that repo has its own smoke/deploy evidence.