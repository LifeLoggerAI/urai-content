# Auth and RBAC Proof

Starting SHA: 4366390d7691d0cf5b3e728f2452c729a75b893f
Ending SHA: final branch head after proof commits; see PR/final response.
Branch: production-lock-content-2026-06-30
Evidence scope: source-level inspection.

## Source-level status

- Auth helper reads Bearer tokens through Firebase Admin when configured.
- Header auth is local/test convenient behavior and is off by default in production unless URAI_ENABLE_HEADER_AUTH=1.
- RBAC helpers define public, user, creator, studio, admin, and internalAdmin permission groups.
- Creator submission create path requires signed-in creator/studio/admin/internalAdmin role and matching creatorId.
- Creator submission read-by-id uses owner/admin access checks after record lookup.
- Admin seed, queue, detail, and moderation routes require admin or seed token where applicable.

## Source-level safety result

Status: PARTIAL/GATED.

The source design fails closed for production persistence when Firebase Admin is absent and enforces role/owner checks in server route code. However, provider-backed Firebase Auth custom claims, deployed browser role proof, and live denied/allowed tests are missing.

## Required proof before READY

- Firebase Auth provider configured in staging and production.
- Test users/claims for anonymous, user, creator, studio, admin, internalAdmin.
- Browser/API tests proving anonymous denial, user denial, creator owner allow, creator cross-owner deny, admin allow.
- Confirm URAI_ENABLE_HEADER_AUTH is unset or 0 in public production.
- If header auth is needed internally, prove trusted proxy strips spoofed incoming headers.
