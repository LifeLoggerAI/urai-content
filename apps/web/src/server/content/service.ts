import 'server-only';
import { ContentService } from '../../../../../src/backend/contentService';
import { InMemoryContentRepository } from '../../../../../src/backend/inMemoryRepository';
import { createFirestoreContentRepository } from '../firebase/contentRepository';
import { getFirebaseAdminDb, isFirebaseAdminConfigured } from '../firebase/admin';

export type RuntimeContentMode = 'firestore' | 'memory';

export function getRuntimeContentMode(): RuntimeContentMode {
  return isFirebaseAdminConfigured() ? 'firestore' : 'memory';
}

export function createRuntimeContentService(): ContentService {
  if (isFirebaseAdminConfigured()) {
    return new ContentService(createFirestoreContentRepository(getFirebaseAdminDb()));
  }

  return new ContentService(new InMemoryContentRepository());
}
