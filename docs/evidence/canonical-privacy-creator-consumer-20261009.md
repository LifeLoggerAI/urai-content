# UrAi Content canonical Privacy creator consumer

Source parent: Content owner #96, `84415b5c715dac27a0f6fff4027e6173b75fe52a`.
Canonical contract inspected: Privacy owner #160,
`3c28e41cdc8983dc27f1bee1b00e3c9e0907faf3`,
`functions/src/consent-api.ts` and `functions/src/consent-decision.ts`.

## Implemented source behavior

Mounted creator submission collection/detail requests use canonical
`memory.storage` consent before a production session is returned. The actual
canonical callable rejects active account-deletion tombstones in its current
transaction; Content accepts only an exact subject, purpose, correlation,
current policy/tier, fresh ALLOWED result and nonempty decision-event identity.
It forwards the existing Bearer credential only to the configured Google
Functions canonical endpoint, denies redirects, disables response caching,
bounds response bytes and applies a five-second transport abort.

After that awaited decision, Content re-verifies token revocation and current
account role/entitlement intersection. Existing private creator handlers already
repeat the request verifier after source reads/writes; those checks now include
canonical consent and deletion rejection. Administrative cross-user queues are
not mistaken for owner-consent decisions. Public catalog/login/recovery paths do
not acquire unrelated optional-processing consent prerequisites.

Protected configuration must supply `URAI_CONTENT_PRIVACY_PROJECT_ID` and
`URAI_CONTENT_PRIVACY_REGION` only after the actual canonical project, deployed
callable, runtime identity and shared Auth audience have been verified. No values
are supplied by this change. Missing binding denies private creator admission;
it is not evidence of an operating successful integration.

## Executed evidence

- Node 24.19.0 native source-fixture harness: 27 cases PASS, zero skips.
- Unchanged parent session with the same harness: 24 FAIL / 3 PASS. It admitted
  synthetic withdrawn/missing consent, deletion denial, malformed/stale decision
  and post-await revocation fixtures because it never called canonical Privacy.
- Strict selected TypeScript compile PASS for actual consumer/session and their
  imports using cached TypeScript 5.9.3/Admin 13.10.0/Node types 25.9.1. This is
  supplemental, not the locked Admin 14.4.0 graph or declared runtime certification.
- The harness loads actual TypeScript through Node's transform, replacing only
  the server-only build marker and Auth SDK I/O. All canonical HTTP responses and
  Auth users in it are explicitly synthetic. It exercises the real consumer
  envelope, admission and post-await behavior, without external provider calls.
- The existing role-handler fixture receives explicit synthetic canonical
  consent to retain its original successful Auth/role tests. No assertion or
  production guard is removed.
- `npm test` in web runs this harness after the existing Vitest suite. Full
  Vitest/frozen installation/native CI remains required; this environment's
  offline cache did not contain Vitest 4.1.11.

## Open acceptance and limitations

No protected configuration, canonical cloud call, provider-backed lifecycle,
export/deletion contributor activation, deployment or independent approval is
represented. Content's canonical export contributor remains pending. This
bounded change does not create a new export route or replace the existing
retention/provider-deletion/purge contracts. Actual creator read/write success
plus canonical denial/revocation/deletion must be proved on the intended staging
identity and deployed source before adoption can be called integrated/accepted.

Auth and canonical Privacy are separate services; their reads and Content writes
are not one atomic transaction. Post-write denial suppresses the response but
cannot undo a write already committed, substitute for downstream deletion, or
recall previously delivered bytes. Same-UID Auth recreation, cross-user admin
target consent, provider copies, queues/caches/backups and release-wide privacy
propagation retain their own existing acceptance conditions.

Main, production, private family sources, paid services, Stripe LIVE, Apple
exclusion and Play internal-testing boundaries are unchanged.
