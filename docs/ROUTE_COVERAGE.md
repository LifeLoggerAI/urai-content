# URAI Content Route Coverage

This matrix tracks the standalone website and runtime routes required for `www.uraicontent.com`.

Current truth: this repository is a content package/library and does not currently contain a deployed web app or App Router implementation. Every route below is therefore **Not Started** in this repository unless a future web app or monorepo conversion adds it.

## Status key

- **Done**: Route exists, is tested, and is deployed or deployable.
- **Partial**: Route exists but lacks real data, auth, tests, metadata, or production wiring.
- **Not Started**: Route is required by product/docs but no implementation exists.
- **Blocked**: Route depends on architecture, auth, Firebase, Stripe, DNS, or runtime app setup.
- **Unknown**: Route could not be verified.

## Public routes

| Route | Current status | Required implementation | Owner | Priority |
| --- | --- | --- | --- | --- |
| `/` | Not Started | Homepage, hero, CTAs, SEO, responsive layout | Frontend/Product | P1 |
| `/about` | Not Started | Product/company explanation, trust copy, SEO | Frontend/Product | P1 |
| `/content` | Not Started | Public content registry browser | Frontend/Backend | P1 |
| `/stories` | Not Started | Story template gallery | Frontend/Backend | P2 |
| `/rituals` | Not Started | Ritual template gallery | Frontend/Backend | P2 |
| `/narrator` | Not Started | Narrator script preview | Frontend/Product | P2 |
| `/voice-packs` | Not Started | Voice script pack preview | Frontend/Product | P2 |
| `/marketplace` | Not Started | Marketplace catalog with tier gates | Full stack | P3 |
| `/creator` | Not Started | Creator landing page and CTA | Frontend/Product | P2 |
| `/pricing` | Not Started | Tier pricing from `tierConfigs` | Frontend/Payments | P2 |
| `/licensing` | Not Started | Licensing overview and partner CTA | Frontend/Product | P3 |
| `/exports` | Not Started | Export hub overview | Frontend/Backend | P3 |
| `/demo` | Not Started | Demo content experience | Frontend/Product | P2 |
| `/roadmap` | Not Started | Roadmap from `roadmapPhases` | Frontend/Product | P2 |
| `/versions` | Not Started | Version and phase status page | Frontend/Product | P2 |
| `/privacy` | Not Started | Privacy/legal page | Frontend/Legal | P1 |
| `/terms` | Not Started | Terms/legal page | Frontend/Legal | P1 |
| `/contact` | Not Started | Contact form or CTA | Frontend/Product | P2 |

## Protected user routes

| Route | Current status | Required implementation | Owner | Priority |
| --- | --- | --- | --- | --- |
| `/dashboard` | Not Started | Authenticated dashboard shell | Frontend/Auth | P2 |
| `/dashboard/content` | Not Started | User content library | Full stack | P2 |
| `/dashboard/stories` | Not Started | User story templates and history | Full stack | P2 |
| `/dashboard/rituals` | Not Started | User ritual library | Full stack | P2 |
| `/dashboard/exports` | Not Started | Export jobs, status, and downloads | Full stack | P3 |
| `/dashboard/purchases` | Not Started | Marketplace purchases | Full stack/Payments | P3 |
| `/dashboard/licenses` | Not Started | User licenses | Full stack | P3 |
| `/dashboard/settings` | Not Started | Account settings and preferences | Frontend/Auth | P3 |

## Creator routes

| Route | Current status | Required implementation | Owner | Priority |
| --- | --- | --- | --- | --- |
| `/creator/dashboard` | Not Started | Creator dashboard guarded by creator role | Frontend/Auth | P3 |
| `/creator/submit` | Not Started | Creator submission form and validation | Full stack | P3 |
| `/creator/submissions` | Not Started | Submission status and history | Full stack | P3 |
| `/creator/earnings` | Not Started | Earnings placeholder or payment-connected view | Payments/Product | P4 |
| `/creator/licenses` | Not Started | Creator licensing view | Full stack | P4 |
| `/creator/profile` | Not Started | Creator profile management | Frontend/Auth | P4 |

## Admin routes

| Route | Current status | Required implementation | Owner | Priority |
| --- | --- | --- | --- | --- |
| `/admin` | Not Started | Admin dashboard guarded by admin role | Frontend/Auth | P3 |
| `/admin/content` | Not Started | Content management | Full stack | P3 |
| `/admin/marketplace` | Not Started | Marketplace item management | Full stack | P3 |
| `/admin/creators` | Not Started | Creator management | Full stack | P3 |
| `/admin/moderation` | Not Started | Moderation queue approval and rejection | Full stack | P3 |
| `/admin/exports` | Not Started | Export job monitoring | Full stack/Infra | P4 |
| `/admin/licenses` | Not Started | License management | Full stack | P4 |
| `/admin/tiers` | Not Started | Tier and entitlement management | Full stack/Payments | P4 |
| `/admin/users` | Not Started | User management and role claims | Auth/Backend | P4 |
| `/admin/analytics` | Not Started | Analytics and telemetry dashboard | Full stack/Analytics | P4 |
| `/admin/releases` | Not Started | Release log and publishing controls | Full stack/Release | P4 |
| `/admin/system-health` | Not Started | Runtime health, queues, and integrations | Infra/Backend | P4 |

## API/function route requirements

API route implementation belongs in the future runtime web app or functions app. Required endpoints include health, version, catalog, content detail, creator submission, admin moderation decisions, export create/status, marketplace list/checkout, payment webhook handling, entitlement validation, and analytics logging.

## Verification rule

A route can move from **Not Started** only when the implementation exists in a deployable runtime app and at least one automated test proves the route behavior.
