# R13 — Content publication admission remains HARD-OFF

**Status: review-only, NO-GO/HOLD.** This document records a safe interim boundary, not a finished publisher.

## Existing feature recovered

`src/publishing/release.ts` implements `evaluatePublication()` and `createPublicationReceipt()` with human approval, revision, rights, provenance, locale/translation, accessibility, asset checksums and release time. `src/governance/rights.ts` implements rights-review state and expiration. These are valuable existing contracts. Their receipt checksum alone is not a signed issuer identity or live IAM approval.

## Why R13 exists

The R11/R12 draft added `publicCatalogEligible` to the anonymous catalog query and direct Firestore Rules, but generic `serializeRuntimeContentRecord()` previously wrote `publicCatalogEligible=true` whenever a record's status and visibility were `published/public`. Generic Admin SDK writes can bypass client Rules and are not bound to a verified publication/revocation decision.

The Firestore-backed by-slug lookup also permitted `published/unlisted` full bodies through a public API despite no independent signed link-sharing authorization.

## Interim fail-closed behavior

- Generic Firestore upsert/revision serialization writes `publicCatalogEligible:false`, regardless of status and visibility.
- Restore does **not** automatically republish a previously eligible record.
- The anonymous Firestore-backed direct-slug lookup requires `publicCatalogEligible===true`, published/public status, and no retained-deletion state. Thus unlisted records, missing-marker legacy records, and generic published/public records are not anonymously served through this path.
- The separate catalog query, root/web client Rules and indexes remain as in R11/R12. The in-memory preview data catalog is **not** the production Firestore approval system and should not be mistaken for real release semantics.
- This draft intentionally provides **no new way to set eligibility true**. Do not manually flip the bit or bulk backfill. Approval must be independently designed and tested before the public endpoint becomes enabled.

## Required separate trusted public publisher (not implemented here)

1. Define authorized actor identity and purpose; source revision/version hash, content owner, current canonical C1 or other appropriate consent (when user-related), audience and permitted publication scope.
2. Reuse the existing rights/provenance/translation/accessibility/reviewer preflight while validating evidence with authoritative records and independently trusted service identity.
3. Build a minimal sanitized public projection separate from internal source records; do not expose owner identifiers, private body, reviewer notes, internal tier/admin/roadmap fields or unapproved media.
4. Bind each publication to immutable source hash, rights grant, approval, recipient and expiry; support signed revocation and CDN/GCS/purge acknowledgments.
5. Use least-privilege publisher IAM and a transactional, verifiable write protocol; never trust client-provided `status`, `visibility`, `publicCatalogEligible` or a bare hash as authorization.
6. Define unlisted-by-link policy with a separate audience-scoped capability only if rights and privacy explicitly allow it.
7. Prove actual Firestore SDK/Java21 emulator direct GET/list, wrong-owner, private, unlisted, missing-marker, deleted, revoked, late write and repeat/rollback negatives, in addition to Next route tests.

## Verification limits

The pure eligibility helper and regression tests ran in Node 22: 6/6 PASS against Git-blob-matched source. Existing repository Firestore fake tests were updated for fail-closed semantics, but **full TypeScript, Vitest, Java21 Firebase emulator, Next/browser, effective deployed Rules/IAM and production checks have not executed**. This draft must not be merged or deployed without an independent source review and complete regression suite.

**Production and private writer/deletion HOLD remain unchanged.** No user data, cloud objects or credentials were accessed.
