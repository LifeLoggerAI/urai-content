# URAI Content Cross-Repo Runtime Contract

No evidence means no GREEN.

This contract defines how consuming URAI repos must integrate `urai-content` before a staging or production claim is valid.

## Purpose

`urai-content` owns canonical content schemas, registries, validation, runtime smoke helpers, and launch governance. Consuming repos own their deployed app/runtime integrations.

A consuming repo is not integrated until it proves that it:

- imports the published `urai-content` package or tracks a pinned commit
- validates content during CI
- exposes the required runtime health/version surface
- protects private/admin/content routes fail-closed
- publishes smoke/E2E evidence back to the release evidence log

## Required consuming repos

| Repo | Expected role | Status without evidence |
| --- | --- | --- |
| `LifeLoggerAI/urai-studio` | app/runtime UI integration | RED |
| `LifeLoggerAI/urai-spatial` | spatial/orb runtime integration | RED |
| `LifeLoggerAI/urai-storytime` | narrator/story runtime integration | RED |
| `LifeLoggerAI/urai-staging` | staging deployment environment | RED |
| `LifeLoggerAI/urai-communications` | launch/comms copy consumption | RED |

If a repo is not required for a release lane, mark it N/A with evidence in the release log.

## Required runtime endpoints

Consuming deployed runtimes must expose or proxy:

| Endpoint | Requirement |
| --- | --- |
| `/api/health` | returns healthy runtime status |
| `/api/version` | returns release SHA/version/environment |
| `/robots.txt` | reachable when public |
| `/sitemap.xml` | reachable when public |

`npm run smoke:production` depends on these endpoints.

## Required CI contract

Each consuming repo must run equivalent checks:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run check:secrets
npm run content:check
```

If the consuming repo cannot run these exact commands, it must document equivalent commands and attach evidence.

## Required deployed evidence

Each consuming repo must attach:

```text
Repo:
Branch:
Commit SHA:
Environment:
Base URL:
CI URL:
Smoke command:
Smoke output:
E2E command:
E2E output:
Rollback SHA/procedure:
Final status: RED / YELLOW / GREEN
```

## Integration stop rules

Do not mark cross-repo integration GREEN if:

- consuming repo commit SHA is unknown
- deployed URL is missing
- `urai-content` version/commit is not pinned
- content validation is not run in CI
- runtime health/version endpoints are missing
- protected/admin routes fail open
- smoke/E2E evidence is missing
- rollback evidence is missing for production claims

## Owner handoff

```text
Source repo: LifeLoggerAI/urai-content
Consuming repo:
Owner:
Required integration:
Evidence link:
Remaining blocker:
Next action:
Final status: RED / YELLOW / GREEN
```
