# URAI Content Standalone System Plan

## Purpose

This plan defines how `urai-content` becomes both:

1. the canonical content package for the URAI ecosystem, and
2. the standalone public product at `https://www.uraicontent.com`.

The current repository is a content package/library. The standalone website should consume it rather than replacing it.

## Recommended architecture

### Option A — Separate deployment app, recommended

- Keep this repo as `urai-content` package.
- Create a new deployment app: `urai-content-web`.
- Install/import this package into the web app.
- Deploy the web app to Firebase Hosting or Vercel.

Benefits:

- preserves clean package boundaries
- avoids breaking existing URAI consumers
- keeps web build/test/deploy concerns separate from content contracts
- allows faster standalone deployment

### Option B — Monorepo conversion

Convert this repo into:

```txt
apps/
  web/
packages/
  content/
```

Move existing package code into `packages/content` and add a Next.js app under `apps/web`.

Benefits:

- one repo for package and site
- easier local linking

Risks:

- bigger migration
- more chance of breaking current package scripts
- requires workspace tooling and CI changes

## Standalone web app requirements

The standalone site must include:

### Public routes

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

### Protected user routes

- `/dashboard`
- `/dashboard/content`
- `/dashboard/stories`
- `/dashboard/rituals`
- `/dashboard/exports`
- `/dashboard/purchases`
- `/dashboard/licenses`
- `/dashboard/settings`

### Creator routes

- `/creator/dashboard`
- `/creator/submit`
- `/creator/submissions`
- `/creator/earnings`
- `/creator/licenses`
- `/creator/profile`

### Admin routes

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

- Content registry browser
- Story template gallery
- Ritual template gallery
- Narrator script preview
- Voice script pack preview
- Marketplace catalog
- Creator submission flow
- Admin moderation queue
- Export hub
- Pricing and tier gates
- Licensing center
- Roadmap/version viewer
- Demo mode
- SEO/legal pages

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

## Firebase runtime requirements

The web/runtime app must include:

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

## API/function requirements

- `/api/health`
- `/api/version`
- `/api/catalog`
- `/api/content/[slug]`
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

## Testing requirements

The deployment app must include:

- unit tests for schemas, tier gates, exports, SRT, entitlements, provenance
- integration tests for catalog, dashboard, creator submission, admin approval, export creation, API health/version
- Playwright E2E for homepage, catalog, pricing, creator, demo, dashboard, admin review, export status, and mobile viewport
- smoke tests for deployed URL

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

- [ ] Package `npm run done` passes.
- [ ] Web app lint passes.
- [ ] Web app typecheck passes.
- [ ] Web app unit tests pass.
- [ ] Web app integration tests pass.
- [ ] Web app E2E tests pass.
- [ ] Web app builds.
- [ ] Firebase/hosting deployment succeeds.
- [ ] `https://www.uraicontent.com` loads.
- [ ] `https://uraicontent.com` redirects correctly.
- [ ] Public catalog loads.
- [ ] Pricing loads.
- [ ] Demo loads.
- [ ] Auth guard works.
- [ ] Creator guard works.
- [ ] Admin guard works.
- [ ] Export creation works in dev/staging.
- [ ] Marketplace gating works.
- [ ] Stripe mock/dev checkout works.
- [ ] Firestore rules deployed.
- [ ] Storage rules deployed.
- [ ] Launch checklist completed.

## Anti-fake completion rule

Do not claim that the standalone system is live unless there is a real deployment URL and real command output proving build/test/deploy success.
