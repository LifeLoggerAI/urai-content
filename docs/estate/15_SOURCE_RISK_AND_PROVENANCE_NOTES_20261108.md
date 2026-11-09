# Content source risk and provenance notes — 2026-11-08
**Evidence classification:** partial source review and historical test documents only. No live production exploit is claimed.

## 1. In-flight owner write/revocation — P0 proof gap
PR #96 `apps/web/src/app/api/creator/submissions/route.ts` commits `upsertCreatorSubmission(submission)` before a second `recheckRequestSession`/role gate; lines 106–109 at commit `6321c38a939d26557a1c12cce3126ff6fd97dd6c`. `apps/web/tests/private-await-authority.test.ts` explicitly tests a write already started during Auth withdrawal and requires the response to be denied; it **does not** assert the write rolled back. Thus the design establishes response non-disclosure but not guaranteed prevention of already-started persistence after a role/consent state change. A transaction-bound authorization generation or safe compensating-delete approach needs separate review; blind deletion after rejection risks destroying legitimate concurrent user edits. Do not silently patch production.

## 2. Moderator status and audit atomicity — P0 consistency gap
PR #96 `apps/web/src/app/api/admin/creator-submissions/[id]/moderate/route.ts` lines 79–80 perform `upsertCreatorSubmission(moderatedSubmission)` then `logModeration(...)` in separate awaits. A crash or failed second write may preserve a status change without its audit receipt. Source includes current-role rechecks before read and mutation and after response; those are real protections but not a durable Firestore atomic receipt test. Require role-withdrawal, failed audit, retry/idempotency and concurrent moderation tests.

## 3. Published-unlisted catalog — P0 public discoverability policy
PR #96 `apps/web/src/server/content/service.ts` `listPublishedCatalogPage` filters for published records with either `public` or `unlisted` visibility and `getPublishedContentBySlug` also allows both. `apps/web/src/server/content/runtimeCatalog.ts` maps `unlisted` to `demo` in public catalog representation. If 'unlisted' means direct-link-only, enumeration violates intent; verify the product-approved visibility semantics and run negative public catalog/search/SEO tests. Not evidence of a deployed leak.

## 4. Conflicting Rules deployment roots — P0 authority
Root `firestore.rules` and `storage.rules` differ materially from `apps/web/` alternatives, especially creator size/MIME restrictions and telemetry. A file's presence is not proof of installed rules. Require actual Firebase project, effective ruleset checksum, IAM/readback and deny tests against selected source on a protected staging environment.

## 5. User PII and retention — P0 privacy
Public `/api/leads` and `/api/analytics` are potential email, message, referrer and user-agent collection paths. PR #96 improves source intake and consent, but neither current external provider persistence nor approved region, retention/erasure or actual consent issuance has been established. Never copy actual contact details, tokens or private memory bodies into a public evidence pack.

## 6. Sample and historical assets — P1 rights/provenance
`src/seed/demoData.ts` includes fictional story/marketplace receipts; `content/sprites/sprite-packs.json` labels unavailable artwork; root PNGs are zero bytes. Three old branch-only SVGs under `audit-fix-hardening-pass` are source read and small illustrative assets (992, 821 and 783 bytes), not accepted generated/licensed product visuals. Require Asset Factory promotion identity, rights/license, checksum, captions/alt, deletion and private/media storage readback.

## Unchanged release posture
No verified Content host, Firebase identity/Rules project, owner consent, private Replay/Storytime/Studio integrated proof, or signed publication issuer exists in this audit. The PR #110→#111→#112 authority stack is unmerged; Vercel remains `live:false` with ERROR deploys. No permissions or deployments were modified; explicit owner/independent reviewer GO remains required.
