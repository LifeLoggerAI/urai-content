# Firebase Setup

This package contains both the canonical URAI content package and a staged Next.js public web app under `apps/web`.

## Package adapter status

The root `urai-content` package does not initialize Firebase Admin directly. It provides backend domain logic, validation, repository contracts, and service-layer wiring for consuming runtime repos.

Consuming backend repos should implement `ContentRepository` using injected Firestore/Admin SDK and wire it into `ContentService`.

Reference constants and contracts in:

- `src/backend/types.ts`
- `src/backend/firebaseRepository.contract.ts`

## Web app Firebase Admin status

The public web app uses optional Firebase Admin Application Default Credentials for public intake and analytics endpoints.

If verified WIF credentials are absent, the public forms return a successful preview-mode response without writing to Firestore. This keeps local previews and static verification non-mutating. Production writes remain **NO-GO** until provider-side short-lived identity, least-privilege IAM, negative unauthorized-identity proof, historical-key revocation, and runtime read-back are independently verified.

Required environment variables for a future non-Google production runtime:

- `FIREBASE_PROJECT_ID`
- `GOOGLE_APPLICATION_CREDENTIALS` pointing to a protected, regular, non-symlinked `external_account` WIF file
- `URAI_CONTENT_FIREBASE_ADMIN_ADC_READY=1`, set only after the identity is independently verified
- `FIREBASE_STORAGE_BUCKET` optional for storage-backed features
- `NEXT_PUBLIC_SITE_URL`

Long-lived `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, service-account JSON, and authorized-user ADC are forbidden. The guarded deployment workflow rejects production before provider credentials or mutation are available; preview verification may run with `URAI_CONTENT_FIREBASE_ADMIN_ADC_READY=0`.

## Public intake collections

The public site writes to these collections when Firebase Admin is configured:

- `waitlist_signups` — early access and waitlist submissions
- `leads` — general intake queue for demo, investor, partner, research, press, and contact leads
- `demo_requests` — specialized copy of demo-access leads
- `investor_inquiries` — specialized copy of investor leads
- `partner_inquiries` — specialized copy of partner leads
- `research_inquiries` — specialized copy of research collaboration leads
- `public_analytics_events` — privacy-conscious page, CTA, FAQ, and conversion events

Public analytics must not store sensitive form message bodies. Form message text belongs only in lead/intake records, not analytics records.

## Public intake fields

Common lead fields:

```ts
{
  email: string;
  name: string | null;
  organization: string | null;
  message: string | null;
  sourcePath: string;
  sourceCTA: string;
  userAgent: string | null;
  createdAt: string;
  status: 'new';
  consentToUpdates: boolean;
}
```

Waitlist-specific fields:

```ts
{
  interestType: 'user' | 'demo' | 'investor' | 'partner' | 'research' | 'press' | 'contact';
}
```

## Adapter seam

Implement `ContentRepository` in a consuming backend repo and inject Firestore into that implementation.

```ts
import { ContentService } from 'urai-content';
import { makeFirebaseRepository } from './firebaseRepository';

const service = new ContentService(makeFirebaseRepository(firestore));
```

## Required collections

See the `FIRESTORE_COLLECTIONS` constant for canonical package collection names.

## Verification

Run these before treating the public site as merge-ready:

```bash
npm install
npm run check
npm run web:check
npm run web:smoke:routes
npm audit
```

Do not run `npm audit fix --force` without reviewing the breaking-change impact.
