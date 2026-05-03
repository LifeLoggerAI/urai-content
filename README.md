# URAI Content

Canonical content engine and asset/story library for the URAI ecosystem.

`urai-content` is URAI's **content domain engine**: a typed contract, validation system, and backend service layer for narrator prompts, ritual/story templates, marketplace assets, publishing workflow, export copy, and canonical app content.

## Repo type

This repository is a **content package/library** — not a deployed Next.js app. It provides typed content registries, schemas, loaders, validators, backend service contracts, and seed/demo story assets for other URAI apps.

## Repository role in URAI

This repo is the content backbone used by app/admin repos. It centralizes:

- content schemas
- canonical brand, page, demo, legal, sprite, and SEO content
- typed content registries and loaders
- publishing workflow rules
- moderation and release logging contracts
- entitlement-aware content access checks
- telemetry event contracts
- demo seed packs for local/staging

## Structure

- `content/` — canonical source of truth for brand, pages, demo, legal, sprites, and SEO JSON
- `src/lib/content/` — schema, loaders, registry, and validators
- `src/schemas/content.ts` — centralized Zod schemas and TypeScript types
- `src/backend/contentService.ts` — workflow, versioning, search, entitlements, moderation/release/telemetry hooks
- `src/backend/types.ts` — repository interface for Firebase adapter implementation
- `src/backend/inMemoryRepository.ts` — local/testing repository implementation
- `src/index.ts` — stable package exports
- `src/seed/` — demo seed content and schema validation script
- `scripts/contentIndex.ts` — deterministic generated content index
- `tests/` — smoke and unit tests

## Install and validate

```bash
npm ci
npm run lint
npm run typecheck
npm run validate:content
npm run validate:sprites
npm run content:index
npm run content:check
npm test
npm run build
npm run seed:check
npm run check# URAI Content

Canonical content engine and asset/story library for the URAI ecosystem.

`urai-content` is URAI's **content domain engine**: a typed contract, validation system, and backend service layer for narrator prompts, ritual/story templates, marketplace assets, publishing workflow, export copy, and canonical app content.

## Repo type

This repository is a **content package/library** — not a deployed Next.js app. It provides typed content registries, schemas, loaders, validators, backend service contracts, and seed/demo story assets for other URAI apps.

## Repository role in URAI

This repo is the content backbone used by app/admin repos. It centralizes:

- content schemas
- canonical brand, page, demo, legal, sprite, and SEO content
- typed content registries and loaders
- publishing workflow rules
- moderation and release logging contracts
- entitlement-aware content access checks
- telemetry event contracts
- demo seed packs for local/staging

## Structure

- `content/` — canonical source of truth for brand, pages, demo, legal, sprites, and SEO JSON
- `src/lib/content/` — schema, loaders, registry, and validators
- `src/schemas/content.ts` — centralized Zod schemas and TypeScript types
- `src/backend/contentService.ts` — workflow, versioning, search, entitlements, moderation/release/telemetry hooks
- `src/backend/types.ts` — repository interface for Firebase adapter implementation
- `src/backend/inMemoryRepository.ts` — local/testing repository implementation
- `src/index.ts` — stable package exports
- `src/seed/` — demo seed content and schema validation script
- `scripts/contentIndex.ts` — deterministic generated content index
- `tests/` — smoke and unit tests

## Install and validate

```bash
npm ci
npm run lint
npm run typecheck
npm run validate:content
npm run validate:sprites
npm run content:index
npm run content:check
npm test
npm run build
npm run seed:check
npm run check