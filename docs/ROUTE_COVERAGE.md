# URAI Content Route Coverage

This matrix tracks the standalone website and runtime routes required for `www.uraicontent.com`.

## Current truth

`urai-content` is a package-plus-runtime repository:

- the root TypeScript package remains the canonical content/domain package for the URAI ecosystem
- `apps/web` is a standalone Next.js runtime scaffold for the public URAI Content site
- repo-side API route tests exist for health, version, catalog, content detail, seed authorization, creator submissions, admin queue/detail, and moderation
- local web validation is covered by `npm run web:check`
- local route smoke is covered by `npm run web:smoke:routes`
- this route tracker does **not** claim a live production deployment

A route can be buildable and smoke-tested locally while still not live at `www.uraicontent.com`.

## Status key

- **READY**: Source exists, automated coverage exists, and production/deployed evidence exists for the stated scope.
- **PARTIAL**: Source exists but lacks final deployed/provider/live evidence.
- **GATED**: Source exists but intentionally denies, disables, or preview-gates unsafe production behavior.
- **PREVIEW**: Public/source-visible scaffold or local-only experience that must not be sold as live production.
- **BLOCKED**: Depends on provider credentials, Firebase, Stripe, DNS, deployment, monitoring, or external setup.
- **NOT STARTED**: Required by product/docs but no implementation exists in this repository.

Legacy governance phrase: Do not mark a route **Done** unless the route has real implementation evidence, automated verification evidence, provider evidence where applicable, and deployment evidence for the scope being claimed.

## Public routes

Current status: public route shells exist in the standalone web runtime. They remain **PARTIAL/PREVIEW** until final deployed URL smoke, mobile/browser E2E, production metadata, DNS/SSL, and release evidence are attached.

| Route | Current status | Reason / required evidence | Owner | Priority |
| --- | --- | --- | --- | --- |
| `/` | PARTIAL | Public shell exists; requires final deployed smoke, SEO/mobile evidence | Frontend/Product | P1 |
| `/about` | PARTIAL | Public shell exists; requires final copy/legal review/deployed smoke | Frontend/Product | P1 |
| `/content` | PARTIAL | Reads canonical content registry; Firestore-backed browsing and deployed smoke pending | Frontend/Backend | P1 |
| `/stories` | PARTIAL | Gallery scaffold requires provider-backed real records and browser smoke | Frontend/Backend | P2 |
| `/rituals` | PARTIAL | Gallery scaffold requires provider-backed real records and browser smoke | Frontend/Backend | P2 |
| `/narrator` | PARTIAL | Preview copy requires deployed route/browser proof | Frontend/Product | P2 |
| `/voice-packs` | PARTIAL | Preview copy requires deployed route/browser proof | Frontend/Product | P2 |
| `/marketplace` | GATED/BLOCKED | Checkout must stay disabled until Stripe + entitlement proof exists | Full stack | P1 |
| `/creator` | PREVIEW | Public creator landing only; protected creator app flows are not production complete | Frontend/Product | P2 |
| `/pricing` | GATED/BLOCKED | Pricing can be informational only; payment activation blocked by Stripe proof | Frontend/Payments | P1 |
| `/licensing` | PARTIAL | Requires legal review and deployed smoke | Frontend/Product | P3 |
| `/exports` | GATED/BLOCKED | Export hub must stay unavailable until worker/storage/download proof exists | Frontend/Backend | P1 |
| `/demo` | PREVIEW | Demo content must remain labeled demo/preview | Frontend/Product | P2 |
| `/roadmap` | PARTIAL | Must link evidence and avoid unsupported launch claims | Frontend/Product | P2 |
| `/versions` | PARTIAL | Must include release SHA and deployed proof before READY | Frontend/Product | P2 |
| `/privacy` | PARTIAL | Requires final legal/privacy review and deployed smoke | Frontend/Legal | P1 |
| `/terms` | PARTIAL | Requires final legal review and deployed smoke | Frontend/Legal | P1 |
| `/contact` | PARTIAL | Contact target/spam protection/deployed smoke pending | Frontend/Product | P2 |
| `/robots.txt` | PARTIAL | Requires production host verification and deployed response | Frontend/SEO | P1 |
| `/sitemap.xml` | PARTIAL | Requires production host verification and deployed response | Frontend/SEO | P1 |
| `/_not-found` | PARTIAL | Requires browser/deployed evidence | Frontend/Product | P2 |

