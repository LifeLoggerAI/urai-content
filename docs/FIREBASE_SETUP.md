# Firebase Setup

This package contains both the canonical URAI content package and a staged Next.js public web app under `apps/web`.

## Package adapter status

The root `urai-content` package does not initialize Firebase Admin directly. It provides backend domain logic, validation, repository contracts, and service-layer wiring for consuming runtime repos.

Consuming backend repos should implement `ContentRepository` using injected Firestore/Admin SDK and wire it into `ContentService`.

Reference constants and contracts in:

- `src/backend/types.ts`
- `src/backend/firebaseRepository.contract.ts`

## Web app Firebase Admin status

The public web app uses optional Firebase Admin credentials for public intake and analytics endpoints.

If these credentials are absent, the public forms return a successful preview-mode response without writing to Firestore. This keeps local previews and static verification from failing while making production writes available when credentials are configured.

Required environment variables for production Firestore writes:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_STORAGE_BUCKET` optional for storage-backed features
- `NEXT_PUBLIC_SITE_URL`

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
