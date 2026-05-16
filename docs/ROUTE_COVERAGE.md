# URAI Content Route Coverage

This matrix tracks the standalone website and runtime routes required for `www.uraicontent.com`.

## Current truth

`urai-content` is now a package-plus-runtime repository:

- the root TypeScript package remains the canonical content/domain package for the URAI ecosystem
- `apps/web` is a standalone Next.js runtime scaffold for the public URAI Content site
- local web validation is covered by `npm run web:check`
- local route smoke is covered by `npm run web:smoke:routes`
- GitHub Actions runs package validation, web validation, and local route smoke coverage

This route tracker does **not** claim a live production deployment. A route can be buildable and smoke-tested locally while still not live at `www.uraicontent.com`.

## Status key

- **Done**: Route exists, is tested, and has deployment or local smoke evidence for the stated scope.
- **Partial**: Route exists but lacks final copy, real data, auth, tests, metadata, live deployment, or production wiring.
- **Not Started**: Route is required by product/docs but no implementation exists in this repository.
- **Blocked**: Route depends on architecture, auth, Firebase, Stripe, DNS, provider credentials, or runtime setup.
- **Unknown**: Route could not be verified.

## Public routes

Current status: public route shells exist in the standalone web runtime and are locally buildable. They remain **Partial** until final copy, CTAs, metadata, mobile smoke, browser E2E, and deployed URL smoke evidence are complete.

| Route | Current status | Required implementation | Owner | Priority |
| --- | --- | --- | --- | --- |
| `/` | Partial | Final homepage copy, hero, CTAs, SEO, responsive polish, deployed smoke | Frontend/Product | P1 |
| `/about` | Partial | Final product/company explanation, trust copy, SEO, deployed smoke | Frontend/Product | P1 |
| `/content` | Partial | Public content registry browser with real data and deployed smoke | Frontend/Backend | P1 |
| `/stories` | Partial | Story template gallery with real records and browser smoke | Frontend/Backend | P2 |
| `/rituals` | Partial | Ritual template gallery with real records and browser smoke | Frontend/Backend | P2 |
| `/narrator` | Partial | Narrator script preview, metadata, browser smoke | Frontend/Product | P2 |
| `/voice-packs` | Partial | Voice script pack preview, metadata, browser smoke | Frontend/Product | P2 |
| `/marketplace` | Partial | Marketplace catalog, tier gates, checkout-disabled safe state until Stripe is configured | Full stack | P2 |
| `/creator` | Partial | Creator landing page, CTA, auth-aware destination behavior | Frontend/Product | P2 |
| `/pricing` | Partial | Tier pricing from `tierConfigs`, Stripe readiness labels, production CTA rules | Frontend/Payments | P2 |
| `/licensing` | Partial | Licensing overview, partner CTA, legal review, deployed smoke | Frontend/Product | P3 |
| `/exports` | Partial | Export hub overview, safe unavailable states until export worker/storage exist | Frontend/Backend | P3 |
| `/demo` | Partial | Demo content experience, seeded data coverage, browser smoke | Frontend/Product | P2 |
| `/roadmap` | Partial | Roadmap from `roadmapPhases`, implementation evidence links | Frontend/Product | P2 |
| `/versions` | Partial | Version and phase status page tied to repo evidence | Frontend/Product | P2 |
| `/privacy` | Partial | Privacy/legal page, final legal review, deployed smoke | Frontend/Legal | P1 |
| `/terms` | Partial | Terms/legal page, final legal review, deployed smoke | Frontend/Legal | P1 |
| `/contact` | Partial | Contact CTA/form target, spam protection decision, deployed smoke | Frontend/Product | P2 |
| `/robots.txt` | Partial | Verify production host, sitemap URL, and deployed response | Frontend/SEO | P1 |
| `/sitemap.xml` | Partial | Verify all canonical URLs, lastmod policy, deployed response | Frontend/SEO | P1 |
| `/_not-found` | Partial | 404 copy, SEO behavior, browser smoke | Frontend/Product | P2 |

## Protected user routes

Current status: not production-complete. These routes must remain blocked or dev-only until Firebase Auth/session handling, role claims, entitlement lookup, and protected-route tests exist.

| Route | Current status | Required implementation | Owner | Priority |
| --- | --- | --- | --- | --- |
| `/dashboard` | Blocked | Authenticated dashboard shell with Firebase/session guard | Frontend/Auth | P2 |
| `/dashboard/content` | Blocked | User content library backed by authenticated repository reads | Full stack | P2 |
| `/dashboard/stories` | Blocked | User story templates/history with ownership checks | Full stack | P2 |
| `/dashboard/rituals` | Blocked | User ritual library with ownership checks | Full stack | P2 |
| `/dashboard/exports` | Blocked | Export jobs, status, downloads, Storage access controls | Full stack | P3 |
| `/dashboard/purchases` | Blocked | Marketplace purchases backed by Stripe/entitlements | Full stack/Payments | P3 |
| `/dashboard/licenses` | Blocked | User licenses and license evidence packs | Full stack | P3 |
| `/dashboard/settings` | Blocked | Account settings, privacy/export/deletion controls | Frontend/Auth | P3 |

## Creator routes

Current status: not production-complete. Public creator landing can exist, but creator-dashboard routes require role-guarded runtime behavior.

