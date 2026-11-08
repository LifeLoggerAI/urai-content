# Feature inventory and maturity — source evidence separated from runtime
| Function | Main source state | Stronger unmerged source | Production truth |
|---|---|---|---|
| brand/pages/SEO/demo/content JSON | implemented | #96 broader catalogs/SEO | no current live URL |
| content schemas, index, validation, seed | implemented/test source | #96 schema/persistence repairs | not full end-to-end operation |
| Next public web shell, pages, API catalog | implemented + historical browser check | #96 UI, #112 source parity guard | provider ERROR |
| draft→review→approved→publish role logic | implemented in root service | #110 release evidence; #111 issuer | legal independent authority not accepted |
| creator submission and admin moderation | main API server handlers and Firebase repository | #96 current UID/role/consent, own history | provider Auth/Rules denial unverified |
| revision, lifecycle, search | local and Firestore adapter; some transactional counter code | #96 consistent revision/owner safeguards | no live data/transaction/retry proof |
| export | export templates/state, deterministic file/caption/manifest source | #96 bounded partial JSON owner export | missing full 6 unmapped scopes and live C7 |
| deletion | restore/tombstone/receipt pure functions | #96 persistence/deletion guard | no actual remote deletion or media purge |
| marketplace/entitlements | synthetic/hard-off contracts | #96 tests and entitlement boundaries | no checkout, real payout or seller legal rights |
| narration/Storytime | synthetic session/caption/quiet-hours | #96 current-silence/provenance | no provider TTS, recorded private voice, device playback |
| generation/media/sprites | provider-neutral cost decisions, metadata | independent Asset Factory pipeline | image placeholders zero bytes; real licensed assets missing |
| translation/localization | 20 locale registry, translation checksum/review contract | source evolution | 19 non-English production translations/native QA unproven |
| accessibility | manifest/alt/caption/reduced-motion contracts | per-asset reviews | no complete final asset/device acceptance |
| analytics/leads | public API + allowlist helper, PII intake | #96 lead/consent hardening | no production retention/minimization audit |
| pipeline/build/release | scripts/workflows and historical checks | issuer/source guard #110–112 | recent runners 0-step failure; Vercel ERROR |

Important code nuance: `src/backend/contentService.ts` performs upsert/version/release-log operations separately; `apps/web/src/app/api/admin/creator-submissions/[id]/moderate/route.ts` updates submission then writes moderation separately. Both need interruption/transaction tests. `apps/web/src/server/content/runtimeCatalog.ts` includes *published unlisted* in catalog summaries; clarify intended unlisted/discoverability policy before launch. `src/marketplace/contracts.ts` enforces `synthetic:true, publicSaleEnabled:false, payoutEnabled:false, openUploadEnabled:false`. `src/generation/contracts.ts` only decides bounded dispatch. Do not label code a live provider pipeline.
