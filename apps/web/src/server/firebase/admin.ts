import 'server-only';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getRequiredFirebaseAdminEnv, hasFirebaseAdminCredentials, normalizePrivateKey } from './adminEnv';

export function isFirebaseAdminConfigured(): boolean {
  return hasFirebaseAdminCredentials();
}

export function getFirebaseAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const env = getRequiredFirebaseAdminEnv();

  return initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(env.FIREBASE_PRIVATE_KEY)
    }),
    storageBucket: env.FIREBASE_STORAGE_BUCKET
  });
}

export function getFirebaseAdminDb(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}
