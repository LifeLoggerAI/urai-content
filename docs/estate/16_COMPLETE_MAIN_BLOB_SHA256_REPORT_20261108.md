# ONE URAI GENESIS — Content exact-main complete raw-blob SHA-256 verification
**Verified UTC:** 2026-11-08
**Status:** FILE-BYTE INTEGRITY FOR FROZEN MAIN ONLY: PASS. **Production and integrated end-to-end: HOLD**.

## Source and method
Repository `LifeLoggerAI/urai-content`; exact source commit `988ca4f7f38b1ce86e4d3f426361b5866fd23e0d`. Git recursive tree reported `truncated:false` with 388 blob entries, 1,514,321 reported bytes. Every GitHub original file was fetched with base64 encoding, decoded as original bytes, hashed with a separate SHA-256 implementation (self-tested with the standard 'abc' known vector), checked against the tree's exact raw-byte length and GitHub-returned Git blob SHA-1. Git SHA-1 itself was not recomputed from decoded bytes; two independent GitHub responses (tree and contents metadata) were checked for agreement. No matched SHA-256 hash was invented or inferred from Git SHA-1.

## Positive reconciliation
| Raw-byte evidence | Count |
|---|---:|
| Original tracked main file paths | **388** |
| Independently computed raw SHA-256 values | **388** |
| Original main Git-reported bytes | **1,514,321** |
| Independently decoded and size-confirmed original bytes | **1,514,321** |
| Distinct paths in final manifest | **388** |
| Raw-byte size/Git object-ID mismatches | **0** |
| Incomplete source fetch or digest records | **0** |

The file-level `path, raw_sha256, git_blob_sha, bytes` ledger is `docs/estate/byte-audit/MAIN_SHA256_FULL_COVERAGE.json`. It was assembled from 30 independently committed `byte-audit/` JSON slices through three intermediary reconciliations, checked for duplication, omissions and field identity against `docs/estate/MANIFEST.json`. Exactly two PNGs (celestial and preview) are legitimate **zero-byte** source placeholders and carry SHA-256 of the empty byte string.

## Historical branch and original product gaps
A separate archived history union covers **99/99 accessible branch-head Git tree metadata snapshots**, 26,409 path appearances, 936 unique Git blob object SHAs, 536 unique paths, 148 paths absent from main, and deduplicated Git metadata bytes 6,522,154. **These 936 different branch-head object bodies were not collectively read/hashed**. The main-reachable history supplies 682 commits (first 2026-02-05); full historical ref-by-ref commit DAGs, inaccessible/deleted Git/LFS objects, prior 2024–2025 entity accounts and all Drive/archive historical media are still separate unproven coverage areas.

## Runtime and operational limits
Local git clone was blocked by GitHub DNS resolution failure; this run did **not** execute frozen source npm/TypeScript/Vitest/Playwright/Java emulator tests. Historical PR #66 emulator and #67 prompt source pass receipts are historical source evidence, not current CI or production. Firebase effective Firestore/Storage Rules, current owner consent and revocation, real submission/moderation atomicity, licensed media, Storytime/Studio/Asset Factory protected data paths, deployed Content source parity, Vercel READY, alerting/rollback and legal signoffs remain incomplete/unverified.

**Release outcome:** main blob integrity verified; all private user and cross-provider data flows remain **NO-GO / HOLD** pending authorized independent test evidence. No code, provider, user data, IAM or deployment was modified by this audit.