## Protected user routes

Current status: **BLOCKED**. These routes must remain blocked or dev-only until Firebase Auth/session handling, role claims, entitlement lookup, owner-scoped reads, and protected-route tests are proven against staging/production.

| Route | Current status | Required implementation | Owner | Priority |
| --- | --- | --- | --- | --- |
| `/dashboard` | BLOCKED | Authenticated dashboard shell with Firebase/session guard | Frontend/Auth | P2 |
| `/dashboard/content` | BLOCKED | User content library backed by authenticated repository reads | Full stack | P2 |
| `/dashboard/stories` | BLOCKED | User story templates/history with ownership checks | Full stack | P2 |
| `/dashboard/rituals` | BLOCKED | User ritual library with ownership checks | Full stack | P2 |
| `/dashboard/exports` | BLOCKED | Export jobs, status, downloads, Storage access controls | Full stack | P1 |
| `/dashboard/purchases` | BLOCKED | Marketplace purchases backed by Stripe/entitlements | Full stack/Payments | P1 |
| `/dashboard/licenses` | BLOCKED | User licenses and license evidence packs | Full stack | P3 |
| `/dashboard/settings` | BLOCKED | Account settings, privacy/export/deletion controls | Frontend/Auth | P3 |

## Creator routes

Current status: public creator route can exist as preview. Server API foundations for submissions exist, but production creator UX remains blocked until provider-backed auth, Firestore persistence, deployed browser tests, and owner-scope proof are attached.

| Route | Current status | Required implementation | Owner | Priority |
| --- | --- | --- | --- | --- |
| `/creator/dashboard` | BLOCKED | Creator dashboard guarded by creator role | Frontend/Auth | P2 |
| `/creator/submit` | BLOCKED | Creator submission UI with Firebase-backed writes and owner-scope browser proof | Full stack | P2 |
| `/creator/submissions` | BLOCKED | Submission status/history with owner scope and provider proof | Full stack | P2 |
| `/creator/earnings` | BLOCKED | Earnings placeholder or payment-connected view; no fake earnings | Payments/Product | P4 |
| `/creator/licenses` | BLOCKED | Creator licensing view and rights metadata | Full stack | P4 |
| `/creator/profile` | BLOCKED | Creator profile management and safe public/private fields | Frontend/Auth | P4 |

## Admin routes

Current status: **BLOCKED** for UI production. Server API foundations exist for creator submission queue/detail/moderation and seed authorization. Admin UI routes must remain blocked until admin custom claims, browser proof, audit logs, and deployed provider evidence exist.

| Route | Current status | Required implementation | Owner | Priority |
| --- | --- | --- | --- | --- |
| `/admin` | BLOCKED | Admin dashboard guarded by admin role | Frontend/Auth | P2 |
| `/admin/content` | BLOCKED | Content management with admin authorization and audit logging | Full stack | P2 |
| `/admin/marketplace` | BLOCKED | Marketplace item management and moderation state | Full stack | P3 |
| `/admin/creators` | BLOCKED | Creator management and role review | Full stack | P3 |
| `/admin/moderation` | BLOCKED | Moderation queue approval/rejection with notes | Full stack | P2 |
| `/admin/exports` | BLOCKED | Export job monitoring and retry controls | Full stack/Infra | P3 |
| `/admin/licenses` | BLOCKED | License management and evidence records | Full stack | P4 |
| `/admin/tiers` | BLOCKED | Tier and entitlement management | Full stack/Payments | P3 |
| `/admin/users` | BLOCKED | User management and role claims | Auth/Backend | P4 |
| `/admin/analytics` | BLOCKED | Analytics and telemetry dashboard | Full stack/Analytics | P4 |
| `/admin/releases` | BLOCKED | Release log and publishing controls | Full stack/Release | P3 |
| `/admin/system-health` | BLOCKED | Runtime health, queues, and integrations | Infra/Backend | P3 |

