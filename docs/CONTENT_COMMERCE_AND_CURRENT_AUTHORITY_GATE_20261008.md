# Content commerce and current authority gate

The founder delegated the Content commerce choice on 2026-10-08: “what ever is best”.
The adopted decision keeps commerce gated because Content has no admitted payment
product/account binding or reviewed commercial terms. Native scope items 16–18 are
EXPANSION. Item 19 remains required evidence of an intentional refund/revoke gate.
This document records that decision; it grants no charging, payout, paid entitlement,
refund, provider configuration or production release authority.

## Intentional commerce state

The marketplace contract accepts only synthetic listings. `publicSaleEnabled`,
`payoutEnabled` and `openUploadEnabled` remain false. Synthetic entitlement receipts
require an approved listing and explicitly contain `paymentCaptured: false` and
`payoutCreated: false`; they are not persisted paid grants, licenses or payment proof.
Withdrawal and revocation are terminal listing transitions. A withdrawn or revoked
listing cannot issue a new synthetic receipt.

The current web tree has 13 API route modules. None implements checkout, charging,
Stripe webhooks, refunds, payouts or entitlement grants. Pricing and marketplace are
informational; licensing submits a bounded partner inquiry and grants no rights.
The runtime repository can read `userContentEntitlements` but has no entitlement
writer. Canonical seeding writes content revisions, not paid entitlement records.
The in-memory repository's `seedEntitlement` is a local fixture helper, has no
web route caller and is not a provider-backed paid grant.
Tier/price environment names and seed model values do not activate commerce, even
if payment-related environment variables are present.

Refund and commerce entitlement revocation remain intentionally unavailable because
this Content estate captures no payments and creates no paid grants. No fake refund
or successful revocation is returned. Future activation must separately bind the
actual approved TEST account/product/prices, entity and reviewed terms, verify
idempotent signed webhooks and authoritative entitlement writes, and provide real
refund/revoke/withdrawn-access lifecycle evidence. Stripe LIVE remains off.

## Current role and entitlement authority

Firebase Auth is the established authority. Bearer tokens are verified with
`checkRevoked: true`, then each production request awaits `getUser(uid)` and
requires an explicitly enabled, matching current account with a recognized,
non-anonymous current role matching the verified token role. Custom entitlements
are the intersection of current account claims and verified token grants.
Issued token claims alone are never a fallback. Removed/malformed membership,
disabled/mismatched records and failed current-authority lookup deny admission.
No user record is cached across requests. Production rejects caller identity/role
headers regardless of the opt-in flag. Explicit non-production fixtures stay local.
The runtime needs only the existing `firebaseauth.users.get` permission for this
read; this source does not change claims, revoke tokens, provision accounts or make
provider calls during preparation.

After removal from current custom claims, an old admin/creator token cannot read
the admin queue or create a creator submission through the server. Removing a
custom entitlement similarly removes it from the admitted session. Separately,
persisted content grants and licensing records require their own governed record
revocation; an Auth claim change is not a substitute for that lifecycle.

The current app uses `firebase-admin` in server modules and has no Firebase client
SDK private consumer. Therefore both repository and web deployment roots use the
same Firestore/Storage rules, and deny the alternate private client capability
for every role and UID. This includes private owner reads, creator uploads,
consent/export-request and telemetry writes, entitlement/license grants and admin
mutations. A UID is not a live Auth or canonical Privacy decision. Public
content/free/indexable and public Storage reads remain admitted. The existing
server owner/creator/admin APIs remain available under their established guards;
the owner detail handler authenticates before any private repository lookup.
Private owner/creator/admin handlers also recheck the same admitted actor with the
unchanged canonical session verifier after awaited input/reads and before private
output. Moderation rechecks after awaited input and its private read before starting
its mutation. Creator creation already parses input before its fresh admission.
Private response bodies are withheld if current roles/account/token authority is
withdrawn during a repository operation. An already-started provider write cannot
be retroactively cancelled by an Auth reread. The existing audit of a committed
moderation action is retained, and no false rollback/cancellation success is
returned. This bounded application check does not claim atomic authorization for
the complete lifetime of a distributed provider transaction or replace canonical
Privacy admission/worker receipts.
Admin SDK server operations continue to require their separately approved IAM
identity and application authorization; client rules do not grant them.

## Canonical Privacy boundary

Privacy owns account and purpose decisions. Its current source uses
`consentRecords/{uid}_{sanitizedPurpose}` and `privacyDeletionTombstones/{uid}`.
An active account tombstone is installed before physical work. `memory.storage`
uses C1 and `data.export` uses C7 under policy 1.0.0; absent, expired, revoked,
mismatched purpose/tier/version consent fails closed. Only the export purpose
projects its receipt/version/expiry into the tombstone. Content's per-item
`contentDeletionStates` and `contentDeletionTombstones` are a different governed
lifecycle; they do not authorize account access or replicate Privacy decisions.

Canonical deletion admission and ordinary consent withdrawal do not automatically
disable/revoke Auth. Auth deletion happens later. Current `UserRecord` checks
therefore establish current roles, entitlements and Auth disablement/removal, but
cannot prove immediate account-deletion or purpose-withdrawal denial by themselves.
Closing the unused client UID paths prevents those paths from bypassing this
missing canonical boundary; it does not create a server privacy acceptance receipt.

The existing canonical source consumer is authenticated callable
`evaluateCanonicalConsent({ targetUid?, purpose, correlationId })`. The owner may
evaluate self; cross-user evaluation requires the existing authorized admin/system
consumer contract and `consumerId`. Its transaction reads authentic consent and
the account tombstone and emits a decision/access receipt. Content's integration
registry still declares Privacy disabled and no authentic deployed
project/function/consumer identity binding has been verified. Do not infer that
Content's Firestore project holds authoritative Privacy documents, or invent a
local permission registry, tombstone replica, consent fallback or token claim.

The minimal secure handoff is the actual canonical project/region/callable
deployment identity, its admitted Content consumer identity/authentication and
purpose mapping, protected short-lived access, and an independent current-source
consumer review. Then bind the existing consumer before enabling private deployed
operation, and retain real receipts showing active tombstones and withdrawn,
expired, mismatched or missing purpose consent deny access before private reads,
writes, downloads and provider work. Source fixtures and current Auth checks do
not satisfy those lifecycle gates. Production remains NO-GO until this and the
other existing release requirements are met.

## Release evidence still required

Before native rules publication, run the exact source root/web checks and the
Firestore/Storage emulator matrix. It must show old scalar/list admin/creator
tokens and owner UIDs denied for direct private access, consent/export/telemetry
writes, uploads, content mutations and entitlement/license grants, while public
client reads and current authorized server owner operations remain compatible.
Server handler checks must show current admin/creator operations succeeding,
withdrawn roles/claims denied, and failed/awaited current authority failing closed.
Synthetic or fixture receipts are source checks, not real account acceptance.

The existing owner branch, main, production NO-GO, short-lived identity gate,
independent security/prompt/release review, deployed operations/rollback acceptance,
and sole `.github/workflows/deploy-vercel-production.yml` controller remain intact.
No new host/account, billing activation, spend or deployment is performed by this
source preparation.
