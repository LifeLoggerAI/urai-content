# Content data lineage and privacy controls
| Producer/input | Field/collection/output | Authority evidence | Release status |
|---|---|---|---|
| JSON source `content/*` | static demo/branding/catalog/SEO | checked-in Git object and validation only | synthetic/not person-recorded |
| creator POST | `creatorSubmissions`: creatorId, title, body, tags, locale, status | main creator-role/owner checks; #96 live C1 privacy and revocation code | no protected Firebase acceptance |
| moderation API | submission status, reviewer UID and notes; `moderationQueue` | main requireAdmin; two separate writes | authorization provider and transaction unverified |
| publication | content ID, version, rights/provenance reference, asset checksum | main release evaluator; #110/#111 signed authority candidates | no genuine approved issuer, human legal signoff |
| public catalog | public **and published unlisted** records from Firestore mode | `runtimeCatalog.ts`, public filter vs discoverability ambiguity | potential policy concern, deployed status unknown |
| user export | contentItems, contentVersions, creatorSubmissions, marketplaceItems, userContentEntitlements, telemetryEvents | #96 bounded 1000 rows/2MiB/20s/C7 owned API; `coverage.complete:false` | partial, unmerged/no live verification |
| withheld export | moderationQueue, publishingReleases, narratorPrompts, storyTemplates, ritualTemplates, exportTemplates | #96 names six missing subject-disclosure contracts | absent; never infer global ownership |
| deletion | tombstones, retention dates, backup receipt, provider confirmations | `src/privacy/deletionLifecycle.ts` pure data contract | no production purge output |
| analytics | eventName/properties + referrer/userAgent; content telemetry event | public API less restricted than root metadata allowlist | may involve PII, no consent/retention proof |
| leads/waitlist | email, name, org, message, consentToUpdates, source referrer/userAgent | API stores if Admin configured and can respond `stored:false` | potential PII, not evidence of real user data |
| narrator/Storytime | private memory sources, sourceRefs, captions, synthetic scripts | Content registry disabled/synthetic, #96 private consumer | no real signed source and media playback |
| Asset Factory output | media, promotion state, rights, checksums | provider-neutral contracts, missing 0-byte PNG artwork | unverified real asset/promotion |
| Communications/marketing | outbound content, channels, delivery receipt | Content launch mode disabled/synthetic | no consented live send proof |

**Required negative tests:** foreign owner UID, absent C1/C7, forged Privacy decision, stale/disabled token, role change after async call, cross-tenant creator read, unsolicited public-unlisted exposure, overlarge/disallowed MIME, suppression after deletion/cancel, foreign export version link, reviewer-note leakage, paid entitlement forgery, stale signed publisher receipts. A consentRecordId string or passed unit fixture is NOT a valid current grant.
