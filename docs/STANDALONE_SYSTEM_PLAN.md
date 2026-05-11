# URAI Content Standalone System Plan

## Purpose

This plan defines how `urai-content` becomes both:

1. the canonical content package for the URAI ecosystem, and
2. the standalone public product at `https://www.uraicontent.com`.

The repository now follows the package-plus-runtime monorepo path: the root package remains the canonical content/domain layer, and `apps/web` is the standalone Next.js runtime scaffold.

## Current architecture

```txt
apps/
  web/                 # standalone Next.js runtime scaffold for www.uraicontent.com
content/               # canonical JSON content tree
src/                   # root content/domain package
scripts/               # root package scripts
```

## Current verified repo-side state

The following gates have been verified locally during the audit pass and are now represented in CI:

- root package validation through `npm run done`
- web runtime validation through `npm run web:check`
- local route smoke through `npm run web:smoke:routes`
- public route shell build with Next static generation
- health/version/catalog/content/Firebase-status API route surface compilation

This plan still does not claim a live production deployment.

## Standalone web app requirements

The standalone site must include:

### Public routes

Implemented as route shells in `apps/web`:

- `/`
- `/about`
- `/content`
- `/stories`
- `/rituals`
- `/narrator`
- `/voice-packs`
- `/marketplace`
- `/creator`
- `/pricing`
- `/licensing`
- `/exports`
- `/demo`
- `/roadmap`
- `/versions`
- `/privacy`
- `/terms`
- `/contact`

Remaining public-route work:

- final copy review
- final CTA review
- full SEO metadata review
- mobile viewport smoke
- browser E2E
- deployed URL smoke evidence

### Protected user routes

Not production-complete:

- `/dashboard`
- `/dashboard/content`
- `/dashboard/stories`
- `/dashboard/rituals`
- `/dashboard/exports`
- `/dashboard/purchases`
- `/dashboard/licenses`
- `/dashboard/settings`

### Creator routes

Not production-complete:

- `/creator/dashboard`
- `/creator/submit`
- `/creator/submissions`
- `/creator/earnings`
- `/creator/licenses`
- `/creator/profile`

### Admin routes

Not production-complete:

- `/admin`
- `/admin/content`
- `/admin/marketplace`
- `/admin/creators`
- `/admin/moderation`
- `/admin/exports`
- `/admin/licenses`
- `/admin/tiers`
- `/admin/users`
- `/admin/analytics`
- `/admin/releases`
- `/admin/system-health`

## Public positioning

Homepage copy should position the product as:

> URAI Content is the publishing and media engine for the URAI Emotional OS — transforming memory, mood, rituals, voice, insight, and story into beautiful, exportable, licensable human-centered content.

## Required product modules

Repo status:

- Content registry browser: partial
- Story template gallery: public shell / partial
- Ritual template gallery: public shell / partial
- Narrator script preview: public shell / partial
- Voice script pack preview: public shell / partial
- Marketplace catalog: public shell / partial
- Creator submission flow: not production-complete
- Admin moderation queue: not production-complete
- Export hub: public shell / partial
- Pricing and tier gates: public shell / entitlement logic partial
- Licensing center: public shell / partial
- Roadmap/version viewer: public shell / seed-backed partial
- Demo mode: public shell / partial
- SEO/legal pages: public shell / partial

## Required tiers

- Free
- Plus
- Pro
- Creator
- Studio
- Enterprise
- Foundation
- Licensing Partner
- Internal Admin

Each tier must define:

- public content access
- marketplace access
- export limits
- creator tools
- admin rights
- licensing rights
- analytics visibility
- storage/export limits
- upgrade prompts
- Stripe price key placeholders
- entitlement rules

Tier seed records exist and are covered by `npm run seed:system:check`; live enforcement still requires auth, role claims, Stripe, and server-side entitlement checks.

## Required expansion modules

The standalone app should expose or administratively track:

