import 'server-only';
import type { ContentRepository } from './types';
import { InMemoryContentRepository } from './inMemoryRepository';
import { createFirestoreContentRepository } from '../firebase/contentRepository';
import { getFirebaseAdminDb, isFirebaseAdminConfigured } from '../firebase/admin';

export type RuntimeContentMode = 'firestore' | 'memory';

export function getRuntimeContentMode(): RuntimeContentMode {
  return isFirebaseAdminConfigured() ? 'firestore' : 'memory';
}

export function createRuntimeContentRepository(): ContentRepository {
  if (isFirebaseAdminConfigured()) {
    return createFirestoreContentRepository(getFirebaseAdminDb());
  }

  return new InMemoryContentRepository();
}
