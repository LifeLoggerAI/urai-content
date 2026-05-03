# URAI Content

`urai-content` is URAI's **content domain engine**: a typed contract, validation system, and backend service layer for narrator prompts, ritual/story templates, marketplace assets, publishing workflow, and export copy.

## Repository role in URAI
This repo is the content backbone used by app/admin repos. It centralizes:
- content schemas
- publishing workflow rules
- moderation + release logging contracts
- entitlement-aware content access checks
- telemetry event contract
- demo seed packs for local/staging

## Install and validate
```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run seed:check
```

## Core modules
- `src/schemas/content.ts` — centralized Zod schemas and TS types
- `src/backend/contentService.ts` — workflow, versioning, search, entitlements, moderation/release/telemetry hooks
- `src/backend/types.ts` — repository interface for Firebase adapter implementation
- `src/backend/inMemoryRepository.ts` — local/testing repository implementation
- `src/seed/` — demo seed content + schema validation script

## Firebase wiring
Implement `ContentRepository` with Firebase Admin SDK in the deployment repo or shared backend package and bind `ContentService` to API handlers.

## Environment
Copy `.env.example` and set values in secrets manager; never commit credentials.

## Documentation
- `docs/COMPLETION_AUDIT.md`
- `docs/CONTENT_SYSTEM.md`
- `docs/FIREBASE_SETUP.md`
- `docs/FIREBASE_RULES_PATCH.md`
- `docs/TESTING.md`
- `docs/DEPLOYMENT.md`
- `docs/ROADMAP_WIRING.md`
- `docs/DONE_DONE_CHECKLIST.md`
