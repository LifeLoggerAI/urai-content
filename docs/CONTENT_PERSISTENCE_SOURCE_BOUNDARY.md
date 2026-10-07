# Content persistence source boundary

The shared editorial contracts live in `src/schemas/content.ts`. Web schemas,
repository types, and the memory preview implementation import that authority.
The JSON catalog schema describes a separate public projection, with the existing
explicit mapping from editorial items; it is not an alternative editorial schema.

## Version and migration

New editorial writes carry runtime schema version **2**. Valid unversioned and
version 1 records remain readable through the canonical parser. Re-saving a
validated legacy record writes version 2 without changing its editorial fields.
Unsupported versions, invalid records, mismatched document identities, and deletion
markers on pre-version-2 records fail with explicit errors.

Migration fixtures are in `apps/web/tests/firestore-content-repository.test.ts`.
The fixture proves legacy/current round trips, version 1 to 2 writes, future-version
rejection, and unsafe deletion-marker rollback rejection. No production migration
has run. A version 1 reader rejects version 2 records; a rollback must preserve the
version 2 parser, tombstone barriers, and current rules once deletion is enabled.
Deploying an older reader/rules set over active tombstones is not a safe rollback.

## Atomic writes and bounded reads

`saveContentRevision` commits the content snapshot, revision, and validated counter
in one Firestore transaction. The content service and canonical seed call this
method. Existing revision destinations are read before any write, so a missing or
stale counter cannot overwrite history or publish an unversioned replacement.

Content pages use `orderBy('id')`, `startAfter`, and a provider limit of page size
plus one, capped at 101 documents. Deleted rows still advance the cursor. The
catalog API exposes `limit`, `cursor`, and `nextCursor`; its count is the current
page count. Detail lookup reads at most two records per canonical/legacy slug and
rejects ambiguous identities. Compatibility list methods fail explicitly above
100 records. History, entitlements, creator lists, telemetry and moderation queues
also use bounded provider reads. No oversized result is silently presented as a
complete compatibility list.

## Deletion remains disabled

Repository deletion operations default to disabled. Production service construction
does not pass an enablement option, and this change adds no deletion route, worker,
environment toggle, cloud mutation, or deployment. Explicit enablement exists only
as an injected repository option for synthetic tests and a future protected caller.

The prepared content-item path atomically retains the snapshot, writes a separate
tombstone, and stores a per-content deletion barrier. Owner identity, a separately
verified backup receipt covering the restore window, and an exact snapshot checksum
are required. Deleted reads and revision writes are blocked. Restore validates the
retained snapshot and the current clock deadline; it rejects backdating and already
deleted provider resources until rematerialization is separately implemented.

Purge requires the actual deadline and every applicable provider receipt. It deletes
the content, counter and at most 100 retained revisions in one transaction, retains
the permanent barrier, and persists a checksum-bound purge receipt. Larger histories
fail without partial deletion and require a separately reviewed multi-batch design.
Client administrators cannot hard-delete, alter lifecycle metadata, or recreate a
purged identity. Tombstones and barriers remain inaccessible through client rules.
The source path does not verify external receipt authenticity or operate providers:
protected backup/provider ownership, receipt verification, production migration,
deployed smoke, monitoring, rollback and independent review remain external gates.

## Verification

Root and web lint, typecheck, unit tests and build cover canonical identity and
telemetry constraints, atomic revision collisions, concurrent numbering, bounded
pagination, hidden retained data, checksum/owner/deadline failures, restore, provider
receipt immutability, purge and permanent anti-resurrection. The Firestore/Storage
emulator matrix covers public/private/owner/admin isolation, deleted records,
client lifecycle bypasses, metadata bounds and existing upload restrictions.
The exact PR head's native CI receipts determine source verification; this document
does not grant production acceptance or claim real backup/provider deletion receipts.
