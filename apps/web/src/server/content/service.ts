import 'server-only';
import type { ContentItem, ContentRepository } from './types';
import { InMemoryContentRepository } from './inMemoryRepository';
import { createFirestoreContentRepository } from '../firebase/contentRepository';
import { getFirebaseAdminDb, isFirebaseAdminConfigured } from '../firebase/admin';

export type RuntimeContentMode = 'firestore' | 'memory';

export type RuntimePersistenceStatus = {
  mode: RuntimeContentMode;
  firebaseAdminConfigured: boolean;
  writable: boolean;
  previewMode: boolean;
  productionSafe: boolean;
  message: string;
};

let memoryRepository: InMemoryContentRepository | null = null;

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production';
}

export class RuntimeContentService {
  constructor(private readonly repo: ContentRepository) {}

  async searchPublishedContent(query: string, visibility: ContentItem['visibility'] = 'public'): Promise<ContentItem[]> {
    const normalizedQuery = query.toLowerCase().trim();
    const items = await this.repo.listContent();

    return items.filter((item) =>
      item.status === 'published' &&
      item.visibility === visibility &&
      [item.title, item.body, item.slug, ...item.tags].join(' ').toLowerCase().includes(normalizedQuery)
    );
  }
}

export function getRuntimeContentMode(): RuntimeContentMode {
  return isFirebaseAdminConfigured() ? 'firestore' : 'memory';
}

export function isRuntimeMemoryFallbackAllowed(): boolean {
  return !isProductionRuntime();
}

export function getRuntimePersistenceStatus(): RuntimePersistenceStatus {
  const firebaseAdminConfigured = isFirebaseAdminConfigured();
  const writable = firebaseAdminConfigured || isRuntimeMemoryFallbackAllowed();

  if (firebaseAdminConfigured) {
    return {
      mode: 'firestore',
      firebaseAdminConfigured: true,
      writable,
      previewMode: false,
      productionSafe: true,
      message: 'Firestore-backed runtime persistence is configured.'
    };
  }

  if (isProductionRuntime()) {
    return {
      mode: 'memory',
      firebaseAdminConfigured: false,
      writable: false,
      previewMode: true,
      productionSafe: false,
      message: 'Firebase Admin is not configured. Production writes are disabled; public catalog reads use canonical JSON fallback only.'
    };
  }

  return {
    mode: 'memory',
    firebaseAdminConfigured: false,
    writable,
    previewMode: true,
    productionSafe: true,
    message: 'Firebase Admin is not configured. Local/test writes use in-memory preview storage and are not durable.'
  };
}

export function isRuntimePersistenceWritable(): boolean {
  return getRuntimePersistenceStatus().writable;
}

export function createRuntimeContentRepository(): ContentRepository {
  if (isFirebaseAdminConfigured()) {
    return createFirestoreContentRepository(getFirebaseAdminDb());
  }

  if (!isRuntimeMemoryFallbackAllowed()) {
    throw new Error('Runtime persistence is not configured. Firebase Admin credentials are required for production writes.');
  }

  memoryRepository ??= new InMemoryContentRepository();
  return memoryRepository;
}

export function createRuntimeContentService(): RuntimeContentService {
  return new RuntimeContentService(createRuntimeContentRepository());
}

export function resetRuntimeMemoryRepositoryForTests(): void {
  memoryRepository = null;
}
