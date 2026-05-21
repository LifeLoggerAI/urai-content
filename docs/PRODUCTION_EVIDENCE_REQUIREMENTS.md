# Production Evidence Requirements

No evidence means no GREEN.

This document defines the minimum production proof required before `urai-content` can be declared production-ready.

---

# Required provider evidence

## Firebase production verification

Required evidence:

- Firebase project ID
- Hosting target
- Screenshot or CLI output of active deploy target
- Environment separation proof
- Staging vs production confirmation
- Emulator vs production separation proof

Required commands:

```bash
firebase projects:list
firebase target
firebase use
```

Status without evidence: RED

---

# Firestore rules verification

Required evidence:

- firestore.rules file
- emulator test output
- deny-by-default proof
- unauthorized read rejection proof
- unauthorized write rejection proof
- tenant/user isolation proof

Required commands:

```bash
firebase emulators:exec
npm run test:firestore-rules
```

Status without evidence: RED

---

# Storage rules verification

Required evidence:

- storage.rules file
- emulator test output
- unauthorized access rejection proof
- export ownership proof
- private asset protection proof

Required commands:

```bash
firebase emulators:exec
npm run test:storage-rules
```

Status without evidence: RED

---

# Auth and RBAC verification

Required evidence:

- authenticated route proof
- unauthenticated rejection proof
- admin-only route rejection proof
- role isolation proof
- fail-closed behavior proof

Required checks:

- protected route smoke tests
- RBAC integration tests
- browser verification

Status without evidence: RED

---

# Stripe live verification

Required evidence:

- webhook signature verification proof
- Stripe environment separation proof
- successful checkout proof
- failed checkout handling proof
- entitlement persistence proof
- duplicate webhook protection proof

Status without evidence: RED

---

# Browser E2E verification

Required evidence:

- onboarding flow
- auth flow
- protected route flow
- content route flow
- mobile layout flow
- error state flow
- loading state flow
- rollback verification flow

Recommended tooling:

- Playwright
- Cypress

Status without evidence: RED

---

# Observability and alerts

Required evidence:

- error monitoring provider configured
- deployment failure visibility
- production alert owner
- crash visibility
- smoke failure visibility
- uptime monitoring

Status without evidence: RED

---

# Production smoke verification

Required evidence:

- deployed URL
- successful route smoke output
- API smoke output
- protected route smoke output
- production asset verification

Required checks:

```bash
npm run web:smoke:routes -- --base-url=<production-url>
```

Status without evidence: RED

---

# Rollback rehearsal evidence

Required evidence:

- rollback SHA
- rollback procedure
- rollback owner
- rollback rehearsal proof
- estimated rollback recovery time

Status without evidence: RED

---

# DNS and SSL verification

Required evidence:

- production domain
- DNS ownership proof
- SSL active proof
- HTTPS redirect proof
- certificate expiration monitoring

Status without evidence: RED

---

# Final production gate

`urai-content` is NOT production-ready unless all RED critical deployment/runtime/security systems have attached evidence.

Do not claim production readiness from:

- local success only
- CI success only
- screenshots without runtime proof
- unverified staging environments
- assumptions about Firebase configuration
- assumptions about Stripe configuration
- assumptions about auth/RBAC
- assumptions about DNS/SSL
