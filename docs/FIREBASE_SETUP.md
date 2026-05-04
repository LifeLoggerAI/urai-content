# Firebase Setup

## Firebase adapter status (verbatim)
`urai-content` does not initialize Firebase Admin and does not ship a live Firestore adapter. Consuming backend repos must implement `ContentRepository` using injected Firestore/Admin SDK and wire it into `ContentService`.

## Adapter seam
Implement `ContentRepository` in a consuming backend repo and inject Firestore into your implementation.
Reference constants and contract in `src/backend/firebaseRepository.contract.ts`.

## Required collections
See `FIRESTORE_COLLECTIONS` constant for canonical collection names.

## Wiring
```ts
import { ContentService } from 'urai-content';
import { makeFirebaseRepository } from './firebaseRepository';
const service = new ContentService(makeFirebaseRepository(firestore));
```
