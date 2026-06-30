# Feature Matrix

Starting SHA: 4366390d7691d0cf5b3e728f2452c729a75b893f
Ending SHA: final branch head after proof commits; see PR/final response.
Branch: production-lock-content-2026-06-30
Evidence scope: source-level inspection and source fixes.

| Feature | Status | Evidence / blocker |
| --- | --- | --- |
| content creation | PARTIAL | Root service create/update exists; deployed admin/editor UX not proven. |
| persistence | PARTIAL/BLOCKED | Firestore adapter exists; provider proof missing; production write fallback fails closed. |
| public rendering | PARTIAL | Canonical JSON read path exists; live route smoke missing. |
| publishing lifecycle | PARTIAL | Service transitions/releases exist; provider/admin browser proof missing. |
| version/release logs | PARTIAL | Root service adds versions and release logs; deployed audit proof missing. |
| creator submissions | PARTIAL/GATED | API foundation exists; schema aligned; provider persistence/browser proof missing. |
| admin moderation | PARTIAL/GATED | Admin API foundation exists; provider/admin claims/browser proof missing. |
| editor | BLOCKED/NOT STARTED | No production editor proof found. |
| share links | BLOCKED/NOT STARTED | No public share lifecycle proof found. |
| export templates | PARTIAL | Template schema exists. |
| export jobs/artifacts/downloads | BLOCKED/NOT STARTED | Worker/storage/create/status/download/revocation proof missing. |
| media upload/storage | BLOCKED/NOT STARTED | Storage rules exist; upload API/validation/lifecycle proof missing. |
| marketplace | PARTIAL/GATED | Marketplace schema exists; checkout and provider proof missing. |
| payments | BLOCKED/NOT STARTED | Stripe checkout/webhook proof missing. |
| entitlements | PARTIAL/GATED | Entitlement schema and rules alignment fixed; payment/provider writes not proven. |
| telemetry | PARTIAL | Telemetry schema/repository method exists; privacy-safe deployed pipeline missing. |
| moderation/safety | PARTIAL | Moderation schemas and admin route exist; deployed audit proof missing. |
| deletion/export/data controls | BLOCKED/NOT VERIFIED | No complete user data control lifecycle verified. |
| observability | BLOCKED | Monitoring/alerts/release SHA/incident proof missing. |
| rollback | BLOCKED | Rollback command and smoke evidence missing. |

## Truth gates

- Payment, export, media, admin UI, creator UI, and provider-backed persistence must remain gated or blocked until evidence exists.
- Demo and canonical JSON fallback must not be represented as durable production content persistence.
- No fake paid entitlements, creator earnings, export artifacts, media uploads, dashboards, or telemetry can be shown as real.
