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


## 2026-11-01 R310 signed Content-to-Marketing handoff (draft PR #110)

The July audit table above is retained as historical evidence. **Current source change:**
\`src/publishing/marketing-release-envelope.ts\` now builds a five-minute Ed25519-signed release
envelope **only when** an injected trusted Content service authenticates the issuer request,
loads an immutable approved record, passes the existing Content \`evaluatePublication\` gate,
confirms the selected media SHA is in the exact approved revision, requires rights/claims,
accessibility, locale, owner and subject-consent authority where relevant, and confirms
nonrevocation before signing. The **private signing key must be server-owned**; no keys or
fake approval receipts are supplied in this repository.

Marketing PR #58 adds the corresponding signed-envelope verifier, current-authorization
lookup, actual media-byte SHA check and atomically claimed **review-only local ledger**.
This creates a tested **internal source-contract**, not a deployed Content-to-Marketing
API, not a real provider credential binding, and not an authorization to post.

### Required further acceptance
- Trusted production service authentication, verified role/approval lookup and immutable
  approval storage wired to real database/provider records (NOT request JSON).
- Independently verified current native account IDs/scopes, locale rights and canonical URL.
- Distributed transactional idempotency, revocation and audit-outbox provider adapter.
- Protected staging end-to-end tests, exact source-sha CI, rollback and independent review.

Local R310 cross-repo test harness: **18/18 passed** with synthetic credential-backed
authority fixtures. Content TS modules and their Vitest test source passed local TypeScript
compilation. The **eight new Content Vitest cases have not passed hosted CI**: latest
observed GitHub jobs failed with *zero executed steps*. Keep both PRs draft and never
infer live publishing from an internal signed receipt.
