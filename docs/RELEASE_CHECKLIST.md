# URAI Content Release Checklist

Use this checklist before tagging, publishing, deploying a consuming app, or claiming release readiness.

## Package verification

- [ ] npm ci completes
- [ ] npm run lint passes
- [ ] npm run typecheck passes
- [ ] npm run validate:content passes
- [ ] npm run validate:sprites passes
- [ ] npm run content:index completes
- [ ] git diff --exit-code shows no uncommitted generated changes
- [ ] npm run smoke passes
- [ ] npm test passes
- [ ] npm run build passes
- [ ] npm run seed:check passes
- [ ] npm run done passes

## Content model verification

- [ ] public exports from src/index.ts are correct
- [ ] schemas are version-compatible
- [ ] seed data validates
- [ ] roadmap phases remain V1-V5 complete
- [ ] tier configs include all required tiers
- [ ] expansion modules include all required URAI modules
- [ ] system integrations include all URAI ecosystem adapters
- [ ] production-domain records include provenance, consent, content packs, licenses, exports, assets, and SEO pages

## Safety and privacy verification

- [ ] no secrets committed
- [ ] no raw private user data committed
- [ ] consent records are modeled for user-impacting workflows
- [ ] provenance records exist for generated/exported/licensed records
- [ ] sensitive and licensing-sensitive modules are classified correctly
- [ ] admin-only records are not represented as public records

## Firebase template verification

- [ ] firebase.json exists
- [ ] firestore.rules exists
- [ ] firestore.indexes.json exists
- [ ] storage.rules exists
- [ ] .env.example lists required runtime variables
- [ ] deployment blockers are documented before any live claims

## Standalone web readiness

- [ ] consuming web app exists or monorepo conversion is complete
- [ ] NEXT_PUBLIC_SITE_URL is https://www.uraicontent.com
- [ ] public routes exist
- [ ] dashboard routes exist
- [ ] creator routes exist
- [ ] admin routes exist
- [ ] Playwright or Cypress E2E tests pass
- [ ] deployed smoke test passes against live URL
- [ ] DNS redirects are configured

## Release notes

Before release, write a concise summary of:

- schemas changed
- seed data changed
- exported APIs changed
- migration required by consuming apps
- blockers that remain external

## Anti-fake rule

Do not mark this release as deployed or live unless a real deployment URL and successful command output are attached to the release record.
