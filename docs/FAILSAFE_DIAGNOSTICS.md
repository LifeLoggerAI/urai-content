# Failsafe Diagnostics

Content runtime should remain deploy-prepared but non-live when production secrets/evidence are missing.

## Checklist
- Validate `.env.example` completeness.
- Keep deploy gate blocked when provider evidence is missing.
- Keep demo-safe content packs available.

## Suggested command order
- `npm ci`
- `npm run check`
- `npm run web:check`
- `npm run web:smoke:routes`
