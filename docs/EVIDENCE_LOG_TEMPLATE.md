# URAI Content Evidence Log Template

Use this template whenever a release, issue, launch lane, or RED/YELLOW/GREEN status is updated.

The rule is simple: no evidence means no GREEN.

## Evidence log

```text
Date:
Operator:
Repo: LifeLoggerAI/urai-content
Branch:
Commit SHA:
Related issue(s):
Related doc(s):
Environment: local / CI / staging / production
Final status: RED / YELLOW / GREEN
```

## Command evidence

Record every command exactly as run.

| Command | Environment | Result | Evidence link / output location | Notes |
| --- | --- | --- | --- | --- |
| `npm ci` | local/CI | RED/YELLOW/GREEN | | |
| `npm run done` | local/CI | RED/YELLOW/GREEN | | |
| `npm run check:governance` | local/CI | RED/YELLOW/GREEN | | |
| `npm run check:secrets` | local/CI | RED/YELLOW/GREEN | | |
| `npm run check:observability` | staging/prod | RED/YELLOW/GREEN | | |
| `npm run web:install` | local/CI | RED/YELLOW/GREEN | | |
| `npm run web:check` | local/CI | RED/YELLOW/GREEN | | |
| `npm run web:smoke:routes` | local/CI/staging/prod | RED/YELLOW/GREEN | | |
| `npm run smoke:production` | staging/prod | RED/YELLOW/GREEN | | |
| `npm run smoke:rollback` | staging/prod | RED/YELLOW/GREEN | | |

## CI evidence

```text
CI provider:
Workflow name:
Run URL:
Run ID:
Commit SHA:
Result:
Failed job(s):
Artifact URL(s):
Rerun needed: yes / no
```

## Route smoke evidence

```text
Base URL:
Command:
Routes checked:
Passed:
Failed:
Failure output:
Final route smoke status: RED / YELLOW / GREEN
```

## Production smoke evidence

```text
Base URL:
Command: npm run smoke:production -- --base-url=<url>
Required paths checked:
HTTPS result:
Health endpoint result:
Version endpoint result:
Robots result:
Sitemap result:
Failure output:
Final production smoke status: RED / YELLOW / GREEN
```

## Rollback smoke evidence

```text
Base URL:
Expected rollback SHA:
Command: npm run smoke:rollback -- --base-url=<url> --expected-sha=<sha>
Health endpoint result:
Version/SHA result:
Failure output:
Final rollback smoke status: RED / YELLOW / GREEN
```

## Deployment evidence

```text
Hosting provider:
Staging URL:
Production URL:
Firebase project ID, if applicable:
Firebase hosting site, if applicable:
DNS status:
SSL status:
Release SHA:
Rollback SHA or rollback procedure:
Production smoke output location:
Rollback smoke output location:
Final deployment status: RED / YELLOW / GREEN
```

## Firebase/security evidence

```text
Firebase project ID:
Firestore database:
Storage bucket:
Auth providers:
Rules file / provider link:
Indexes file / provider link:
Emulator command:
Rules test result:
Secret exposure scan result:
Final Firebase/security status: RED / YELLOW / GREEN
```

## Stripe/payment evidence

```text
Stripe mode: test / live / not configured
Product IDs:
Price IDs:
Webhook endpoint:
Webhook signing verification result:
Checkout test result:
Entitlement write result:
Idempotency test result:
Final Stripe status: RED / YELLOW / GREEN
```

## Auth/RBAC evidence

```text
Anonymous behavior:
Authenticated user behavior:
Creator role behavior:
Admin role behavior:
Forbidden case behavior:
Server-side API guard evidence:
Fail-closed result:
Final auth/RBAC status: RED / YELLOW / GREEN
```

## Export evidence

```text
Create export API result:
Queue/worker result:
Artifact generation result:
Storage write result:
Download authorization result:
Cross-user access test:
Retry/failure metadata result:
Final export status: RED / YELLOW / GREEN
```

## Observability evidence

```text
Command: npm run check:observability
URAI_CONTENT_BASE_URL present: yes / no
URAI_ALERT_OWNER present: yes / no
URAI_UPTIME_MONITOR_URL present: yes / no
URAI_ERROR_MONITORING_URL present: yes / no
Uptime monitor URL:
Error monitor project:
Alert recipients:
Sample error event:
Webhook failure alert test:
Export failure alert test:
Request/trace ID evidence:
Dependency/security scan evidence:
Rollback drill evidence:
Final observability status: RED / YELLOW / GREEN
```

## Decision log

| Decision | Owner | Date | Evidence | Status |
| --- | --- | --- | --- | --- |
| Hosting provider selected | | | | RED/YELLOW/GREEN |
| Firebase project selected | | | | RED/YELLOW/GREEN |
| Stripe launch mode selected | | | | RED/YELLOW/GREEN |
| Production launch approved | | | | RED/YELLOW/GREEN |

## Final summary

```text
What is GREEN with evidence:

What remains YELLOW:

What remains RED:

Next action:

Owner:
```
