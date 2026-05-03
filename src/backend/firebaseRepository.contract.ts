import type { ContentRepository } from './types.js';

export const FIRESTORE_COLLECTIONS = {
  contentItems: 'contentItems',
  contentVersions: 'contentVersions',
  moderationQueue: 'moderationQueue',
  publishingReleases: 'publishingReleases',
  telemetryEvents: 'telemetryEvents',
  userContentEntitlements: 'userContentEntitlements',
  narratorPrompts: 'narratorPrompts',
  storyTemplates: 'storyTemplates',
  ritualTemplates: 'ritualTemplates',
  marketplaceItems: 'marketplaceItems',
  creatorSubmissions: 'creatorSubmissions',
  exportTemplates: 'exportTemplates'
} as const;

export type FirestoreLike = {
  collection: (path: string) => unknown;
};

export type FirebaseRepositoryFactory = (firestore: FirestoreLike) => ContentRepository;

/**
 * Contract-only export.
 * Consuming backend repos should implement FirebaseRepositoryFactory with Firebase Admin SDK injected at runtime.
 */
export const firebaseRepositoryContractVersion = '1.0.0';
