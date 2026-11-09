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
