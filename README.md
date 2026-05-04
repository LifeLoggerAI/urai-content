# URAI Content

Canonical content engine and asset/story library for the URAI ecosystem.

## Repo type
This repository is a **content package/library** (not a deployed Next.js app). It provides typed content registries, schemas, loaders, validators, and seed/demo story assets for other URAI apps.

## Structure
- `content/` canonical source of truth for brand, pages, demo, legal, sprites, and SEO JSON
- `src/lib/content/` schema, loaders, registry, and validators
- `src/backend/` domain service and repository contracts
- `src/index.ts` stable package exports
- `scripts/contentIndex.ts` deterministic generated index
- `tests/` smoke and unit tests

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

## Env
- `NEXT_PUBLIC_GITHUB_ISSUES_URL`
- `NEXT_PUBLIC_CI_RUN_URL`
- Firebase/Stripe variables in `.env.example` for consuming runtime backends.

## Consumption
```ts
import { registry, validateContent } from 'urai-content';
validateContent();
console.log(registry.home.title);
```

## Known limitations
- No UI routes in this repo by design.
- Package-lock generation and local install require npm registry access.
