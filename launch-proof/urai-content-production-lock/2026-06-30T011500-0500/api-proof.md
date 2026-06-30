# API Proof

Starting SHA: 4366390d7691d0cf5b3e728f2452c729a75b893f
Ending SHA: final branch head after proof commits; see PR/final response.
Branch: production-lock-content-2026-06-30
Evidence scope: source-level inspection.

## Source-level API coverage

- Health, version, catalog, and content routes: PARTIAL. Source exists. Deployed smoke is missing.
- Firebase status route: PARTIAL. Source exists. Provider evidence is missing.
- Seed route: GATED. Role or token guarded. It refuses writes without Firebase Admin.
- Creator submission routes: PARTIAL/GATED. Source exists. Role and owner checks exist. Provider persistence proof is missing.
- Moderation routes: PARTIAL/GATED. Source exists. Role checks exist. Provider audit proof is missing.

## Blocked APIs

- Export create, status, artifact, and download lifecycle APIs.
- Payment checkout API.
- Payment webhook API.
- Dedicated entitlement validation API.
- Privacy-safe telemetry ingest API.
- Media upload, delete, and revoke APIs.

## Required proof

- Root and web tests pass in CI.
- API route smoke against local build.
- API route smoke against staging.
- API route smoke against production.
- Auth denial and allow tests with provider-backed tokens.
- Deployed error-contract tests.
