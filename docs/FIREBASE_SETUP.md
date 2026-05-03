# Firebase Setup

This package does not initialize Firebase Admin directly. It provides backend domain logic, validation, repository contracts, and service-layer wiring for consuming runtime repos.

## Adapter seam

Implement `ContentRepository` in a consuming backend repo and inject Firestore into that implementation.

Reference constants and contracts in:

- `src/backend/types.ts`
- `src/backend/firebaseRepository.contract.ts`

## Required collections

See the `FIRESTORE_COLLECTIONS` constant for canonical collection names.

## Runtime wiring

```ts
import { ContentService } from 'urai-content';
import { makeFirebaseRepository } from './firebaseRepository';

const service = new ContentService(makeFirebaseRepository(firestore));