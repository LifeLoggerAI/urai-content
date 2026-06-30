# Creator and Operator Proof

Starting SHA: 4366390d7691d0cf5b3e728f2452c729a75b893f
Ending SHA: final branch head after proof commits; see PR/final response.
Branch: production-lock-content-2026-06-30
Evidence scope: source-level API inspection and schema fixes.

## Creator submissions

Status: PARTIAL/GATED.

Source-level evidence:

- Submission create validates JSON input.
- Submission create requires a signed-in creator-level role and matching creatorId.
- Submission list requires a creator-level session and returns only current creator records.
- Submission detail checks owner/operator scope.
- Production writes are unavailable when Firebase Admin is missing.
- Root schema now matches runtime shape and statuses.

Required proof:

- CI test pass.
- Firebase-backed staging write/read proof.
- Browser creator flow proof.
- Cross-owner denial proof.

## Operator moderation

Status: PARTIAL/GATED.

Source-level evidence:

- Queue, detail, and moderation routes require operator role checks.
- Moderation route writes status, notes, moderatedAt, moderatedBy, and logs moderation through repository interface.

Required proof:

- Provider-backed role claims.
- Deployed allowed/denied operator tests.
- Firestore moderation log persistence proof.
- Browser moderation proof.

## Unsafe claims blocked

No creator/operator UI or workflow should be called production-ready until provider-backed auth, persistence, audit, and deployed E2E evidence are attached.
