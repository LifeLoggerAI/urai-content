import 'server-only';
import { ContentService } from '../../../../../src/backend/contentService';
import type { ContentRepository } from '../../../../../src/backend/types';
import { InMemoryContentRepository } from '../../../../../src/backend/inMemoryRepository';
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

export function createRuntimeContentService(): ContentService {
  return new ContentService(createRuntimeContentRepository());
}
