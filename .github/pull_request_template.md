# Pull Request Checklist

## Scope

```text
Scope type: package / web-runtime / Firebase / auth / Stripe / export / deployment / observability / docs
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
Deployed URL, if applicable:
Provider evidence, if applicable:
```

## Required checks

### Package/shared changes

- [ ] npm ci
- [ ] npm run done

### Web/runtime changes

- [ ] npm run web:install
- [ ] npm run web:check
- [ ] npm run web:smoke:routes -- --base-url=http://127.0.0.1:3000

### Deployment claims

- [ ] npm run done
- [ ] npm run web:check
- [ ] npm run web:smoke:routes -- --base-url=<staging-or-production-url>
- [ ] deployed smoke output attached
- [ ] rollback SHA/procedure attached

## Package/content coverage

- [ ] Schemas updated when needed
- [ ] Seed data updated when needed
- [ ] Tests added or updated
- [ ] Public exports updated from src/index.ts when needed
- [ ] Docs updated when needed
- [ ] Broken/orphaned references checked
- [ ] Duplicate content/systems checked

## Security impact

- [ ] No secrets committed
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
- [ ] N/A, this PR has no deployment impact

## Issue tracker and governance

- [ ] Related issue has launch-control update
- [ ] docs/ISSUE_LAUNCH_CONTROL.md remains accurate
- [ ] URAI_FINAL_COMPLETION_AUDIT.md remains accurate
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
- Security rules are missing or untested where applicable
- Auth/admin routes fail open
- Stripe checkout is reachable without verified config
- Exports can leak across users
- Public APIs expose draft/private content
- Production smoke fails
- Rollback path is missing for deployment claims
