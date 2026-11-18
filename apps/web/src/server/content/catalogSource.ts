import 'server-only';
import { getCatalogDataSource } from '@/lib/catalog';
import { getRuntimeContentMode } from './service';

export type CatalogSourceMode = 'canonical-json' | 'embedded-snapshot' | 'firestore-ready';

export function getCatalogSourceMode(): CatalogSourceMode {
  return getRuntimeContentMode() === 'firestore' ? 'firestore-ready' : getCatalogDataSource();
}

export function getCatalogSourceDescription(): string {
  const source = getCatalogSourceMode();
  if (source === 'firestore-ready') {
    return 'Firestore-backed catalog read mode is selected. Query results and publication approval require separate verification.';
  }
  if (source === 'embedded-snapshot') {
    return 'Using a source-pinned embedded snapshot of canonical JSON because the repository content directory is unavailable. This is not publication approval.';
  }
  return 'Using canonical JSON from the repository content tree because Firebase Admin is not configured.';
}