## API/function route coverage

Current status: source-level API route foundations exist and have test files in `apps/web/tests`. These routes remain **PARTIAL/GATED/BLOCKED** until provider-backed persistence/auth and live smoke evidence exist.

| Route | Current status | Reason / required evidence | Owner | Priority |
| --- | --- | --- | --- | --- |
| `/api/health` | PARTIAL | Source/test coverage exists; deployed uptime/smoke pending | Backend/Infra | P1 |
| `/api/version` | PARTIAL | Source/test coverage exists; release SHA/deployed proof pending | Backend/Infra | P1 |
| `/api/catalog` | PARTIAL | Canonical read path exists; Firestore-backed public catalog proof pending | Backend | P1 |
| `/api/content/[[...slug]]` | PARTIAL | Public detail read exists; deployed public/draft/private proof pending | Backend | P1 |
| `/api/system/firebase` | PARTIAL | Safe status route exists; provider proof pending | Backend/Infra | P1 |
| `/api/admin/seed/canonical-content` | GATED/BLOCKED | Admin/seed-token guarded and refuses writes without Firebase Admin | Backend/Security | P1 |
| `/api/creator/submissions` | PARTIAL/GATED | Source route exists with creator/owner checks; production persistence and deployed proof pending | Full stack | P1 |
| `/api/creator/submissions/[id]` | PARTIAL/GATED | Source route exists with owner/admin read checks; production persistence and deployed proof pending | Full stack | P1 |
| `/api/admin/creator-submissions` | PARTIAL/GATED | Source route exists with admin guard; provider-backed admin proof pending | Full stack | P1 |
| `/api/admin/creator-submissions/[id]` | PARTIAL/GATED | Source route exists with admin guard; provider-backed admin proof pending | Full stack | P1 |
| `/api/admin/creator-submissions/[id]/moderate` | PARTIAL/GATED | Source route exists with admin guard and moderation log call; deployed proof pending | Full stack | P1 |
| `/api/export/create` | NOT STARTED/BLOCKED | Export job creation and worker queue missing | Backend | P1 |
| `/api/export/status` | NOT STARTED/BLOCKED | Export status lookup and owner checks missing | Backend | P1 |
| `/api/marketplace/list` | NOT STARTED/BLOCKED | Marketplace API not provider-verified | Backend | P2 |
| `/api/marketplace/checkout` | NOT STARTED/BLOCKED | Stripe checkout missing | Payments | P1 |
| `/api/webhooks/stripe` | NOT STARTED/BLOCKED | Stripe webhook/signature/entitlement write missing | Payments | P1 |
| `/api/entitlements/validate` | NOT STARTED/BLOCKED | Dedicated entitlement validation endpoint missing | Backend/Auth | P2 |
| `/api/analytics/log` | NOT STARTED/BLOCKED | Privacy-safe telemetry logging endpoint missing | Analytics/Backend | P3 |

## Verification requirements to move routes forward

A route can move to **READY** only when all applicable evidence exists:

- route file exists in `apps/web`
- route is covered by web tests or route smoke
- page has final copy or intentionally marked placeholder copy
- page has title, description, canonical URL, and Open Graph metadata where applicable
- mobile viewport behavior is smoke-tested
- route is included or intentionally excluded from sitemap
- deployed URL smoke passes after production/staging deploy
- protected routes enforce auth/role checks server-side
- API routes have contract tests for success and failure states
- Firebase/Auth/Firestore/Storage/Stripe evidence exists when the route depends on those systems

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

Do not mark a route **READY** unless the route has real implementation evidence, automated verification evidence, provider evidence where applicable, and deployment evidence for the scope being claimed.
