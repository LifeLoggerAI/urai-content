# URAI Content Maintainer Release Checklist

Use this checklist before merging, releasing, or claiming RED/YELLOW/GREEN status for `urai-content`.

This checklist exists to prevent bypassing the launch gates defined in:

- `URAI_FINAL_COMPLETION_AUDIT.md`
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/ROUTE_COVERAGE.md`
- `docs/ISSUE_LAUNCH_CONTROL.md`
- `docs/PRODUCTION_LAUNCH_RUNBOOK.md`
- `docs/EVIDENCE_LOG_TEMPLATE.md`
- `docs/PRODUCTION_READINESS_DASHBOARD.md`

## 1. Branch hygiene

- [ ] Work is on a current branch based on `main`.
- [ ] Branch is not the stale `audit/final-completion-2026-05-16` branch created during discovery from an older commit.
- [ ] Branch name describes the launch lane or issue number.
- [ ] No unrelated files are changed.
- [ ] Generated files are either committed intentionally or regenerated cleanly.

## 2. Scope declaration

Before review, declare the scope:

```text
Scope type: package / web-runtime / Firebase / auth / Stripe / export / deployment / observability / docs
Related issue(s):
Launch lane:
Expected status change: RED -> YELLOW / YELLOW -> GREEN / no status change
```

## 3. Required local checks

For package or shared repo changes:

```bash
npm ci
npm run check:governance
npm run done
```

For web runtime changes:

```bash
npm run web:install
npm run web:check
npm run web:smoke:routes -- --base-url=http://127.0.0.1:3000
```

For launch/deployment claims:

```bash
npm run check:governance
npm run done
npm run web:check
npm run web:smoke:routes -- --base-url=<staging-or-production-url>
```

`npm run check:governance` validates:

- required launch-control docs exist
- README references remain intact
- PR/issue templates exist
- CODEOWNERS exists
- required stop-rule/evidence language still exists
- governance docs have not silently drifted

## 4. Evidence requirements

Attach evidence using `docs/EVIDENCE_LOG_TEMPLATE.md`.

A PR or issue update must include:

- [ ] commit SHA
- [ ] command output or CI URL
- [ ] affected docs/files
- [ ] issue link
- [ ] test results
- [ ] smoke results where applicable
- [ ] deployed URL where applicable
- [ ] provider evidence where applicable
- [ ] owner and next action for remaining RED/YELLOW items

## 5. Security review gates

Required for Firebase/auth/admin/export/payment changes:

- [ ] No secrets committed.
- [ ] No Firebase Admin SDK bundled into browser code.
- [ ] Protected routes fail closed.
- [ ] Admin APIs require server-side authorization.
- [ ] Creator/admin roles are separated.
- [ ] Draft/private content is never exposed through public APIs.
- [ ] Entitlement checks cannot be bypassed client-side.
- [ ] Export artifacts are ownership-protected.
- [ ] Stripe webhook signatures are verified before entitlement writes.

## 6. Route and UI review gates

Required for public route changes:

- [ ] Route status updated in `docs/ROUTE_COVERAGE.md` if status changes.
- [ ] Page has intentional title and description.
- [ ] Canonical URL policy is followed.
- [ ] Sitemap/robots impact is handled.
- [ ] Empty/loading/error states are intentional.
- [ ] Mobile viewport behavior is checked.
- [ ] Demo/dev-only content is labeled and not accidentally production-primary.

## 7. Deployment review gates

Required for staging/production deployment claims:

- [ ] Hosting provider confirmed.
- [ ] Firebase project/hosting target confirmed if Firebase is used.
- [ ] DNS target confirmed.
- [ ] SSL confirmed.
- [ ] Env/secrets verified in provider/CI secret manager.
- [ ] CI run URL attached.
- [ ] Staging URL attached.
- [ ] Production URL attached if production release.
- [ ] Smoke output attached.
- [ ] Rollback SHA or rollback procedure attached.
- [ ] Monitoring/alert owner confirmed.

## 8. Issue tracker update

Before merge or close:

- [ ] Related issue has a launch-control update comment.
- [ ] Related issue status is RED/YELLOW/GREEN with evidence.
- [ ] `docs/ISSUE_LAUNCH_CONTROL.md` remains accurate.
- [ ] `URAI_FINAL_COMPLETION_AUDIT.md` remains accurate.
- [ ] `docs/PRODUCTION_READINESS_DASHBOARD.md` remains accurate.
- [ ] No issue is closed while required evidence is missing.

## 9. Stop rules

Stop merge/release if any are true:

- Firebase project is uncertain.
- Hosting target is uncertain.
- Secrets are missing or unverified.
- CI fails without explicit owner-approved override.
- Security rules are missing or untested where applicable.
- Auth/admin routes fail open.
- Stripe checkout is reachable without verified config.
- Exports can leak across users.
- Public APIs expose draft/private content.
- Production smoke fails.
- Rollback path is missing.
- Governance verification fails.

## 10. Final maintainer sign-off

```text
Maintainer:
Date:
Commit SHA:
Related issue(s):
CI run URL:
Evidence log location:
Final status: RED / YELLOW / GREEN
Reason for status:
Remaining blockers:
Next owner:
```

## Final rule

Do not merge, release, close an issue, or mark GREEN because something feels complete. Mark GREEN only because the evidence proves it.
