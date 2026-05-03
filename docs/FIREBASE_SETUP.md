# Firebase Setup

This package does not initialize Firebase Admin directly.

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
