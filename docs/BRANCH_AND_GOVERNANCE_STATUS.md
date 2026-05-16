# URAI Content Branch and Governance Status

Date: 2026-05-16
Repo: `LifeLoggerAI/urai-content`
Default branch: `main`

## Current source-of-truth branch

`main` is the current source-of-truth branch for the repo-side governance, launch-control, evidence, PR, issue-template, and CODEOWNERS improvements made during the final completion pass.

## Known stale branch

The branch below was created during early discovery from an older commit and must not be used for final implementation or release work:

```text
audit/final-completion-2026-05-16
```

Reason:

- it was created from a commit discovered during initial search, not from the current verified `main`
- its README/content view was older than the current `main` source-of-truth
- continuing work from that branch can reintroduce stale package-only assumptions and overwrite newer runtime/governance docs

## Required action for stale branch

Recommended owner action:

```text
Delete or archive `audit/final-completion-2026-05-16` after confirming no unique commits are needed.
```

If the branch must be kept temporarily, it must be treated as read-only historical evidence, not an implementation base.

## Correct branch workflow going forward

1. Start all new work from current `main`.
2. Use branch names tied to issue or launch lane, for example:
   - `issue-9-firestore-adapter`
   - `issue-10-runtime-api-contracts`
   - `issue-11-route-seo-qa`
   - `issue-12-auth-stripe-entitlements`
   - `issue-13-export-pipeline`
   - `issue-14-production-deploy`
   - `issue-15-observability`
3. Open PRs using `.github/pull_request_template.md`.
4. Attach evidence using `docs/EVIDENCE_LOG_TEMPLATE.md`.
5. Keep `docs/ISSUE_LAUNCH_CONTROL.md` and `URAI_FINAL_COMPLETION_AUDIT.md` accurate when status changes.
6. Do not mark any item GREEN without evidence.

## Governance files now active

The repo now has these governance and evidence controls:

- `URAI_FINAL_COMPLETION_AUDIT.md`
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/ROUTE_COVERAGE.md`
- `docs/PRODUCTION_LAUNCH_RUNBOOK.md`
- `docs/ISSUE_LAUNCH_CONTROL.md`
- `docs/EVIDENCE_LOG_TEMPLATE.md`
- `docs/MAINTAINER_RELEASE_CHECKLIST.md`
- `.github/pull_request_template.md`
- `.github/ISSUE_TEMPLATE/launch_task.md`
- `.github/ISSUE_TEMPLATE/runtime_bug.md`
- `.github/CODEOWNERS`

## Current repo-side governance status

| Area | Status | Notes |
| --- | --- | --- |
| Audit truth | GREEN | Final audit exists and distinguishes repo readiness from production launch readiness. |
| Route coverage tracking | GREEN/PARTIAL | Public/runtime routes are inventoried; live deployment evidence still missing. |
| Launch runbook | GREEN | Production launch lanes and stop rules are documented. |
| Issue launch control | GREEN | Open launch issues are mapped to launch lanes and evidence gates. |
| Evidence capture | GREEN | Standard evidence log template exists. |
| Maintainer checklist | GREEN | Merge/release checklist exists. |
| PR template | GREEN | PRs now require scope, evidence, security, route, deployment, and final status claims. |
| Issue templates | GREEN | New launch tasks and runtime bugs enter with evidence structure. |
| CODEOWNERS | GREEN/PARTIAL | Ownership exists and should be narrowed to real teams/users once available. |
| CI live-state evidence | YELLOW | Current live GitHub Actions status must still be checked per release SHA. |
| Provider/deployment evidence | RED | Firebase, DNS, SSL, Stripe, monitoring, and rollback evidence are still external blockers. |

## Stop rule

Do not use, merge from, or rebase onto stale branches unless their contents are first compared against current `main` and explicitly approved by a maintainer.
