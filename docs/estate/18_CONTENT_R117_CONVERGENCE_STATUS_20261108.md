# ONE URAI GENESIS — Content R117 convergence continuation (2026-11-08)

**This is a delta handoff, NOT a repeat of the full inventory.**

Full established baseline remains [Content audit PR #114](https://github.com/LifeLoggerAI/urai-content/pull/114) and [17_CONTENT_NEXT_WORKER_MASTER_HANDOFF_20261108.md](17_CONTENT_NEXT_WORKER_MASTER_HANDOFF_20261108.md). The original 388/388 frozen main hashes and 99 branch-head tree manifests are complete for their precise source scopes; do not repeat.

## New isolated engineering continuation
- [Draft Content PR #115](https://github.com/LifeLoggerAI/urai-content/pull/115) — branch `reconcile/content-pr96-publisher-issuer-20261108`, stacked on exact #96 parent `6321c38a939d26557a1c12cce3126ff6fd97dd6c`, publishing donor #112 `295e4ab4d1b2c886a2c0801306d071e280288891`.
- Latest independently observed PR #115 head at handoff: `cf587a2e27b1b1d1f2eb93ceefcb3467e7c115b1`. Re-fetch current head before any new changes.
- The branch copied 19 donor-only files and explicitly resolved five overlapping paths: `.github/workflows/deploy-vercel-production.yml`, `apps/web/next.config.mjs`, `apps/web/src/app/api/version/route.ts`, `apps/web/package.json`, `package.json`.
- Controller canonical Privacy tests, Firebase client, root/web Firestore and Storage Rules source parity and root deploy HOLD retained. Publisher v2 authority, cryptographic issuer, source identity and Vercel preflight checks retained. New source-regression test files and evidence ledger committed. Neither original PR #96 nor #110–#112 modified/merged.

## Source-native execution evidence
- **73/73 PASS**, zero failed/skipped, Node 22.16.0, single combined test harness run over original Git-blob-verified source with synthetic fixtures and ephemeral Ed25519 keys. Combined TAP log SHA-256: `3a92df547165b64dde2b55b7b1a6ef06cf09b9666c59f548e66eaed17de57af2`.
- Breakdown: 11 immutable build/Next version checks; 12 Vercel project/root/payload; 13 dual-origin source parity/denials; 20 publication rights/asset/approval receipts; 17 canonical signed Ed25519 release/consent field/authority/revocation negative cases.
- Seven original modules independently `git hash-object` checked against their GitHub blob SHA; complete source hashes and methods in [Content PR #115 evidence ledger](https://github.com/LifeLoggerAI/urai-content/blob/reconcile/content-pr96-publisher-issuer-20261108/docs/estate/CONTENT_CONVERGENCE_R116_20261108.md).
- Node isolates and synthetically mocked authorization do **not** equal full native repository CI, a real current Firebase/Privacy signed account, authenticated content delivery, Vercel READY, or production issuance. A local repository checkout failed network DNS; native exact PR `npm ci`, TypeScript/Vitest/Playwright and Java21 Rules emulator still missing. Initial PR #115 commit query returned no associated workflow runs; no passing CI claim.

## Remaining P0 acceptance and worker boundaries
1. Independent review of all five resolved files and both original candidate intents; preserve #96 and #110–#112 as separate workers until accepted. Tests need to run at current PR #115 full source SHA, not the historical frozen modules alone.
2. Run full exact-head Node/NPM/web/Next suite, new native tests, Rules emulator, owner/nonowner Auth, signed C1/C7 current privacy decisions, revoked in-flight write and atomic moderator audit failure/retry/concurrency.
3. Verify real issuer's Google service identity and effective staging IAM/project/bucket/Rules; code signed receipts are not deployment authority.
4. Verify Consent → creator content → Studio/Jobs/Asset Factory/Storytime → Spatial protected Replay → revocation/deletion and downstream purge acknowledgement.
5. Verify current protected Vercel preview, exact deployed source SHA on both Vercel artifact and target domain, rollback, observability, independent reviewer and owner release GO.

**NO-GO / HOLD.** This is a source and native isolated test advance, not end-to-end private Content pipeline certification.
