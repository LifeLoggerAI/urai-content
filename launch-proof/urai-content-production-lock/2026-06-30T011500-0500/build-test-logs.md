# Build and Test Logs

Starting SHA: 4366390d7691d0cf5b3e728f2452c729a75b893f
Latest branch SHA in this evidence update: 31dd18e079f45d87cca1e9a652f8ac5544feff04
Branch: production-lock-content-2026-06-30
Evidence scope: local command attempt plus GitHub Actions evidence.

## Local execution attempt

Attempted command:

```bash
rm -rf /mnt/data/urai-content && git clone https://github.com/LifeLoggerAI/urai-content.git /mnt/data/urai-content
```

Result: BLOCKED.

Error:

```text
fatal: unable to access 'https://github.com/LifeLoggerAI/urai-content.git/': Could not resolve host: github.com
```

## GitHub Actions for PR head 9debd5f54c85bb4beadfac60f3806c9da86decfc

- URAI Production Verify — PASS.
- ci / browser-smoke — PASS.
- ci / web — PASS.
- ci / validate — FAIL at `npm run verify` after earlier validation steps passed.
- Governance validation — FAIL at governance validation.

## CI commands proven PASS before governance failure

From the failed `ci / validate` job, these completed successfully before `npm run verify` failed:

- npm ci — PASS in CI.
- npm run lint — PASS in CI.
- npm run typecheck — PASS in CI.
- npm run validate:content — PASS in CI.
- npm run validate:sprites — PASS in CI.
- npm run content:index — PASS in CI.
- git diff --exit-code — PASS in CI.
- npm run smoke — PASS in CI.
- npm test — PASS in CI.
- npm run build — PASS in CI.
- npm run seed:check — PASS in CI.
- npm run seed:system:check — PASS in CI.
- web install/check/route smoke — PASS in CI web job.
- browser smoke — PASS in CI browser-smoke job.

## Fix applied after failed CI

Commit 31dd18e079f45d87cca1e9a652f8ac5544feff04 restored the exact governance phrase required by `scripts/checkGovernanceDocs.ts` in `docs/ROUTE_COVERAGE.md` while preserving the newer READY/PARTIAL/GATED/BLOCKED truth matrix.

## Required next CI action

The latest branch head after this proof update must run CI again. Do not merge until `ci`, `Governance validation`, and `URAI Production Verify` are green for the latest head SHA.

## Remaining non-CI blockers

Even with green CI, public production READY still requires Firebase/Auth/Firestore/Storage provider proof, deployed smoke, creator/operator role proof, export/media/payment lifecycle proof, observability, and rollback evidence.
