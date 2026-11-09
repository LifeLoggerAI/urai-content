# ONE URAI GENESIS — Content PR #96 + #110–#112 converged source candidate (R116)
**Date:** 2026-11-08 UTC / Central. **State:** DRAFT REVIEW, NOT MERGED, NO-GO / PRODUCTION HOLD.

## Immutable sources and branch
- Main source: `988ca4f7f38b1ce86e4d3f426361b5866fd23e0d`.
- Original controller PR #96: `6321c38a939d26557a1c12cce3126ff6fd97dd6c`.
- Publishing stack tip PR #112 (contains #110 → #111): `295e4ab4d1b2c886a2c0801306d071e280288891`.
- Dedicated review branch: `reconcile/content-pr96-publisher-issuer-20261108`. Source HEAD **must be re-read** after this file's commit.
- The branch began from exact #96 and staged 19 donor-only paths from #112 by their original Git blob IDs; then five shared paths were reconciled individually. Donor tests, publisher source modules, root/web protection code and publisher Vercel scripts were not arbitrarily regenerated.

## Explicit conflict resolutions

| Path | Reconciliation |
|---|---|
| `apps/web/next.config.mjs` | Accept controller `URAI_CONTENT_BUILD_SHA` and publisher `URAI_CONTENT_RELEASE_SHA` alongside GITHUB_SHA and VERCEL_GIT_COMMIT_SHA; all supplied values must be strict 40-hex and identical; embed both legacy build alias and publisher `URAI_CONTENT_COMPILED_SHA`. |
| `apps/web/src/app/api/version/route.ts` | Adopt publisher compiled-SHA response; fail closed to null when compiled identity is absent/malformed or conflicts with present runtime Git SHA; no-store cache. |
| `apps/web/package.json` | Retain #96 Firebase client, version and all three canonical Privacy/export test scripts and add #112 Next payload prebuild/postbuild guards; no dependency or lockfile edits in convergence. |
| `package.json` | Retain #96 root scripts and intentional blocked deploy while adopting #112 preflight, payload and route scripts; append composite convergence contract test. |
| `.github/workflows/deploy-vercel-production.yml` | Retain controller source checkout, production ADC hard stop, source-root check, immutable post-deploy smoke and conditional evidence upload; add publisher linked/prebuilt root guards, combined preflight suite, and dual-origin exact source verification. |

## Test/proof evidence at this checkpoint

**Native isolated Node v22.16.0, exact copied source files:** 
- On `apps/web/next.config.mjs` with independently verified matching Git blob SHA `2d7d6c3f4360ff7cb192e3d5cbcc4f614af33cd6`, and `apps/web/src/app/api/version/route.ts` with verified blob SHA `d9fc1af4e5b1616eed7f6b8beca1461c96e8db56`, ran eleven `node --test` checks using temporary test harness `/mnt/data/content-reconcile-test/scripts/integration-source.test.mjs`.
- **11 passed, 0 failed, 0 skipped**, log SHA-256 `a3698016f19ebadcb78543b643afcdc49bd148e5f9e7076bdc361ee42fce7104`. Tested 4 matching build metadata sources, legacy-only and publisher-only source admission, mismatched/invalid identity denial, absent compiled SHA, compiled/runtime conflict, no-store, and malformed source rejection.
- These are original verified source modules in an isolated harness, **not** a Next compiled production artifact, not full repository npm CI or browser tests.
- GitHub connector full candidate-source readback checked **15 structural invariants** (all passed): build aliases, compiled SHA, 3 Privacy suites and Firebase dependency, deploy HOLD, two root/web Rules blob pair identities, ADC production hard stop, Vercel linked root/preflight/deployed-source checks, presence of alias tests, and both original worker heads unchanged.
- Added native `node:test` source files: `scripts/content-convergence-contract.test.mjs` with 5 contract tests, and an additional legacy/new SHA negative case in `scripts/check-content-build-source.test.mjs`. **These committed tests have NOT yet been executed on a complete repository checkout.**

**Known tooling blocker:** local GitHub DNS failed (`git ls-remote` cannot resolve github.com); repository native dependency installation and complete root/web/Java Rules/Playwright tests were not run. Prior GitHub Actions for audit #114 reported 0 job steps and are not application failures. If new PR Actions again show zero steps, record runner admission separately.

