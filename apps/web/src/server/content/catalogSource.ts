import 'server-only';
import { getRuntimeContentMode } from './service';

export type CatalogSourceMode = 'canonical-json' | 'firestore-ready';

export function getCatalogSourceMode(): CatalogSourceMode {
  return getRuntimeContentMode() === 'firestore' ? 'firestore-ready' : 'canonical-json';
}

export function getCatalogSourceDescription(): string {
  return getCatalogSourceMode() === 'firestore-ready'
    ? 'Firebase Admin is configured. Firestore-backed catalog reads can be enabled once content seeding and repository query mapping are implemented.'
    : 'Using canonical JSON from the repository content tree because Firebase Admin is not configured.';
}