- Emotional OS Kernel Content
- Cognitive Mirror Content
- Digital Mood Weather Content
- Life Replay Content
- ChronoVoice Content
- Companion AI Narrator Content
- Ritual Library
- Insight Marketplace
- Story Mode Generator
- Shadow Realm Content
- Memory Map Content
- Dream Map Content
- Social Archetype Content
- Trust Signal / Echo Mirror Content
- AR/VR Spatial Content
- Creator Marketplace
- Licensing/IP Content
- Foundation/Public-Good Content
- Enterprise Content Packs

Expansion module seed records exist and are covered by `npm run seed:system:check`; live UI/admin workflows are not complete.

## Firebase runtime requirements

The web/runtime app must include or verify:

- Firebase Auth
- Firestore
- Storage
- Hosting or Vercel deployment
- server-side repository adapter implementing `ContentRepository`
- Firestore rules
- Storage rules
- emulator config
- seed scripts
- admin role claims
- creator role claims
- entitlement claims or server-side entitlement lookup

Current status: scaffold/contract-level only. Production Firebase configuration and rules are not verified.

## API/function requirements

Current compiled/scaffolded route surface:

- `/api/health`
- `/api/version`
- `/api/catalog`
- `/api/content/[[...slug]]`
- `/api/admin/seed/canonical-content`
- `/api/system/firebase`

Required future APIs:

- `/api/creator/submit`
- `/api/admin/approve`
- `/api/admin/reject`
- `/api/export/create`
- `/api/export/status`
- `/api/marketplace/list`
- `/api/marketplace/checkout`
- `/api/webhooks/stripe`
- `/api/entitlements/validate`
- `/api/analytics/log`

## Export requirements

Support job records for:

- PDF weekly recap
- PDF story pack
- PNG ritual card
- PNG insight card
- SRT captions
- narrator script pack
- voice script pack
- CapCut-style metadata bundle
- creator media kit
- content pack manifest
- license evidence pack
- social share preview

Current status: package utilities/contracts exist; production export API, queue/worker, Storage writes, artifact downloads, and retries are not complete.

## UI/UX quality bar

- dark-first cinematic interface
- soft aura gradients
- premium typography
- readable spacing
- polished cards and previews
- responsive mobile/tablet/desktop
- accessible focus states
- reduced motion support
- empty/loading/error/success states
- no ugly default UI

Current public shell status is buildable, not final AAA polish.

## Testing requirements

Current repo-backed testing:

- root package lint/typecheck/validation/tests/build/seed checks
- web typecheck/lint/tests/build
- local web route smoke in CI against a started Next server

Still required:

- Playwright/Cypress browser tests
- mobile viewport tests
- auth/dev mock flow tests
- admin/creator route tests
- export job tests
- marketplace gating tests
- deployed URL smoke tests

## Domain setup

Required environment:

```txt
NEXT_PUBLIC_SITE_URL=https://www.uraicontent.com
```

Required redirects:

- `uraicontent.com` -> `www.uraicontent.com`
- `/app` -> `/dashboard`
- `/marketplace` -> public marketplace route
- `/creator` -> public creator landing or creator dashboard depending auth state

## Done-done deployment checklist

Repo-side:

- [x] Package `npm run done` passes locally.
- [x] Web app lint passes locally.
- [x] Web app typecheck passes locally.
- [x] Web app unit/runtime tests pass locally.
- [x] Web app builds locally.
- [x] Web route smoke runs in CI against local Next server.

Still required:

- [ ] Web app browser E2E tests pass.
- [ ] Firebase/hosting deployment succeeds.
- [ ] `https://www.uraicontent.com` loads.
- [ ] `https://uraicontent.com` redirects correctly.
- [ ] Public catalog loads on deployed URL.
- [ ] Pricing loads on deployed URL.
- [ ] Demo loads on deployed URL.
- [ ] Auth guard works.
- [ ] Creator guard works.
- [ ] Admin guard works.
- [ ] Export creation works in dev/staging.
- [ ] Marketplace gating works.
- [ ] Stripe mock/dev checkout works.
- [ ] Firestore rules deployed.
- [ ] Storage rules deployed.
- [ ] Monitoring and alerts configured.
- [ ] Launch checklist completed with SHA, URLs, smoke output, and rollback evidence.

## Anti-fake completion rule

Do not claim that the standalone system is live unless there is a real deployment URL and real command output proving build/test/deploy/smoke success.