## Non-conflicting boundaries and open P0 integration gates
- `firestore.rules` and `apps/web/firestore.rules` retain exact controller blob `579d76d783b2ba02334677768890b3dd6f767e90`; root/web Storage both `aab0ea531212f6a9817d387bd0b59502550f7b50`. **Deployed effective Firebase Rules/IAM unverified**.
- Producer current canonical C1/C7/owner permissions, revoked in-flight creator persistence, transactional moderator status + audit, approved/unlisted public discoverability, external asset/rights/consent, full deletion/purge and cross-service private replay still **NOT integrated-runtime verified**.
- The `urai-content` Vercel project was last reported `live:false` with failed routes-manifest packaging. Source guards are not live deployment proof.
- No branch reset/rebase/force push, no modifying #96 or #110–#112, no paid providers, no live messages, no production deploy, no user records.

## Next acceptance sequence
1. Review the five explicit conflict changes, preservation of controller Rules/Privacy and publisher issuer/tests, and any new SHA/data contract drift.
2. Obtain a complete, clean checkout at this candidate HEAD. Run `node --test scripts/content-convergence-contract.test.mjs scripts/check-content-build-source.test.mjs`, `npm ci`, `npm run check`, `npm run web:install`, `npm run web:deploy:preflight:test`, `npm run web:check`, and browser/Rules emulator checks. Pin exact logs, hashes, Node/npm versions and source.
3. Exercise protected staging *negative* Firebase/Auth/C1/C7 owner and role/revocation tests; a response-denied test must not be mistaken for prevention or rollback of already-started writes.
4. Establish atomic moderator/audit receipts, unlisted discoverability behavior, signed issuer approval, actual consented Content→Privacy→Jobs/Studio/Storytime/Spatial lifecycle, deletion, and provider media rights.
5. Prove a protected READY preview compiled source SHA with both deployed artifact URL and approved domain. Require independent review and rollback receipts before any release decision.

**HOLD.** This PR is a test candidate, not a production authorization or final integration certification.

## NATIVE EXTENDED RECONCILIATION RECEIPT — same 2026-11-08 continuation

This receipt extends, but does not invalidate, the earlier 11/11 entry.

| Isolated suite | Exact original source verified by `git hash-object` | Native Node result | Original log SHA-256 |
|---|---|---:|---|
| Build identity / version source | `apps/web/next.config.mjs` Git blob `2d7d6c3f4360ff7cb192e3d5cbcc4f614af33cd6` and `apps/web/src/app/api/version/route.ts` `d9fc1af4e5b1616eed7f6b8beca1461c96e8db56` | **11/11 PASS** | `a3698016f19ebadcb78543b643afcdc49bd148e5f9e7076bdc361ee42fce7104` |
| Vercel linked/prebuilt root and packaging guard | `apps/web/scripts/check-vercel-root.mjs` Git blob `4251e3a468d14f411d3316258ea13c324d613a9c` | **12/12 PASS** | `dd9e90734aeed606fde785f2417d447821ce3d6be662f0e77047e143d57c8a12` |
| Dual-origin exact-source verification | `scripts/verify-content-vercel-source.mjs` Git blob `59667db433d54c4a02ac485eb1dad409e79c5754` | **13/13 PASS** | `5a9c3d5540a1316a24669594ceb045cc25a8dd5ef2fef94231ee4a881ad1466f` |

**Combined native result: 36 passed, zero failed/skipped** on Node v22.16.0. Each executable module's local file matched the exact Git object ID from the candidate. Harnesses were separately authored, generated only synthetic inputs/fixtures and were run locally; these are **isolated executed source contract tests**, not a full repository or a true Vercel/Firebase provider acceptance test. The harness/logs resided under `/mnt/data/content-reconcile-test/` in the active execution container at the time of testing; only scoped results and immutable log hashes are preserved in this committed report.

Expanded negative cases include disagreeing legacy/new Git SHA values, invalid/absent compiled identities, runtime-source divergence, malformed or duplicated provider roots, incorrect provider project ID, missing/invalid Next and Vercel output manifests, URL protocol/hostname rejection, stale artifact versus stale target domain, response redirects, unsafe response content types, oversized streamed JSON and declared content length, and network unavailability.

**Important caveat:** the full 26-file converged PR tree has not been checked out locally, so these three module-specific runs do not certify the candidate's complete dependency graph, generated Next artifact, type checking, CI workflows, current Firebase account/Roles, consent, revocation, moderation transaction semantics, marketing publisher issue chain, or real private downstream consumers.

## Draft review and current continuation point

