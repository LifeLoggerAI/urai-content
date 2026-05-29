# XR Content Pack Contract

Content packs consumed by spatial/studio must include:

- stable `slug`
- semantic `version`
- linked `assetIds[]`
- lifecycle status
- visibility boundary
- entitlement boundary
- provenance fields
- integration target
- failsafe status
- optional scene metadata for AR/VR rendering hints

## Expected payload shape

Use `contentPacks[]`, `spatialScenes[]`, and `xrSceneObjects[]` from `URAI_ECOSYSTEM_SCHEMA_V1`.

## Safety

If paid/provider-backed content is unavailable, publish demo-safe packs only. Do not expose private, draft, creator-owned, or tier-gated content through public XR routes.
