# One UrAi Genesis — Content R115 continuation: forensic byte and history evidence
**Date:** 2026-11-08 UTC. **Review-only successor within Content PR #114. Production HOLD.**

## Source snapshot and work performed
Root main `988ca4f7f38b1ce86e4d3f426361b5866fd23e0d` remains the exact source authority for byte verification. Active Controller #96 `6321c38a939d26557a1c12cce3126ff6fd97dd6c` and stacked publishing #110 `34d41bf3de267e2fed488f82c6dd24ecd21ad663`, issuer #111 `18fe4de11568e632cfc902e2a2cab526fd3554d3`, build guard #112 `295e4ab4d1b2c886a2c0801306d071e280288891`, Genesis starter #113 and review PR #114 remain separate. No merges, rebases, source executable modifications, cloud calls or deployments.

## Complete currently visible branch-head tree metadata
- 99/99 Git `refs/heads/*` names and immutable head SHAs fetched; all 99 recursive trees `truncated:false`. Ten raw metadata slices `history/branch-tree-slice-00.json` through `history/branch-tree-slice-09.json` store every path, file size, blob SHA, mode and branch head tree SHA.
- Across the 99 trees: **26,409 path entries**; **936 distinct blob object SHAs** with deduplicated Git-reported size sum **6,522,154 bytes**; **536 distinct pathnames**; **148 pathnames absent from main**. The latter require historical semantic/drift analysis, not wholesale reinstatement.
- Branch-head union evidence: `history/branch-head-union-reconciliation.json`. 99 head trees are **not** 99 full histories, nor all original/unreachable media.
- `history/main-commits-pages-001-010.json`: 682 commit metadata entries reachable from main, last root commit dated 2026-02-05. Historical 2024–2025 One UrAi work in separate repositories cannot be attributed to this 2026 Git history without separate proof.

## Independently verified exact file bytes
Six `byte-audit/*.json` slices contain GitHub base64-decoded original bytes checks, separately computed SHA-256 digests and size/GitHub Git-blob SHA identity matches. A standard 'abc' SHA-256 digest vector passed. **78/388** main blobs, **475,044/1,514,321 bytes**, **no failures** in these slices: 47/47 `src/`, 19/19 `content/`, 12/115 `apps/`. Remaining 310 blobs still require byte hash checks. Git object SHA was read from GitHub, not independently calculated by this phase; only SHA-256 computed from bytes.

## Orphaned/old media
The only path-new-to-branch SVG candidates among 148 non-main paths occur in `audit-fix-hardening-pass`: OG graphic 992 bytes, celestial sprite SVG 821 bytes, preview SVG 783 bytes, all three source read. They are small historical demo/branding vectors, distinct from current two zero-byte PNGs and are not evidence of accepted licensed, high-fidelity production creative assets. Cloud media/LFS still unverified.

## Historical Drive provenance cross-check
The exact-source July 14, 2026 [Content Rules receipt](https://docs.google.com/document/d/1JKKjjlNj1tCoEtkl8zYfJ6uel1BuQQfwsheGmxh9Li0/edit) documents prior PR #66 at `227df755844fb5c192dd8298f3e130f0e84f29cc`, successful 9/9 emulator matrix, artifact hashes and explicit external provider NO-GO. July 14 [Prompt governance receipt](https://docs.google.com/document/d/1Nd-VmyECIK0_SsClVDsHyc7Fov3X670s_H7GXwNyi2U/edit) documents PR #67 at `1af6da8854b2a9457fe67bd6ee11e5c4855fb199`, governed fixture/prompt parity but no live model, review or tag authority. Document was read; original zipped CI artifacts are **not inspected** in this phase. Do not transfer to current SHA.

## Runtime access and no-conflict posture
A local credential-free clone attempt failed DNS resolution for github.com. Original byte reads used GitHub connector. Native install/test/build, Firebase emulator, GCP Firebase Admin IAM, real user permissions, live private user content, production deployment, external AI/audio/media calls and device/browser QA are not rerun. Existing developer work on #96 and #110–#112 was preserved; source-only noncertifying documentation additions reside on #114.

**Next:** independently finish 310 main raw SHA-256 hashes, audit 148 branch-only paths and 2026 intermediate trees, then source-safe merge planning and exact-head CI/emulator/integrated provider denial tests. **HOLD**.


## FINAL EXACT-MAIN RAW BYTE SHA-256 COVERAGE — SUPERSEDES EARLIER 78-FILE PARTIAL TOTAL (2026-11-08 UTC)

Full main-source coverage is now **388/388 tracked Git blobs**, **1,514,321/1,514,321 bytes** (100%), with **zero mismatches**. Each GitHub original-file base64 response was decoded to bytes and independently SHA-256 hashed; exact byte lengths and returned Git blob SHA-1s matched the immutable Git main tree `988ca4f7f38b1ce86e4d3f426361b5866fd23e0d`. Independently calculating Git blob SHA-1 was not performed; server-reported object identity was cross-checked against the frozen tree. SHA-256 function passed the standard `abc` vector. All 30 per-slice ledgers were recombined and checked against 388 unique manifest paths and exact byte total. Machine-readable permanent result: `docs/estate/byte-audit/MAIN_SHA256_FULL_COVERAGE.json`.

**Two legitimate zero-length tracked images:** `public/sprites/celestial.png` and `public/sprites/previews/celestial-preview.png`; zero-byte hash is the standard SHA-256 empty-file value. They remain placeholders, not usable artwork.

Do not confuse **100% raw byte coverage for ONE merged main snapshot** with 100% historical source recovery or launch readiness. The 936 Git blob objects across 99 visible branch heads were inventoried by Git object metadata only and their original contents are not collectively SHA-256 checked. Intermediate branch commit histories, inaccessible or deleted objects, external LFS/media, provider IAM and Cloud Storage objects, Google Drive entire corpus, CI ZIPs, build/test runtime and private user data remain not exhaustively verified. No native build or physical device integration certification was performed; release **HOLD**.