- New isolated [Content convergence PR #115](https://github.com/LifeLoggerAI/urai-content/pull/115) targets the #96 branch as a **draft**; it changes 26 files against #96: 19 exact donor-only paths, five resolved overlapping files, one enhanced source identity test and this additional convergence contract/evidence. Source and authoring remains unmerged.
- The latest observed PR #115 commit before appending this receipt was `e93b0a7773e53a9bcd3f6f2b5d8c20cef33cb248`. This documentation update advances the review HEAD; always fetch fresh SHA before tests.
- At immediate first query after creating the PR, commit-linked GitHub Actions runs returned an empty list, **not** an executing or passing suite. Recheck later rather than claiming new CI admission.
- Protected Firebase/Privacy owner consent, in-flight persistence revocation, atomic moderation, actual Content → Jobs/Studio/Storytime/Spatial delivery and deletion, trusted publisher IAM, and authenticated prebuilt preview remain outstanding. **NO-GO/HOLD**.

## R117 — combined authenticated-envelope *simulation* and native five-suite rerun (2026-11-08)

All five independently scoped native test harnesses were executed in **one Node 22.16.0 test invocation** using `--experimental-strip-types` and a local relative-import resolver for TypeScript `.js` specifiers. No npm dependencies, network calls, provider credentials, live send, deployment or user data were required.

**Combined exact-source result: 73/73 PASS, 0 FAIL, 0 SKIP, 0 CANCEL.**

Command executed in the temporary test workspace:
```sh
node --experimental-strip-types --experimental-loader ./scripts/ts-loader.mjs --test \
  ./scripts/integration-source.test.mjs \
  ./scripts/vercel-guard-integration.test.mjs \
  ./scripts/dual-origin-integration.test.mjs \
  ./scripts/publication-integration.test.mjs \
  ./scripts/issuer-integration.test.mjs
```
**Aggregated full TAP log SHA-256:** `3a92df547165b64dde2b55b7b1a6ef06cf09b9666c59f548e66eaed17de57af2`.

### Executed suite breakdown

| Native harness | Tests | Scope |
|---|---:|---|
| `integration-source.test.mjs` | **11** | Merged controller/publisher source SHA aliases, mismatch/error denial, compiled `/api/version` JSON |
| `vercel-guard-integration.test.mjs` | **12** | Vercel linked project/root and prebuilt artifact guards; malformed/nested/doubled `path0` denial |
| `dual-origin-integration.test.mjs` | **13** | Exact SHA required at both deployment and public domain; stale/unsafe URL, redirects, malformed and oversized response denial |
| `publication-integration.test.mjs` | **20** | Original `evaluatePublication` and receipt: provenance, rights, accessible/translated approval, human timestamp, assets, revision, deterministic checksum |
| `issuer-integration.test.mjs` | **17** | Original canonical v2 and Ed25519 publisher: positive signature verification, tamper denial, synthetic issuer/role/current-state denial, rights/asset/consent/destination failures |

### Exact source identity assertions

Seven original content modules were independently verified with `git hash-object` immediately before the combined run:

- `apps/web/next.config.mjs`: `2d7d6c3f4360ff7cb192e3d5cbcc4f614af33cd6`
- `apps/web/src/app/api/version/route.ts`: `d9fc1af4e5b1616eed7f6b8beca1461c96e8db56`
- `apps/web/scripts/check-vercel-root.mjs`: `4251e3a468d14f411d3316258ea13c324d613a9c`
- `scripts/verify-content-vercel-source.mjs`: `59667db433d54c4a02ac485eb1dad409e79c5754`
- `src/publishing/release.ts`: `304a6a7612cffb7d0cdaca7bf74cffcb35e52f6f`
- `src/publishing/canonical-release-v2.ts`: `c7d70022070ca9c988266fb7f75ecf2cb6b43cb0`
- `src/publishing/marketing-release-envelope.ts`: `d40e08c5bb2960ef0c66e8798cde9c75f491c56b`

**Evidence classification:** actual local Node/native isolated multi-module source verification, with synthetic mocked account/release authority and pure in-memory signed Ed25519 examples. The local resolver redirects `.js` module references to their `.ts` originals under the publishing directory solely for the isolated test runtime; original file bytes were not modified. The `NextResponse` route is executed with an isolated mocked interface; no actual Next framework request or Firebase provider is present.

**The 73/73 result is not full PR acceptance.** Complete 26-file branch checkout, TypeScript/lint/full Vitest/Playwright, Java21 Rules emulators, external Google-signed OIDC checks, real C1/C7 current consent and withdrawal, transactional creator/moderation persistence, real signed service dispatch, provider deployment, protected device Replay, deletion/acknowledgment and reviewer release GO remain outstanding. Any source evolution requires retesting.
