# Complete accessible snapshot inventory — Content
**Source:** 988ca4f7f38b1ce86e4d3f426361b5866fd23e0d (GitHub main). Recursive Git Trees `truncated:false`; 388 files, 117 tree directories, 1,514,321 Git-reported blob bytes, 0 submodule entries. Every path/size/mode/Git blob SHA-1 is preserved in [MANIFEST.json](MANIFEST.json). This is **complete tree-metadata coverage for one exact revision**, not a whole-historical-blob-byte audit. Selected original source files were read; not all 388 bytesets independently downloaded or SHA-256 hashed.

## Main tracked areas
| Area | Blobs | Git bytes | Meaning |
|---|---:|---:|---|
| `apps/` | 115 | 578,232 | Next application, Firebase adapters, APIs, auth, tests |
| `docs/` | 69 | 262,459 | architecture, legal/production blockers and historical reports |
| `src/` | 47 | 136,624 | content schemas, backend, lifecycle, rights, localization, integration |
| `tests/` | 39 | 79,376 | root validation/rules/contract tests |
| `prompts/` | 26 | 99,179 | governed prompt and evaluation fixture inputs |
| `.github/` | 20 | 66,349 | workflows, CODEOWNERS and issue/PR templates |
| `launch-proof/` | 20 | 46,775 | historic source/readiness evidence text |
| `content/` | 19 | 5,989 | brand, demo, legal, page, SEO and sprite JSON |
| `scripts/` | 15 | 68,994 | static validation, smoke and release guard utilities |
| `public/` | 2 | **0** | zero-length placeholder PNGs |
| Other root files | 16 | 170,278 | readmes, configs, dependency lockfile, rules and audit text |

The root-group table is an explanatory regrouping and should be reconciled to the machine manifest rather than used as a new source-of-truth counter.

## Unmerged alternative trees (exact Git metadata)
| Branch | Commit | Blob files | Reported bytes | Added paths vs main | Changed paths vs main |
|---|---|---:|---:|---:|---:|
| #96 convergence | `6321c38a939d26557a1c12cce3126ff6fd97dd6c` | 487 | 2,412,736 | 99 | 69 |
| #110 publishing | `34d41bf3de267e2fed488f82c6dd24ecd21ad663` | 390 | 1,530,369 | 2 | 3 |
| #111 issuer | `18fe4de11568e632cfc902e2a2cab526fd3554d3` | 394 | 1,555,024 | 6 | 3 |
| #112 Vercel proof | `295e4ab4d1b2c886a2c0801306d071e280288891` | 404 | 1,589,279 | 16 | 8 |
| #113 Genesis bootstrap | `3edd6239328fc2c09130c7660cc825d04bcb582c` | 389 | 1,516,636 | 1 | 0 |

All paths/Git blob IDs for changed and newly added review files are in [MANIFEST_REVIEW_HEADS.json](MANIFEST_REVIEW_HEADS.json). There is **no single merged or test-certified combined head**. Review tree entries overlap and are not unique-byte totals.

## Asset-source truth
`content/sprites/sprite-packs.json` (blob `fb506be01bc480c2ca9b12708a1339927a3064e9`) says `assetAvailability: unavailable`, and `sprites-previews.json` (blob `a0644a49c6b6b07d4182660812f306571a033c85`) confirms it. The PNG paths `public/sprites/celestial.png` and `public/sprites/previews/celestial-preview.png` are zero bytes; these do not represent real production artwork. `content/demo/*` and `src/seed/demoData.ts` are demonstrative/synthetic, not users or payment receipts. The repo tree contains no demonstrated production-real filmed media, completed private memories or playable voice recordings.

**Exclusions:** full all-ref commit history, deleted/unreachable objects, LFS objects, Google Drive corpus, external binary/media storage/CDN, CI artifact ZIPs, actual Firebase data, backend IAM, runtime deployment source and real device or private-user assets. A first branch-name listing had 99 entries; historical branch trees were not all inspected. No evidence that every original source byte since 2024 is accounted for.
