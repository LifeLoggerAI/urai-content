# URAI Content Rollback Plan

Use this when a package release, consuming app integration, Firebase rules rollout, or standalone site deployment causes a regression.

## Rollback principles

- Preserve user data.
- Prefer configuration rollback before code rollback.
- Prefer disabling a feature flag before deleting records.
- Do not remove provenance, consent, entitlement, or audit records.
- Record the rollback reason and affected version.

## Package rollback

1. Identify the last known good commit or release tag.
2. Compare changed files:

```bash
git diff <last-good>..HEAD
```

3. Check whether the regression is in:

- schema/type exports
- seed data
- content JSON
- generated index
- Firebase templates
- docs
- tests
- consuming app integration

4. Revert the smallest safe commit range.
5. Run:

```bash
npm ci
npm run done
```

6. Publish or merge only after CI passes.

## Consuming app rollback

If the failure is in a web/admin/functions app that consumes this package:

1. Pin the consuming app to the last known good `urai-content` version or commit.
2. Redeploy the consuming app.
3. Smoke test public pages, marketplace, export creation, admin routes, and creator routes.
4. Open a follow-up issue in this repo if the package contract caused the failure.

## Firebase rules rollback

1. Identify the previous safe `firestore.rules`, `firestore.indexes.json`, and `storage.rules` versions.
2. Redeploy only the affected rules/indexes.
3. Verify:

- public published reads still work
- private drafts are denied
- admin writes still work
- creator submissions still work
- user export ownership still works

## Standalone site rollback

1. Roll back hosting to the last known good release.
2. Confirm:

- `https://www.uraicontent.com` loads
- `https://uraicontent.com` redirects correctly
- `/marketplace`, `/pricing`, `/demo`, `/privacy`, and `/terms` load
- protected routes remain protected

## Incident record template

```md
# Rollback Incident

Date:
Owner:
Affected surface:
Bad release/commit:
Rolled back to:
Reason:
User impact:
Data impact:
Verification commands:
Follow-up issues:
```

## Anti-fake rule

Do not mark rollback complete until the rollback command, deploy command, or CI run is attached to the incident record.
