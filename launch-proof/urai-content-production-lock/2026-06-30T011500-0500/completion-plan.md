# Completion Plan

Starting SHA: 4366390d7691d0cf5b3e728f2452c729a75b893f
Ending SHA: final branch head after proof commits; see PR/final response.
Branch: production-lock-content-2026-06-30
Evidence scope: source-level plan.

## To reach READY

1. Run CI for this branch and fix any failures.
2. Run root and web command suite locally or in CI and attach logs.
3. Configure Firebase staging project, Auth, Firestore, Storage, rules, indexes, and service identity.
4. Deploy staging and run route smoke.
5. Prove anonymous denial, creator allow, creator cross-owner deny, operator allow, and public content read behavior.
6. Seed canonical content and prove Firestore public catalog reads.
7. Prove publishing lifecycle with version and release records.
8. Implement and prove export lifecycle.
9. Implement and prove media lifecycle.
10. Implement and prove payment/entitlement lifecycle if payments are in scope.
11. Add observability, alert routing, release SHA, and incident owner.
12. Run rollback drill and attach evidence.
13. Deploy production and run smoke/E2E.
14. Update readiness dashboard from RED/YELLOW to GREEN only where evidence exists.

## External actions required

- Firebase console/project access.
- DNS access for custom domains.
- Hosting provider access.
- Stripe account/test mode access if payments are in scope.
- Monitoring/alerting provider access.
- Legal/privacy review.

## Done-done rule

If evidence is missing, the item remains PARTIAL, GATED, BLOCKED, or NOT STARTED.
