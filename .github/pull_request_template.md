# Pull Request Checklist

## Scope

```text
Scope type: package / web-runtime / Firebase / auth / Stripe / export / deployment / observability / docs / prompt-library
Related issue(s):
Launch lane:
Expected status change: RED -> YELLOW / YELLOW -> GREEN / no status change
```

## Summary

- What changed:
- Why it changed:
- Related roadmap/version:
- Remaining blockers:

## Evidence

No evidence means no GREEN.

```text
Commit SHA:
CI run URL:
Evidence log location:
Commands run:
Test output:
Smoke output:
Production smoke output:
Rollback smoke output:
Observability check output:
Deployed URL, if applicable:
Provider evidence, if applicable:
```

## Required checks

### Package/shared changes

- [ ] npm ci
- [ ] npm run check:governance
- [ ] npm run check:secrets
- [ ] npm run done

### Web/runtime changes

- [ ] npm run web:install
- [ ] npm run web:check
- [ ] npm run web:smoke:routes -- --base-url=http://127.0.0.1:3000

### Deployment claims

- [ ] npm run check:governance
- [ ] npm run check:secrets
- [ ] npm run check:observability
- [ ] npm run done
- [ ] npm run web:check
- [ ] npm run web:smoke:routes -- --base-url=<staging-or-production-url>
- [ ] npm run smoke:production -- --base-url=<staging-or-production-url>
- [ ] npm run smoke:rollback -- --base-url=<staging-or-production-url> --expected-sha=<rollback-sha>
- [ ] deployed smoke output attached
- [ ] production smoke output attached
- [ ] rollback smoke output attached
- [ ] rollback SHA/procedure attached

## Package/content coverage

- [ ] Schemas updated when needed
- [ ] Seed data updated when needed
- [ ] Tests added or updated
- [ ] Public exports updated from src/index.ts when needed
- [ ] Docs updated when needed
- [ ] Broken/orphaned references checked
- [ ] Duplicate content/systems checked

## Prompt library impact

- [ ] N/A, this PR does not change prompt behavior, prompt tests, or prompt governance
- [ ] Prompt version impact identified: patch / minor / major
- [ ] Behavioral impact and migration risk described
- [ ] `npm run check:prompts` passes
- [ ] `npm run test:prompt-evals` passes
- [ ] Real model-run outputs were scored with `npm run eval:prompts -- --outputs <directory>`
- [ ] Evaluation report and raw outputs are attached for material behavior changes
- [ ] Content parity, source hash, version, and changelog are updated
- [ ] Google Doc mirror sync is planned after merge
- [ ] Independent non-author approval obtained

## Governance impact

- [ ] docs/PRODUCTION_READINESS_DASHBOARD.md remains accurate
- [ ] URAI_FINAL_COMPLETION_AUDIT.md remains accurate
- [ ] docs/ISSUE_LAUNCH_CONTROL.md remains accurate
- [ ] docs/ROUTE_COVERAGE.md remains accurate if route/runtime status changed
- [ ] docs/EVIDENCE_LOG_TEMPLATE.md used for RED/YELLOW/GREEN claims
- [ ] npm run check:governance passes
- [ ] N/A, this PR has no governance/status impact

## Security impact

- [ ] No secrets committed
- [ ] npm run check:secrets passes
- [ ] No Firebase Admin SDK bundled into browser code
- [ ] Protected routes fail closed
- [ ] Admin APIs require server-side authorization
- [ ] Draft/private content is not exposed publicly
- [ ] Entitlement checks cannot be bypassed client-side
- [ ] Export artifacts are ownership-protected
- [ ] Stripe webhook signatures are verified before entitlement writes
- [ ] N/A, this PR has no security-sensitive changes

## Route/UI impact

- [ ] docs/ROUTE_COVERAGE.md updated if route status changed
- [ ] Page metadata/canonical behavior handled
- [ ] Sitemap/robots impact handled
- [ ] Empty/loading/error states handled
- [ ] Mobile behavior checked
- [ ] Demo/dev-only content is clearly labeled
- [ ] N/A, this PR has no route/UI changes

## Deployment impact

- [ ] Hosting provider confirmed
- [ ] Firebase project/hosting target confirmed if Firebase is used
- [ ] DNS/SSL impact handled
- [ ] Env/secrets verified in provider or CI secret manager
- [ ] Monitoring/alert owner confirmed
- [ ] npm run check:observability passes for deployment claims
- [ ] npm run smoke:production passes for deployment claims
- [ ] npm run smoke:rollback passes for rollback claims
- [ ] N/A, this PR has no deployment impact

## Issue tracker and governance

- [ ] Related issue has launch-control update
- [ ] docs/ISSUE_LAUNCH_CONTROL.md remains accurate
- [ ] URAI_FINAL_COMPLETION_AUDIT.md remains accurate
- [ ] docs/PRODUCTION_READINESS_DASHBOARD.md remains accurate
- [ ] Remaining RED/YELLOW items have owner and next action
- [ ] PR does not claim unverified production readiness

## Final status claim

```text
Final status after this PR: RED / YELLOW / GREEN
Reason:
Remaining blockers:
Next owner:
```

## Stop rules

Do not merge if any are true:

- Firebase project is uncertain for Firebase changes
- Hosting target is uncertain for deployment changes
- Secrets are missing or unverified
- CI fails without explicit owner-approved override
- Governance verification fails
- Secret scan fails
- Prompt parity, version, link, or evaluation-regression checks fail
- Prompt-sensitive changes lack independent approval
- Material prompt behavior changes lack real evaluation evidence
- Observability verification fails for deployment claims
- Security rules are missing or untested where applicable
- Auth/admin routes fail open
- Stripe checkout is reachable without verified config
- Exports can leak across users
- Public APIs expose draft/private content
- Production smoke fails
- Rollback smoke fails for rollback claims
- Rollback path is missing for deployment claims
