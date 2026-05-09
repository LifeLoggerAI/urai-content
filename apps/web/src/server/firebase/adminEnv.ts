import 'server-only';
import { z } from 'zod';

const firebaseAdminEnvSchema = z.object({
  FIREBASE_PROJECT_ID: z.string().min(1).optional(),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
  FIREBASE_PRIVATE_KEY: z.string().min(1).optional(),
  FIREBASE_STORAGE_BUCKET: z.string().min(1).optional(),
  FIREBASE_HOSTING_SITE: z.string().min(1).optional(),
  URAI_CONTENT_ADMIN_UIDS: z.string().optional(),
  URAI_CONTENT_SEED_TOKEN: z.string().min(16).optional()
});

type EnvInput = Record<string, string | undefined>;

export type FirebaseAdminEnv = z.infer<typeof firebaseAdminEnvSchema>;

export function getFirebaseAdminEnv(input: EnvInput = process.env): FirebaseAdminEnv {
  return firebaseAdminEnvSchema.parse(input);
}

export function hasFirebaseAdminCredentials(env: FirebaseAdminEnv = getFirebaseAdminEnv()): boolean {
  return Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);
}

export function getRequiredFirebaseAdminEnv(input: EnvInput = process.env): Required<Pick<FirebaseAdminEnv, 'FIREBASE_PROJECT_ID' | 'FIREBASE_CLIENT_EMAIL' | 'FIREBASE_PRIVATE_KEY'>> & FirebaseAdminEnv {
  const env = getFirebaseAdminEnv(input);

  if (!hasFirebaseAdminCredentials(env)) {
    throw new Error('Firebase Admin credentials are not configured.');
  }

  return env as Required<Pick<FirebaseAdminEnv, 'FIREBASE_PROJECT_ID' | 'FIREBASE_CLIENT_EMAIL' | 'FIREBASE_PRIVATE_KEY'>> & FirebaseAdminEnv;
}

export function parseAdminUids(env: FirebaseAdminEnv = getFirebaseAdminEnv()): string[] {
  return (env.URAI_CONTENT_ADMIN_UIDS ?? '')
    .split(',')
    .map((uid) => uid.trim())
    .filter(Boolean);
}

export function normalizePrivateKey(key: string): string {
  return key.replace(/\\n/g, '\n');
}

export function verifySeedToken(providedToken: string | null, env: FirebaseAdminEnv = getFirebaseAdminEnv()): boolean {
  return Boolean(env.URAI_CONTENT_SEED_TOKEN && providedToken && providedToken === env.URAI_CONTENT_SEED_TOKEN);
}
