## 2026-06-29 CI Repair Pass

Branch: `ci-repair/urai-content-export-test`
Base inspected: `main` at PR #44 merge commit `b4d1c7dbe321a48ba23cadab1c3b53b03312ea03`
Repair PR: #45
Repair head verified: `5148bae3c286517b3d365e2a44a54de69ae0ebf8`
Repair merge commit: `b226b85ce3c3931a481d74a9b72f2afb7c02b2b3`

### Reason For This Pass

PR #44 was merged while CI was failing in root `npm test`. The failing test expected the seed `export-demo-ritual-card` record to remain `complete`, but PR #44 intentionally downgraded that seed export because it had no real storage object, download URL, or checksum proof.

### Evidence Collected In This Pass

| Check | Result | Evidence |
| --- | --- | --- |
| Export lifecycle test repair | Implemented and merged | PR #45 updated `tests/exports.test.ts` to create its own completed export fixture through `startExportJob()` and `completeExportJob()` instead of relying on fake completed seed proof. |
| Governance validation | Pass | Workflow run 94, run id `28339416684`, conclusion `success`. |
| URAI Production Verify | Pass | Workflow run 4, run id `28339416695`, conclusion `success`; typecheck, tests, build, and URAI QA completed successfully. |
| Main CI | Pass | Workflow run 586, run id `28339416685`, conclusion `success`. |

### Current Go/No-Go

Repository CI for PR #45: **GREEN**.

Deployment/provider evidence: **pending**. CI is green for the code repair. Launch evidence still needs to be attached for deployed URL, DNS/SSL, Firebase project/rules/emulator output, Stripe proof, export/storage proof, browser E2E screenshots, monitoring, and rollback proof.

## 2026-06-29 Browser Smoke CI Gate

Branch: `browser-smoke-isolated-ci`
PR: #54
Head verified: `2e6f3224eba5d300d54afbf9db5034cf8b73c4ba`
Merge commit: `66f28d5e756552569a10c7399fbd755e751da8c8`

### Reason For This Pass

PR #53 added the existing Playwright public-route browser smoke suite to CI, but the first merged workflow kept route smoke and browser smoke inside one web job. PR #54 moved browser smoke into its own CI job so route smoke and browser smoke run on separate runners and cannot conflict over local server/process state.

### Evidence Collected In This Pass

| Check | Result | Evidence |
| --- | --- | --- |
| Workflow split | Implemented and merged | `.github/workflows/ci.yml` now has separate `web` and `browser-smoke` jobs. |
| Governance validation | Pass | Workflow run 114, run id `28342251232`, conclusion `success`. |
| URAI Production Verify | Pass | Workflow run 16, run id `28342251194`, conclusion `success`. |
| Main CI | Pass | Workflow run 629, run id `28342251186`, conclusion `success`. |
| Root validate job | Pass | Job `validate` passed lint, typecheck, validation, tests, build, seed checks, verify, and done. |
| Web route smoke job | Pass | Job `web` passed `web:install`, `web:check`, and `web:smoke:routes`. |
| Browser smoke job | Pass | Job `browser-smoke` passed `web:install`, `web:check`, browser runtime install, and `web:e2e`. |

### Current Go/No-Go

Repository CI and repo-side public-route browser smoke: **GREEN**.

Deployment/provider evidence: **pending**. This is not a provider-verified live deployment claim. Launch evidence still needs deployed URL, DNS/SSL, provider-backed runtime proof, deployed smoke, full browser E2E/visual evidence, monitoring, and rollback proof.
