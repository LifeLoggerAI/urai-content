# Next Content worker handoff
**Date:** 2026-11-07 CT. **Status:** HOLD, documentation-only. **Baseline:** main `988ca4f7f38b1ce86e4d3f426361b5866fd23e0d`; Content controller #96 `6321c38a939d26557a1c12cce3126ff6fd97dd6c`; issuer #111 `18fe4de11568e632cfc902e2a2cab526fd3554d3`; Vercel guard #112 `295e4ab4d1b2c886a2c0801306d071e280288891`; this pack on a new isolated branch stacked on #113.

1. Read [MANIFEST.json](MANIFEST.json) and [MANIFEST_REVIEW_HEADS.json](MANIFEST_REVIEW_HEADS.json). They enumerate 388 main tracked file paths, plus review-head added/changed paths and exact object SHA/size; no need to redo same Git metadata before its source changes.
2. Re-fetch latest active PR heads, including any other workers' new commits. Compare changes against immutable baseline; do not force-push.
3. Close raw coverage: independent file-byte hashing, full historical refs/commit graph/LFS/archive and linked Drive assets; explicitly record missing bytes/unknown object ownership.
4. Most urgent source merge: reconciliation plan for #96 consent/owner/current token and #110/#111 issuer, with one canonical versioned persistence schema. Ensure root/web Rules overlap and component scopes are addressed.
5. Run all original root/web native checks on the frozen converged SHA: npm ci, npm run check, npm run web:install, npm run web:check, route smoke, browser/Rules emulator, Java21 where needed. Latest hosted jobs executed zero steps; recover runners and capture exact logs.
6. Protected Firebase current-account identity, C1/C7 consent, owner/private cross-user denials, revocation/deletion races, provider storage and current-role checks must be tested with real independently approved staging identities.
7. Fix doubled Vercel route-manifest root only in a protected preview with approved project/source; verify compiled SHA equals public endpoint and artifact and no stale READY target misattributed.
8. Complete rights/provenance/asset/license, story/narrator/share/communications flows and dedicated Privacy/Jobs/Storytime/Studio consumer acceptance. No private media promotion or paid compute without owner authority.
9. Publish exact test ledger, PR diff, verification identity and old-vs-new decisions to central master steward; review before merge.

**Stop conditions:** no provider authorization, missing current consent, ambiguous IAM/Rules owner, unbounded spend, unexplained signed approval or current source mismatch. Never expose raw personal records or credentials in docs.
