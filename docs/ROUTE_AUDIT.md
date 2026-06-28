# URAI Content Route Audit

Date: 2026-06-29
Branch: `production-lock/urai-content-done-done`

## Public Routes

| Route | Reality | User-visible status | Production-ready? | Notes |
| --- | --- | --- | --- | --- |
| `/` | Public static shell | Real marketing/catalog entry surface | Partial | Needs deployed URL smoke and final product proof. |
| `/about` | Public static shell | Honest informational surface | Partial | Needs deployed URL smoke. |
| `/product` | Public static shell | Product overview | Partial | Must avoid claiming live paid/export flows. |
| `/how-it-works` | Public static shell | Explainer | Partial | Needs browser smoke. |
| `/privacy` | Public static shell | Policy surface | Partial | Legal review still required before production launch. |
| `/data-ownership` | Public static shell | Ownership/trust copy | Partial | Needs final legal/product review. |
| `/users` | Public static shell | Audience page | Partial | Marketing only. |
| `/researchers` | Public static shell | Audience page | Partial | No live researcher workflow proven. |
| `/partners` | Public static shell | Audience page | Partial | No live partner workflow proven. |
| `/investors` | Public static shell | Audience page | Partial | Informational only. |
| `/demo` | Public static shell/sample | Demo/sample data | Not production feature proof | Must remain demo-labeled. |
| `/waitlist` | Public lead surface | Works only as preview unless Firebase configured | Partial | API returns non-durable preview when Firebase missing. |
| `/faq` | Public static shell | FAQ | Partial | Needs deployed smoke. |
| `/terms` | Public static shell | Terms placeholder/finalization surface | Not final legal proof | Must not claim final legal review. |
| `/updates` | Public static shell | Updates | Partial | Static only. |
| `/contact` | Public lead surface | Works only as preview unless Firebase configured | Partial | API returns preview when Firebase missing. |
| `/content` | Runtime/catalog shell | Reads catalog/runtime data | Partial | Firestore mode requires Firebase Admin proof. |
| `/stories` | Public product-preview shell | Honest staged personalization | No | User-specific persistence is gated. |
| `/rituals` | Public product-preview shell | Honest staged runtime | No | Scheduling/persistence gated. |
| `/narrator` | Public product-preview shell | Honest staged generation | No | Voice/live generation gated. |
| `/voice-packs` | Public product-preview shell | Honest staged marketplace | No | Paid entitlement/checkout not live. |
| `/marketplace` | Public product-preview shell | Waitlist/preview only | No | Stripe/entitlements not live. |
| `/creator` | Public creator landing | Landing only | Partial | Protected creator UI still gated/API-only. |
| `/pricing` | Public pricing/packaging shell | No live checkout proof | No | Must not claim purchase flow live. |
| `/licensing` | Public licensing shell | Preview only | No | Partner licensing vault not configured. |
| `/exports` | Public export preview shell | Preview only | No | Export worker/storage/download missing. |
| `/roadmap` | Public roadmap | Honest gated roadmap | Partial | Must remain roadmap-labeled. |
| `/versions` | Public version surface | Static/version info | Partial | Needs deployed smoke. |

## Protected/Admin Routes

| Route | Reality | Production-ready? | Notes |
| --- | --- | --- | --- |
| `/dashboard` | Not proven implemented | No | Do not market as live. |
| `/creator/dashboard` | Not proven implemented | No | Creator APIs exist; protected UI not proven. |
| `/creator/submit` | Not proven implemented | No | Creator submission API exists; route/UI not proven. |
| `/admin` | Not proven implemented | No | Admin APIs exist; protected UI not proven. |
| `/admin/moderation` | Not proven implemented | No | Moderation API exists with admin guard and fail-closed persistence. |
| `/admin/content` | Not proven implemented | No | Do not claim admin content UI live. |
| `/admin/exports` | Not proven implemented | No | Export system not live. |
| `/admin/system-health` | Not proven implemented | No | `/api/health` and `/api/system/firebase` exist, UI not proven. |

## API Routes

| API | After this branch | Remaining blocker |
| --- | --- | --- |
| `/api/health` | Reports degraded vs healthy based on runtime persistence safety. | Deployed URL smoke. |
| `/api/version` | Existing version endpoint. | Deployed URL smoke. |
| `/api/catalog` | Existing catalog endpoint. | Firestore-backed mode proof. |
| `/api/content/*` | Existing content fetch endpoint. | Firestore-backed mode proof. |
| `/api/creator/submissions` | Auth-gated and fails closed without durable persistence in production. | Firebase Admin + protected UI proof. |
| `/api/creator/submissions/[id]` | Auth-gated and fails closed without durable persistence in production. | Firebase Admin + protected UI proof. |
| `/api/admin/creator-submissions` | Admin-gated and fails closed without durable persistence in production. | Firebase Admin + admin UI proof. |
| `/api/admin/creator-submissions/[id]/moderate` | Admin-gated with moderation log and fail-closed persistence. | Firebase Admin + emulator/staging proof. |
| `/api/leads` | Existing preview/Firebase-gated write path. | Firebase proof and spam controls. |
| `/api/analytics` | Existing preview/Firebase-gated write path. | Firebase proof and privacy review. |
| Export APIs | Not proven present/live | Implement create/status/download/storage/authorization before claims. |
