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

## Commands
- `npm run validate:content`
- `npm run validate:sprites`
- `npm run content:index`
- `npm run content:check`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run check`

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
- Firebase adapter implementation lives in consuming backend repos.
