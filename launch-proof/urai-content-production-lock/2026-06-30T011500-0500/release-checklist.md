# Release Checklist

Starting SHA: 4366390d7691d0cf5b3e728f2452c729a75b893f
Ending SHA: final branch head after proof commits; see PR/final response.
Branch: production-lock-content-2026-06-30
Evidence scope: source-level release checklist.

## Source checks

- [ ] npm ci
- [ ] npm run lint
- [ ] npm run typecheck
- [ ] npm test
- [ ] npm run build
- [ ] npm run check
- [ ] npm run web:install
- [ ] npm run web:check
- [ ] npm run web:smoke:routes
- [ ] npm run web:e2e

## Provider checks

- [ ] Firebase project selected
- [ ] Auth providers configured
- [ ] Role claims configured
- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] Indexes deployed
- [ ] Staging deploy complete
- [ ] Production deploy complete
- [ ] DNS verified
- [ ] SSL verified

## Flow checks

- [ ] Public catalog/content smoke
- [ ] Creator submission create/list/detail
- [ ] Creator cross-owner deny
- [ ] Operator queue/detail/moderation
- [ ] Publishing lifecycle
- [ ] Export lifecycle
- [ ] Media lifecycle
- [ ] Payment and entitlement lifecycle if in scope
- [ ] Privacy/data control lifecycle if in scope

## Ops checks

- [ ] Uptime monitoring
- [ ] Error reporting
- [ ] Alert routing
- [ ] Release SHA visible
- [ ] Rollback command
- [ ] Rollback smoke
- [ ] Incident owner/contact

## Current release status

Not READY. Source-level mismatches were fixed on the branch, but CI/provider/deployment proof is still missing.
