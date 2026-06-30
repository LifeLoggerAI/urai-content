# Firestore and Storage Rules Proof

Starting SHA: 4366390d7691d0cf5b3e728f2452c729a75b893f
Ending SHA: final branch head after proof commits; see PR/final response.
Branch: production-lock-content-2026-06-30
Evidence scope: source-level rules inspection and source edit.

## Firestore rules

Status: SOURCE-FIXED / BLOCKED ON DEPLOYED PROOF.

Verified source-level boundaries:

- Published public content read is allowed for public records.
- Content, content packs, marketplace writes are admin-only.
- Creator submissions read is admin or owner-scoped.
- Creator submissions create is creator role and owner-scoped.
- Export jobs read/create are owner/admin scoped at rules level.
- userContentEntitlements is canonical and owner/admin read, admin write.
- userEntitlements legacy alias is denied.
- Content licenses and consent records are owner/admin scoped.
- Provenance/system integrations are admin-only.
- Default fallback denies reads and writes.

## Storage rules

Status: SOURCE-LEVEL ONLY / BLOCKED ON DEPLOYED PROOF.

Verified source-level boundaries:

- public path is read-public and admin-write.
- creator-submissions path is creator owner write and owner/admin read.
- exports path is owner/admin read and admin write.
- licenses path is licensee/admin read and admin write.
- admin path is admin-only.
- default fallback denies reads and writes.

## Required proof before READY

- Firebase project selected.
- Rules deployed to staging.
- Emulator or staging tests for all allow/deny paths.
- Storage bucket configured.
- Rules deployed to production.
- Provider screenshots/logs recorded without exposing secrets.
