import 'server-only';
import type { ContentItem, ContentRepository } from './types';
import { InMemoryContentRepository } from './inMemoryRepository';
import { createFirestoreContentRepository } from '../firebase/contentRepository';
import { getFirebaseAdminDb, isFirebaseAdminConfigured } from '../firebase/admin';

export type RuntimeContentMode = 'firestore' | 'memory';

let memoryRepository: InMemoryContentRepository | null = null;

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

export function createRuntimeContentRepository(): ContentRepository {
  if (isFirebaseAdminConfigured()) {
    return createFirestoreContentRepository(getFirebaseAdminDb());
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
