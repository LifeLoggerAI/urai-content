# URAI Ecosystem Integration Contract V1

Content repo is the schema/content-pack governance owner in the URAI chain:
`UrAi -> urai-jobs -> urai-content -> asset-factory -> urai-spatial -> urai-studio -> B2Bportal`

Use `URAI_ECOSYSTEM_SCHEMA_V1.json` as the shared contract.

Content-specific obligations:
- Keep `contentPack.slug` and versioning stable for downstream consumers.
- Ensure content packs map to generated asset IDs and scene IDs.
- Keep moderation/release controls and fallback content for no-secret environments.
