# URAI Content Blockers

Date: 2026-06-29
Branch: `production-lock/urai-content-done-done`

## Launch-Blocking Items

1. **Live hosting/DNS/SSL not verified**
   - No deployed URL was verified in this pass.
   - Do not claim live production until route smoke passes against the deployed host.

2. **Firebase production proof missing**
   - Firebase Admin credentials were not available in this environment.
   - Firestore/Storage rules were normalized but not deployed or emulator-tested here.
   - Server auth and rules now align on `role` / `roles`, but this requires emulator and staging proof.

3. **Production persistence must be configured**
   - This branch intentionally fails closed for production writes when Firebase Admin is absent.
   - `/api/health` reports degraded if production persistence is not safe.
   - Creator/admin write APIs return `503 persistence_not_configured` instead of silently using memory.

4. **Stripe and paid marketplace not live**
   - No Stripe keys or webhook proof were available.
   - Marketplace/pricing must stay preview/waitlist only until checkout, webhook, entitlement write/read, and replay-safe tests pass.

5. **Export/media pipeline not live**
   - Export seed records were downgraded where storage/download/checksum proof was missing.
   - Required before launch: create/status/download APIs, storage object write/read, checksum validation, owner/admin authorization.

6. **Protected creator/admin/dashboard UI not proven**
   - APIs exist and are safer after this branch.
   - Protected UI routes must not be marketed as live until implemented and browser-tested.

7. **Monitoring/rollback missing**
   - No alert dashboard, uptime monitor, Sentry proof, or rollback smoke evidence is attached.

## Non-Blocking But Required Before Full Launch

- Final legal review for privacy/terms/licensing language.
- Mobile/desktop visual browser pass.
- Broken-link sweep against deployed URL.
- Evidence screenshots for critical routes.
- CI status proof for this PR.

## Immediate Next Operator Commands

```bash
npm ci
npm run check
npm run done
npm run web:install
npm run web:check
npm run web:smoke:routes
npm test
```

After provider access is configured:

```bash
firebase emulators:exec --only firestore,storage "npm run web:check"
firebase deploy --only firestore:rules,firestore:indexes,storage
firebase deploy --only hosting:www-uraicontent
WEB_SMOKE_BASE_URL=https://www.uraicontent.com npm run web:smoke:routes
```
