# Blockers

Starting SHA: 4366390d7691d0cf5b3e728f2452c729a75b893f
Ending SHA: final branch head after proof commits; see PR/final response.
Branch: production-lock-content-2026-06-30
Evidence scope: source-level audit.

## P0 production launch blockers

- CI/local command suite must pass on this branch.
- Firebase project, Auth, Firestore, Storage, rules, indexes, and service credentials must be configured and proven.
- Staging and production deployments must exist.
- DNS and SSL must be verified.
- Deployed route smoke and browser E2E must pass.
- Creator/operator role flows must be proven with provider-backed tokens.
- Production write behavior and public/private boundaries must be proven live.
- Observability and rollback proof must exist.

## P1 important fixes

- Migrate any legacy creator submission records into the runtime canonical schema.
- Migrate any legacy userEntitlements documents into userContentEntitlements.
- Implement export create/status/artifact/download/retry/revoke lifecycle.
- Implement media upload validation and deletion/revocation lifecycle.
- Implement payment checkout, webhook signature validation, and entitlement writes if monetization is in launch scope.

## P2 polish

- Final public copy, SEO, Open Graph, sitemap, robots, and mobile proof.
- Complete protected UI flows.
- Add visual/browser artifacts.

## P3 later enhancements

- Advanced analytics dashboards.
- Creator earnings/licensing surfaces.
- Expanded marketplace operations.
- Cross-repo evidence automation.