| Route | Current status | Required implementation | Owner | Priority |
| --- | --- | --- | --- | --- |
| `/creator/dashboard` | Blocked | Creator dashboard guarded by creator role | Frontend/Auth | P3 |
| `/creator/submit` | Blocked | Creator submission form, validation, Firestore writes, owner scope | Full stack | P3 |
| `/creator/submissions` | Blocked | Submission status/history with owner scope | Full stack | P3 |
| `/creator/earnings` | Blocked | Earnings placeholder or payment-connected view | Payments/Product | P4 |
| `/creator/licenses` | Blocked | Creator licensing view and rights metadata | Full stack | P4 |
| `/creator/profile` | Blocked | Creator profile management and safe public/private fields | Frontend/Auth | P4 |

## Admin routes

Current status: not production-complete. These must remain blocked until admin role claims, server-side authorization, audit logging, and protected tests exist.

| Route | Current status | Required implementation | Owner | Priority |
| --- | --- | --- | --- | --- |
| `/admin` | Blocked | Admin dashboard guarded by admin role | Frontend/Auth | P3 |
| `/admin/content` | Blocked | Content management with admin authorization and audit logging | Full stack | P3 |
| `/admin/marketplace` | Blocked | Marketplace item management and moderation state | Full stack | P3 |
| `/admin/creators` | Blocked | Creator management and role review | Full stack | P3 |
| `/admin/moderation` | Blocked | Moderation queue approval/rejection with notes | Full stack | P3 |
| `/admin/exports` | Blocked | Export job monitoring and retry controls | Full stack/Infra | P4 |
| `/admin/licenses` | Blocked | License management and evidence records | Full stack | P4 |
| `/admin/tiers` | Blocked | Tier and entitlement management | Full stack/Payments | P4 |
| `/admin/users` | Blocked | User management and role claims | Auth/Backend | P4 |
| `/admin/analytics` | Blocked | Analytics and telemetry dashboard | Full stack/Analytics | P4 |
| `/admin/releases` | Blocked | Release log and publishing controls | Full stack/Release | P4 |
| `/admin/system-health` | Blocked | Runtime health, queues, and integrations | Infra/Backend | P4 |

## API/function route coverage

Current status: the web runtime compiles the scaffolded API route surface below. These routes remain **Partial** until endpoint contracts, error status behavior, auth/persistence boundaries, and live smoke tests are complete.

| Route | Current status | Required implementation | Owner | Priority |
| --- | --- | --- | --- | --- |
| `/api/health` | Partial | Harden response contract, uptime/deployed smoke | Backend/Infra | P1 |
| `/api/version` | Partial | Include release SHA, package version, environment, deployed smoke | Backend/Infra | P1 |
| `/api/catalog` | Partial | Published-public-only reads, pagination, filtering, tests | Backend | P1 |
| `/api/content/[[...slug]]` | Partial | 200/400/403/404 contract tests, public/draft/private protection | Backend | P1 |
| `/api/system/firebase` | Partial | Safe redacted Firebase status, no secret exposure, staging/prod checks | Backend/Infra | P1 |
| `/api/admin/seed/canonical-content` | Partial/Blocked | Admin-only guard, audit logging, staging-only protections | Backend/Security | P1 |
| `/api/creator/submit` | Not Started | Creator submission API, validation, owner scope, tests | Full stack | P2 |
| `/api/admin/approve` | Not Started | Admin moderation decision API with notes/audit | Full stack | P2 |
| `/api/admin/reject` | Not Started | Admin moderation rejection API with notes/audit | Full stack | P2 |
| `/api/export/create` | Not Started | Export job creation, validation, queue write | Backend | P2 |
| `/api/export/status` | Not Started | Export status lookup with ownership checks | Backend | P2 |
| `/api/marketplace/list` | Not Started | Marketplace listing with tier visibility | Backend | P2 |
| `/api/marketplace/checkout` | Not Started/Blocked | Stripe checkout session creation after keys/prices exist | Payments | P2 |
| `/api/webhooks/stripe` | Not Started/Blocked | Verified webhook handling and entitlement writes | Payments | P2 |
| `/api/entitlements/validate` | Not Started | Server-side entitlement validation endpoint | Backend/Auth | P2 |
| `/api/analytics/log` | Not Started | Privacy-safe telemetry logging | Analytics/Backend | P3 |

## Verification requirements to move routes forward

A route can move from **Partial** to **Done** only when all applicable evidence exists:

- route file exists in `apps/web`
- route is covered by web tests or route smoke
- page has final copy or intentionally marked placeholder copy
- page has title, description, canonical URL, and Open Graph metadata where applicable
- mobile viewport behavior is smoke-tested
- route is included or intentionally excluded from sitemap
- deployed URL smoke passes after production/staging deploy
- protected routes enforce auth/role checks server-side
- API routes have contract tests for success and failure states

## Launch verification commands

Local gates:

```bash
npm run web:install
npm run web:check
npm run web:smoke:routes -- --base-url=http://127.0.0.1:3000
```

Live gates after deployment:

```bash
curl -I https://www.uraicontent.com
curl -I https://uraicontent.com
curl https://www.uraicontent.com/api/health
curl https://www.uraicontent.com/api/version
npm run web:smoke:routes -- --base-url=https://www.uraicontent.com
```

## Final rule

Do not mark a route **Done** unless the route has real implementation evidence, automated verification evidence, and deployment evidence for the scope being claimed.
