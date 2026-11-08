# Selected original source and asset/byte evidence
| Path at exact main | Git blob SHA-1 | Finding |
|---|---|---|
| `src/schemas/content.ts` | `452918af192299323e3a62a19975648e2678b058` | creator story, review and telemetry fields |
| `src/backend/contentService.ts` | `6f26c1d02395c349c5ffa7b8e30237eadb66f518` | non-atomic content/write/release sequencing |
| `src/publishing/release.ts` | `d5da0638f96cd8d2e2b8caca7d985e3eee9f27e0` | approval field/checksum decision, not issuer signature |
| `src/privacy/deletionLifecycle.ts` | `d64b3fb8c2f2d55bfe085e447e86582976e44e9c` | tombstone/restore/purge receipt logic, no real deletion worker |
| `src/marketplace/contracts.ts` | `26bda626ddd9275f469be43101bc679e2cb21985` | hard-off synthetic sales and payouts |
| `src/generation/contracts.ts` | `ac4db97e94a898461111a3f8b594479b559553be` | budgeted provider authorization *decision* only |
| `src/telemetry/policy.ts` | `82fdb425e675305e24be0b90632f1e66881e305b` | restricted metadata keys and forbidden sensitive names |
| `src/integrations/registry.ts` | `6382923d45a4106d02d5371a2cbb512e386d8b87` | documented disabled/synthetic cross-system limits |
| `apps/web/src/server/firebase/contentRepository.ts` | `3303c19983c7b655c57db18429f4efe1c8c23ef6` | web Firestore collection adapter; revision transaction |
| `apps/web/src/server/auth/session.ts` | `a823c8402825bfac311d6a00e468c2b4b98c48ed` | main header/token path; different from #96 stronger auth |
| `apps/web/src/app/api/leads/route.ts` | `07b544604da3470f42d17dace934935574f0f954` | identifiable lead collection schema |
| `apps/web/src/app/api/analytics/route.ts` | `64499baa46f11d879b1d4164d146a1b948d9c543` | public event properties/user agent/referrer storage |
| `firestore.rules` | `b2a465b7d39c8777f1a2c6c7e42a3f39b19654ff` | root stricter analytics collection |
| `apps/web/firestore.rules` | `3b3319764871720d43f4a361c3ec17f561aa3e7e` | divergent web rules |
| `storage.rules` | `3a0e0825833802df80394d891c91f4085683ee51` | creator media type/size and role limits |
| `apps/web/storage.rules` | `e1f02ab899a79db1c09dc48757a9ace607dfd872` | divergent web storage ownership/size policy |
| `content/sprites/sprite-packs.json` | `fb506be01bc480c2ca9b12708a1339927a3064e9` | explicitly unavailable demo sprite |
| `content/demo/narrator-scripts.json` | `43c2f1c646bc0963ad5ad105cbfc3d160ebc4710` | synthetic fictional narrator example |
| `src/seed/demoData.ts` | `8f1a7a3b03c1c60cea912b615116db81e6b3e2bf` | synthetic story, creator and marketplace pricing |

PR #96 protected source only: `apps/web/src/server/privacy/canonicalConsent.ts` blob `40c13be14fdb59509666875830ed1152b3a67bce`; `apps/web/src/server/auth/session.ts` `553fc2786fa088c507ab0a01959a5ca71f9535b4`; `apps/web/src/server/privacy/contentExport.ts` `a9031acab738a459cf52135199b1e81a13df3213`; `apps/web/src/app/api/privacy/export/route.ts` `58dd039ed8b79c37cdd6870a2a4c832e6b1ad624`.

Complete path/mode/size/Git SHA-1 listing for main and review deltas is in machine-readable manifests. **No separately calculated raw SHA-256 for the full corpus.**
