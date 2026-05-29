# Failsafe Diagnostics

Content runtime should remain deploy-prepared but non-live when production secrets/evidence are missing.

## Checklist

- Validate `.env.example` completeness.
- Keep deploy gate blocked when provider evidence is missing.
- Keep demo-safe content packs available.
- Keep Firebase Admin server-only.
- Keep public APIs published/public by default.
- Keep Stripe, marketplace, and export claims marked blocked until runtime evidence exists.

## Suggested command order

```bash
npm ci
npm run check
npm run web:install
npm run web:check
npm run web:smoke:routes
npm run check:ecosystem
```

## Current failsafe position

If Firebase, Stripe, DNS, monitoring, rollback, or hosting credentials are missing, URAI Content remains `YELLOW` or `RED`; it is not production green.
