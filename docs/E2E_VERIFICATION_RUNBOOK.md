# URAI Content E2E Verification Runbook

No evidence means no GREEN.

This runbook defines the minimum browser/runtime verification required before any public, staging, or production launch claim for `urai-content`.

## Scope

This runbook applies to:

- public route maturity
- frontend/runtime cohesion
- production smoke evidence
- rollback evidence
- auth-adjacent protected route behavior where applicable
- mobile/responsive proof
- SEO and metadata proof
- observability linkage proof

## Required environments

| Environment | Required before GREEN | Evidence |
| --- | --- | --- |
| Local | yes | command output and screenshots where useful |
| CI | yes | workflow URL and artifacts |
| Staging | yes for release candidate | staging URL and smoke/E2E output |
| Production | yes for launch claim | production URL and smoke/E2E output |

## Required command sequence

Local/runtime baseline:

```bash
npm ci
npm run check:governance
npm run check:secrets
npm run done
npm run web:install
npm run web:check
npm run web:smoke:routes -- --base-url=http://127.0.0.1:3000
```

Staging/production runtime proof:

```bash
npm run check:observability
npm run web:smoke:routes -- --base-url=<staging-or-production-url>
npm run smoke:production -- --base-url=<staging-or-production-url>
```

Rollback proof:

```bash
npm run smoke:rollback -- --base-url=<staging-or-production-url> --expected-sha=<rollback-sha>
```

## Minimum browser E2E matrix

| Flow | Status without evidence | Required proof |
| --- | --- | --- |
| Public homepage loads | RED | browser run output + screenshot |
| Health endpoint reachable | RED | response status/body |
| Version endpoint exposes release/SHA | RED | response status/body |
| Robots and sitemap reachable | RED | response status/body |
| 404/error page renders intentionally | RED | browser run output + screenshot |
| Mobile viewport renders without layout break | RED | mobile screenshot/artifact |
| Metadata/canonical visible | RED | DOM/head assertion output |
| Protected/admin routes fail closed where applicable | RED | unauthenticated denial evidence |
| Demo/dev-only content is labeled | RED | screenshot or DOM assertion |
| Observability/trace headers present where configured | RED | response/header/log evidence |

## Browser coverage requirements

At minimum, each release candidate should verify:

- Chromium desktop
- Chromium mobile viewport
- one narrow mobile viewport under 390px wide
- one tablet-ish viewport

Recommended future expansion:

- WebKit
- Firefox
- reduced-motion mode
- high contrast/accessibility checks

## Evidence capture

Attach all results to `docs/EVIDENCE_LOG_TEMPLATE.md` format.

Required artifacts:

```text
Commit SHA:
Environment:
Base URL:
Command output:
Screenshots/videos:
CI URL:
Smoke output:
Production smoke output:
Rollback smoke output:
Observability check output:
Final E2E status: RED / YELLOW / GREEN
```

## Stop rules

Do not mark E2E GREEN if:

- tests only ran locally and the claim is about staging/production
- production URL is missing
- production smoke is missing
- mobile coverage is missing
- metadata/canonical assertions are missing
- protected routes fail open
- observability proof is missing for deployment claims
- rollback proof is missing for production release claims

## Owner handoff

```text
Owner:
Environment:
Base URL:
Release SHA:
Rollback SHA:
Open failures:
Next action:
Final status: RED / YELLOW / GREEN
```
