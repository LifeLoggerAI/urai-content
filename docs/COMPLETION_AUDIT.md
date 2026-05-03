# Completion Audit

## What exists
- TypeScript content package with scripts for lint/typecheck/validation/tests/build.
- Canonical `content/` JSON source tree.
- Centralized Zod schema contracts and content validators.
- Backend service and repository abstraction with in-memory implementation.

## Canonical command order (verbatim)
1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run validate:content`
5. `npm run validate:sprites`
6. `npm run content:index`
7. `git diff --exit-code`
8. `npm test`
9. `npm run build`
10. `npm run check`

## Firebase adapter status (verbatim)
`urai-content` does not initialize Firebase Admin and does not ship a live Firestore adapter. Consuming backend repos must implement `ContentRepository` using injected Firestore/Admin SDK and wire it into `ContentService`.

## Remaining external work
- Live cloud credentials configuration.
- Consuming-repo Firebase adapter implementation and deployment.
- Infra repo rules/index rollout.
