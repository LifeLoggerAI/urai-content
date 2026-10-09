# UrAi Content subject export — bounded source evidence

Implementation based on existing Content owner #96 at `4905adf60624efa5ca4b87f1484cb5ca261ad10d`, exact tree `4c881b4d014640013e88f534d1ddb47b3c2670e1`. Canonical Privacy owner #160 remains `3c28e41cdc8983dc27f1bee1b00e3c9e0907faf3`. Both heads were refreshed before publication. No repository AGENTS.md exists in the complete owner tree; existing CODEOWNERS/release instructions and main independent-review requirements remain applicable.

The parent tree has no `apps/web/src/app/api/privacy/export/route.ts`. Executing the actual parent canonical-consent source against `/api/privacy/export` fails the registered-purpose regression: actual `null`, expected `data.export`. Existing creator-source adoption and all other owner source are preserved.

## Implemented behavior

`GET /api/privacy/export` returns a buffered, deterministic JSON download of schema-defined subject records. Actual production session admission verifies revoked tokens and current enabled account/role, routes **data.export/C7** deliberately, and uses the existing canonical consent service. A memory.storage grant is not substituted. Caller-supplied target, collection or scope parameters are rejected. Anonymous/unbound/withdrawn/deletion-denied requests cannot read sources.

| Collection | Actual subject mapping |
| --- | --- |
| contentItems | createdBy equals current admitted UID |
| creatorSubmissions | creatorId equals current admitted UID |
| marketplaceItems | creatorId equals current admitted UID |
| userContentEntitlements | userId equals current admitted UID |
| telemetryEvents | userId equals current admitted UID |
| contentVersions | contentId from owned contentItems; exact version document ID and snapshot owner/content identity validated |

Canonical schema validation preserves source text, chronology, source labels, safety notes, entitlement facts and other supported subject fields. Unknown stored fields are explicitly outside this schema-defined export. Internal creator-submission moderation notes, reviewer identities and migration annotations are excluded and disclosed. Moderation queues and mixed-owner releases are not read. Four template collections lack subject attribution. All six unmapped registered scopes remain named in the manifest/payload, which always state `complete:false`.

Queries use actual Admin Firestore equality fields plus document-ID ordering/cursors, with no arbitrary caller collection. Strict UTF-8 cursor monotonicity, schema/owner/document identity checks reject corrupt or foreign results. Records and payload JSON have deterministic key/row ordering; the manifest retains record/collection counts, exact payload UTF-8 byte count and SHA256. Random request identity is outside the hashed payload. No artifact, signed capability, cache, remote processor receipt or delivery assertion is created.

One shared operation deadline covers initial Auth admission, every before/after-read current-authority recheck, every source read and final admission. The exact same actor, role, own-export permission and canonical consent must remain current. Bounds: 100-row pages, 1,000 records, 100 queries, 2 MiB complete response, 20 seconds. Over-limit returns HTTP413/export_limit and an explicit privacy-operator recovery action; it returns no truncated file and performs no automatic retry. Abort returns499/export_cancelled promptly even while initial Auth, current-authority or Firestore I/O stalls. Already submitted SDK reads can settle later; cancellation prevents further source/provider processing dispatch and data response. Auth/canonical/database systems are not one atomic transaction or point-in-time snapshot, and delivered bytes cannot be recalled.

Response headers enforce `Cache-Control: private, no-store`, no-cache, nosniff and no-referrer. Source/provider errors expose no details. The scan's consistency is declared `bounded-current-authority-scan`; it is not a transaction-wide backup.

## Verification

Executed actual-source harness `node --test apps/web/scripts/content-data-rights-export.test.mjs`: **31 PASS**, zero skipped/failed, Node24.19.0. It loads real TypeScript handler/session/canonical-consumer/collector/schema bytes via Node transform; only the server-only build marker and Auth/Firestore/canonical transport I/O are replaced by labeled isolated synthetic fixtures. Covered successful six-collection download and empty state, source/rights preservation, payload hash/determinism, actual ownership query constraints, 101-row successful pagination, exclusion of internal/foreign data, unknown/malformed source rejection, cancellation and late Auth settlement, stalled current-authority deadline, cross-account/role/revocation/consent races, query/record/byte limits and usable limit recovery. Actual parent purpose source fails its regression before this change.

Retained actual-source canonical consumer harness: **27 PASS**. Selected strict TypeScript5.9.3 route/dependency compile PASS with cached Admin13.10 and Zod3.25.76. These are supplemental local source proofs; the Content frozen locked SDK is separately verified by its native workflows. No actual cloud/private-provider delivery, deployed browser, loaded emulator or independent organizational acceptance follows from the synthetic fixtures or selected compile. Exact candidate native CI/build/lint/whole-test results must be read back before owner admission.

## Deliberately open acceptance

Protected canonical project/region binding remains unset and the central Content consumer registry stays pending. No config, secret, source rights, purpose, spending or provider authority is invented. This source adds a partial local Content export API; it does not dispatch the central twelve-collection contributor, implement account-wide deletion, remote processors/queues/caches/backups, or provide their successful lifecycle receipts. Full registered coverage needs governed mappings for the six named scopes, central export integration, actual protected runtime authority, native SDK/database/index/browser checks, authorized success/withdrawal/deletion/recreation workflows and genuine independent review. Existing UI integration remains a separate adopted acceptance condition.

No main merge, deployment, release approval, registry activation, paid execution or full privacy/estate acceptance is represented. Existing owner #96 remains the sole integration destination.
