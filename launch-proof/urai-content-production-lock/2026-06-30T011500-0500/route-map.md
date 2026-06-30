# Route Map

Starting SHA: 4366390d7691d0cf5b3e728f2452c729a75b893f
Ending SHA: final branch head after proof commits; see PR/final response.
Branch: production-lock-content-2026-06-30
Evidence scope: source-level docs/code inspection; route execution blocked until CI/local runtime.

## Public pages

- / — PARTIAL — public shell; deployed smoke missing.
- /about — PARTIAL — public shell; deployed smoke/legal copy proof missing.
- /content — PARTIAL — reads canonical content; Firestore/deployed proof missing.
- /stories — PARTIAL — scaffold; provider-backed records missing.
- /rituals — PARTIAL — scaffold; provider-backed records missing.
- /narrator — PARTIAL — preview; deployed proof missing.
- /voice-packs — PARTIAL — preview; deployed proof missing.
- /marketplace — GATED/BLOCKED — Stripe/entitlement proof missing.
- /creator — PREVIEW — public landing only.
- /pricing — GATED/BLOCKED — informational only until Stripe proof.
- /licensing — PARTIAL — legal/deployed proof missing.
- /exports — GATED/BLOCKED — worker/storage/download proof missing.
- /demo — PREVIEW — demo data must remain labeled.
- /roadmap — PARTIAL — evidence links required.
- /versions — PARTIAL — release SHA/deployed proof required.
- /privacy — PARTIAL — legal/deployed proof required.
- /terms — PARTIAL — legal/deployed proof required.
- /contact — PARTIAL — target/spam/deployed proof missing.
- /robots.txt — PARTIAL — production host proof missing.
- /sitemap.xml — PARTIAL — production host proof missing.
- /_not-found — PARTIAL — browser/deployed proof missing.

## Protected user routes

- /dashboard — BLOCKED — Firebase Auth/session guard proof missing.
- /dashboard/content — BLOCKED — owner-scoped provider reads missing.
- /dashboard/stories — BLOCKED — owner-scoped provider reads missing.
- /dashboard/rituals — BLOCKED — owner-scoped provider reads missing.
- /dashboard/exports — BLOCKED — export lifecycle/storage proof missing.
- /dashboard/purchases — BLOCKED — Stripe/entitlement proof missing.
- /dashboard/licenses — BLOCKED — license provider proof missing.
- /dashboard/settings — BLOCKED — account/privacy controls not verified.

## Creator and admin UI

- /creator/dashboard — BLOCKED — creator role browser proof missing.
- /creator/submit — BLOCKED — UI/provider writes/browser proof missing.
- /creator/submissions — BLOCKED — UI/owner-scope provider proof missing.
- /admin and admin child routes — BLOCKED — admin UI/provider/browser proof missing.

## APIs

- /api/health — PARTIAL — source exists; live smoke missing.
- /api/version — PARTIAL — source exists; release/deploy proof missing.
- /api/catalog — PARTIAL — source exists; provider/deploy proof missing.
- /api/content catch-all — PARTIAL — source exists; deployed public/private proof missing.
- /api/system/firebase — PARTIAL — source exists; provider proof missing.
- /api/admin/seed/canonical-content — GATED/BLOCKED — admin/seed token guard exists; refuses without Firebase Admin.
- /api/creator/submissions — PARTIAL/GATED — source exists; provider persistence proof missing.
- /api/creator/submissions by id — PARTIAL/GATED — source exists; owner/admin proof pending.
- /api/admin/creator-submissions — PARTIAL/GATED — source exists; admin provider proof pending.
- /api/admin/creator-submissions by id — PARTIAL/GATED — source exists; admin provider proof pending.
- /api/admin/creator-submissions moderation — PARTIAL/GATED — source exists; provider audit proof pending.
- /api/export/create — NOT STARTED/BLOCKED.
- /api/export/status — NOT STARTED/BLOCKED.
- /api/marketplace/checkout — NOT STARTED/BLOCKED.
- /api/stripe-webhook — NOT STARTED/BLOCKED.
- /api/entitlements/validate — NOT STARTED/BLOCKED.
- /api/analytics/log — NOT STARTED/BLOCKED.
