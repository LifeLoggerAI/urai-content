# Deployment Proof

Starting SHA: 4366390d7691d0cf5b3e728f2452c729a75b893f
Ending SHA: final branch head after proof commits; see PR/final response.
Branch: production-lock-content-2026-06-30
Evidence scope: source-level only.

## Deployment status

Status: BLOCKED / NOT VERIFIED.

## Required evidence not available in this pass

- Firebase project selection.
- Firebase Hosting or alternative host target.
- Staging URL.
- Production URL.
- Custom domain records for uraicontent.com and www.uraicontent.com.
- SSL certificate proof.
- Firebase Admin environment proof with secrets redacted.
- Firestore rules deployment proof.
- Storage rules deployment proof.
- Auth provider and role-claim proof.
- API/functions deployment proof.
- Live route smoke.
- Protected route denial proof.
- Release SHA visible in deployed runtime.

## External owner actions

1. Choose hosting provider.
2. Configure staging and production environments.
3. Configure DNS and SSL.
4. Configure Firebase project, Auth, Firestore, Storage, rules, indexes, and service account.
5. Deploy staging.
6. Run smoke and E2E.
7. Deploy production.
8. Attach proof logs and rollback evidence.

## Production rule

No live deployment claim is allowed until deployment evidence is attached.
