# Security and Privacy Risk Audit

Starting SHA: 4366390d7691d0cf5b3e728f2452c729a75b893f
Ending SHA: final branch head after proof commits; see PR/final response.
Branch: production-lock-content-2026-06-30
Evidence scope: source-level inspection and edits.

## Auth

Status: PARTIAL/GATED. Server route checks exist. Provider-backed auth proof is missing.

## RBAC

Status: PARTIAL/GATED. Role helper foundations exist. Deployed role-claim tests are missing.

## Owner scope

Status: PARTIAL/GATED. Creator submissions and several rules use owner checks. Provider-backed denied/allowed proof is missing.

## Public/private boundary

Status: PARTIAL. Public content reads are limited to published/public in source paths/rules. Deployed proof is missing.

## Upload validation

Status: BLOCKED. Storage rules exist but upload API/type/size/scan lifecycle is not verified.

## Export privacy

Status: BLOCKED. Export storage owner paths exist in rules, but job/artifact/download/revocation lifecycle is not verified.

## Telemetry privacy

Status: PARTIAL/BLOCKED. Telemetry schema exists. Privacy-safe deployed ingestion and retention proof are missing.

## Secrets/env

Status: PARTIAL. .env.example was hardened to warn against committed secrets and public production header auth. Provider secret proof is missing.

## Privacy copy

Status: PARTIAL. Privacy pages/docs require legal review and must match actual data behavior after provider setup.

## High-priority risks

- Do not enable header auth on public production traffic without trusted proxy controls.
- Do not expose Firebase Admin secrets client-side.
- Do not activate payment/export/media features until lifecycle proof exists.
- Migrate legacy entitlement and creator submission records before production if any exist.
