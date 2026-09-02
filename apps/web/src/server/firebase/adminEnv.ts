import 'server-only';
import { lstatSync, readFileSync, realpathSync, type Stats } from 'node:fs';
import { z } from 'zod';

const firebaseAdminEnvSchema = z.object({
  FIREBASE_PROJECT_ID: z.string().min(1).optional(),
  FIREBASE_STORAGE_BUCKET: z.string().min(1).optional(),
  FIREBASE_HOSTING_SITE: z.string().min(1).optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().min(1).optional(),
  URAI_CONTENT_FIREBASE_ADMIN_ADC_READY: z.enum(['0', '1']).optional(),
  URAI_CONTENT_ADMIN_UIDS: z.string().optional(),
  URAI_CONTENT_SEED_TOKEN: z.string().min(16).optional()
});

const forbiddenCredentialVariables = [
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'FIREBASE_SERVICE_ACCOUNT_KEY',
  'GOOGLE_CREDENTIALS'
] as const;

type EnvInput = Record<string, string | undefined>;

export type FirebaseAdminEnv = z.infer<typeof firebaseAdminEnvSchema>;

type AdcFileOps = {
  lstatSyncFn?: (path: string) => Pick<Stats, 'isFile' | 'isSymbolicLink'>;
  readFileSyncFn?: (path: string, encoding: BufferEncoding) => string;
  realpathSyncFn?: (path: string) => string;
};

function rejectForbiddenLongLivedCredentials(input: EnvInput): void {
  const forbidden = forbiddenCredentialVariables.filter((name) => Boolean(input[name]?.trim()));
  if (forbidden.length) {
    throw new Error(`Long-lived Google/Firebase credential variables are forbidden: ${forbidden.join(', ')}. Use a protected external_account WIF ADC file.`);
  }
}

export function getFirebaseAdminEnv(input: EnvInput = process.env): FirebaseAdminEnv {
  rejectForbiddenLongLivedCredentials(input);
  return firebaseAdminEnvSchema.parse(input);
}

export function hasFirebaseAdminCredentials(env: FirebaseAdminEnv = getFirebaseAdminEnv()): boolean {
  return Boolean(
    env.FIREBASE_PROJECT_ID
    && env.URAI_CONTENT_FIREBASE_ADMIN_ADC_READY === '1'
    && env.GOOGLE_APPLICATION_CREDENTIALS
  );
}

export function assertExternalAccountAdc(
  env: FirebaseAdminEnv = getFirebaseAdminEnv(),
  {
    lstatSyncFn = lstatSync,
    readFileSyncFn = readFileSync,
    realpathSyncFn = realpathSync
  }: AdcFileOps = {}
): string {
  const credentialPath = env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialPath) {
    throw new Error('Firebase Admin is NO-GO without an explicit protected external_account WIF ADC file.');
  }

  let metadata: Pick<Stats, 'isFile' | 'isSymbolicLink'>;
  let resolvedPath: string;
  let raw: string;
  try {
    metadata = lstatSyncFn(credentialPath);
    resolvedPath = realpathSyncFn(credentialPath);
    raw = readFileSyncFn(credentialPath, 'utf8');
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Firebase Admin ADC file cannot be read safely: ${reason}`);
  }

  if (metadata.isSymbolicLink() || !metadata.isFile() || resolvedPath !== credentialPath) {
    throw new Error('Firebase Admin ADC must be a regular non-symlinked file at its canonical path.');
  }

  let credential: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
    credential = parsed as Record<string, unknown>;
  } catch {
    throw new Error('Firebase Admin ADC file must contain a valid JSON object.');
  }

  if (credential.type !== 'external_account') {
    throw new Error('Firebase Admin ADC must use external_account WIF; service_account and authorized_user credentials are forbidden.');
  }
  if ('private_key' in credential || 'client_email' in credential) {
    throw new Error('Firebase Admin ADC must not contain raw service-account key material.');
  }
  for (const field of ['audience', 'subject_token_type', 'token_url', 'credential_source', 'service_account_impersonation_url']) {
    if (!credential[field]) throw new Error(`Firebase Admin external_account ADC is missing ${field}.`);
  }
  if (
    typeof credential.service_account_impersonation_url !== 'string'
    || !credential.service_account_impersonation_url.startsWith('https://iamcredentials.googleapis.com/')
  ) {
    throw new Error('Firebase Admin external_account ADC must use Google IAM service-account impersonation.');
  }

  return credentialPath;
}

export function getRequiredFirebaseAdminEnv(input: EnvInput = process.env): Required<Pick<FirebaseAdminEnv, 'FIREBASE_PROJECT_ID' | 'GOOGLE_APPLICATION_CREDENTIALS'>> & FirebaseAdminEnv {
  const env = getFirebaseAdminEnv(input);

  if (!hasFirebaseAdminCredentials(env)) {
    throw new Error('Firebase Admin is NO-GO until FIREBASE_PROJECT_ID, GOOGLE_APPLICATION_CREDENTIALS, and URAI_CONTENT_FIREBASE_ADMIN_ADC_READY=1 are set only after the runtime WIF identity has been independently provisioned and verified.');
  }
  assertExternalAccountAdc(env);

  return env as Required<Pick<FirebaseAdminEnv, 'FIREBASE_PROJECT_ID' | 'GOOGLE_APPLICATION_CREDENTIALS'>> & FirebaseAdminEnv;
}

export function parseAdminUids(env: FirebaseAdminEnv = getFirebaseAdminEnv()): string[] {
  return (env.URAI_CONTENT_ADMIN_UIDS ?? '')
    .split(',')
    .map((uid) => uid.trim())
    .filter(Boolean);
}

export function verifySeedToken(providedToken: string | null, env: FirebaseAdminEnv = getFirebaseAdminEnv()): boolean {
  return Boolean(env.URAI_CONTENT_SEED_TOKEN && providedToken && providedToken === env.URAI_CONTENT_SEED_TOKEN);
}
