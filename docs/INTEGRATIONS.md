# URAI Content Integrations

Audit date: 2026-07-06

## Verdict

The repository contains integration schemas, adapter interfaces, ecosystem documents and a mock adapter. It does not prove a live connection to another URAI repository or provider. Names in configuration or documentation do not establish a working integration.

| System | Current evidence | Maturity | Required proof |
| --- | --- | --- | --- |
| `urai-spatial` | adapter ID and XR contract docs | documentation only | versioned fixtures and staging consumer test |
| `urai-studio` | adapter ID and generic contract | scaffold only | authenticated editorial publish and rollback test |
| `asset-factory` | adapter ID and asset-manifest schemas | scaffold only | idempotent generation job, budget gate, receipt and checksum |
| `urai-storytime` | story/narrator schemas | missing | explicit adapter and ownership contract |
| `urai-marketing` | public copy and SEO schemas | missing | approved immutable release package |
| `urai-jobs` | no production adapter | missing | queue, retry, dead-letter and callback contracts |
| `urai-analytics` | adapter ID and telemetry schema | scaffold only | allowlisted events and deletion propagation test |
| `urai-privacy` | adapter ID and consent schema | scaffold only | consent decision and revocation propagation test |
| Firebase Auth | server token verification code | implemented but unverified | staging token and claim tests |
| Firestore | repository adapter and rules | implemented but unverified | emulator and deployed provider-backed CRUD proof |
| Firebase Storage | rules only | scaffold only | constrained upload, delivery and deletion proof |
| Vercel | manual guarded deploy workflow | implemented but unverified | successful deploy artifact, URL, live SHA and rollback |
| Search | in-process substring search | partial | indexed multilingual search and deletion/reindex proof |
| Payments | schemas and backlog | blocked | webhook and entitlement lifecycle proof |
| AI providers | evidence gates only | missing | provider-neutral interfaces, cost controls and receipts |

## Mock adapter truth

`src/integrations/adapters.ts` returns mock remote IDs and warnings that no external write occurred. Mock health is useful in tests but must never count as production evidence.

## Required contract fields

Each integration needs a schema version, request ID, idempotency key, service identity, ownership/privacy class, consent and provenance references when applicable, payload checksum, retry/deadline policy, paid-work authorization, safe errors, output receipt and deletion state.

## Production acceptance gate

An integration becomes production-ready only after producer and consumer schemas, authentication, contract tests, staging end-to-end proof, timeout/retry/idempotency tests, privacy and deletion tests, observability, disable/rollback evidence and exact deployed SHAs are attached.
