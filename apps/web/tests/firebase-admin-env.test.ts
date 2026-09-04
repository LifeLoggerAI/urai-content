import { describe, expect, it } from 'vitest';
import {
  assertExternalAccountAdc,
  getFirebaseAdminEnv,
  getRequiredFirebaseAdminEnv,
  hasFirebaseAdminCredentials,
  parseAdminUids,
  verifySeedToken
} from '../src/server/firebase/adminEnv';

const ADC_PATH = '/protected/wif-external-account.json';
const SUBJECT_TOKEN_PATH = '/var/run/secrets/oidc-token';

const regularFileOps = (credential: Record<string, unknown>, subjectToken = 'fixture-jwt') => ({
  lstatSyncFn: () => ({
    isFile: () => true,
    isSymbolicLink: () => false
  }),
  realpathSyncFn: (path: string) => path,
  readFileSyncFn: (path: string) => path === ADC_PATH ? JSON.stringify(credential) : subjectToken
});

const validExternalAccount = {
  type: 'external_account',
  audience: '//iam.googleapis.com/projects/123/locations/global/workloadIdentityPools/urai-github/providers/content',
  subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
  token_url: 'https://sts.googleapis.com/v1/token',
  service_account_impersonation_url: 'https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/content-runtime@urai-4dc1d.iam.gserviceaccount.com:generateAccessToken',
  credential_source: {
    file: SUBJECT_TOKEN_PATH
  }
};

describe('Firebase Admin environment helpers', () => {
  it('requires an explicit readiness gate and protected ADC path', () => {
    const missing = getFirebaseAdminEnv({});
    expect(hasFirebaseAdminCredentials(missing)).toBe(false);

    const complete = getFirebaseAdminEnv({
      FIREBASE_PROJECT_ID: 'urai-content-test',
      GOOGLE_APPLICATION_CREDENTIALS: ADC_PATH,
      URAI_CONTENT_FIREBASE_ADMIN_ADC_READY: '1'
    });

    expect(hasFirebaseAdminCredentials(complete, regularFileOps(validExternalAccount))).toBe(true);
    expect(hasFirebaseAdminCredentials(complete, regularFileOps({ ...validExternalAccount, token_url: 'https://attacker.invalid/token' }))).toBe(false);
    expect(hasFirebaseAdminCredentials(complete, { lstatSyncFn: () => { throw new Error('missing mount'); } })).toBe(false);
  });

  it('throws while Firebase Admin WIF readiness is incomplete', () => {
    expect(() => getRequiredFirebaseAdminEnv({ FIREBASE_PROJECT_ID: 'only-project' })).toThrow(
      'Firebase Admin is NO-GO'
    );
  });

  it('accepts only regular external_account WIF ADC with impersonation', () => {
    const env = getFirebaseAdminEnv({
      FIREBASE_PROJECT_ID: 'urai-content-test',
      GOOGLE_APPLICATION_CREDENTIALS: ADC_PATH,
      URAI_CONTENT_FIREBASE_ADMIN_ADC_READY: '1'
    });

    expect(assertExternalAccountAdc(env, regularFileOps(validExternalAccount))).toBe(ADC_PATH);
    expect(() => assertExternalAccountAdc(env, regularFileOps({
      ...validExternalAccount,
      token_url: 'https://attacker.invalid/token'
    }))).toThrow('exact Google STS token endpoint');
    expect(() => assertExternalAccountAdc(env, regularFileOps({
      type: 'service_account',
      client_email: 'legacy@example.iam.gserviceaccount.com',
      private_key: 'forbidden'
    }))).toThrow('external_account WIF');
  });

  it('rejects non-regular paths before reading and empty credential sources', () => {
    const env = getFirebaseAdminEnv({
      FIREBASE_PROJECT_ID: 'urai-content-test',
      GOOGLE_APPLICATION_CREDENTIALS: ADC_PATH,
      URAI_CONTENT_FIREBASE_ADMIN_ADC_READY: '1'
    });
    let readAttempted = false;
    expect(() => assertExternalAccountAdc(env, {
      lstatSyncFn: () => ({ isFile: () => false, isSymbolicLink: () => false }),
      realpathSyncFn: () => ADC_PATH,
      readFileSyncFn: () => { readAttempted = true; return ''; }
    })).toThrow('regular non-symlinked file');
    expect(readAttempted).toBe(false);
    expect(() => assertExternalAccountAdc(env, regularFileOps({ ...validExternalAccount, credential_source: {} }))).toThrow('protected subject-token file');
    expect(() => assertExternalAccountAdc(env, regularFileOps({ ...validExternalAccount, audience: {} }))).toThrow('audience must be');
    expect(() => assertExternalAccountAdc(env, regularFileOps({ ...validExternalAccount, subject_token_type: 1 }))).toThrow('JWT subject token type');
    expect(() => assertExternalAccountAdc(env, {
      ...regularFileOps(validExternalAccount),
      lstatSyncFn: (path: string) => {
        if (path === SUBJECT_TOKEN_PATH) throw new Error('missing subject token');
        return { isFile: () => true, isSymbolicLink: () => false };
      }
    })).toThrow('subject-token file cannot be inspected safely');
  });

  it('rejects conflicting credential-source mechanisms', () => {
    const env = getFirebaseAdminEnv({
      FIREBASE_PROJECT_ID: 'urai-content-test',
      GOOGLE_APPLICATION_CREDENTIALS: ADC_PATH,
      URAI_CONTENT_FIREBASE_ADMIN_ADC_READY: '1'
    });

    for (const competing of [
      { url: 'https://metadata.invalid/token' },
      { executable: { command: '/bin/false' } },
      { certificate: { path: '/tmp/cert' } }
    ]) {
      const credential = {
        ...validExternalAccount,
        credential_source: { file: SUBJECT_TOKEN_PATH, ...competing }
      };
      expect(hasFirebaseAdminCredentials(env, regularFileOps(credential))).toBe(false);
      expect(() => assertExternalAccountAdc(env, regularFileOps(credential))).toThrow('must use only the protected file mechanism');
    }
  });

  it('requires the subject-token file to be readable and nonempty', () => {
    const env = getFirebaseAdminEnv({
      FIREBASE_PROJECT_ID: 'urai-content-test',
      GOOGLE_APPLICATION_CREDENTIALS: ADC_PATH,
      URAI_CONTENT_FIREBASE_ADMIN_ADC_READY: '1'
    });

    expect(hasFirebaseAdminCredentials(env, regularFileOps(validExternalAccount, ''))).toBe(false);
    expect(() => assertExternalAccountAdc(env, regularFileOps(validExternalAccount, '   \n'))).toThrow('subject-token file is empty');
    expect(() => assertExternalAccountAdc(env, {
      ...regularFileOps(validExternalAccount),
      readFileSyncFn: (path: string) => {
        if (path === SUBJECT_TOKEN_PATH) throw new Error('permission denied');
        return JSON.stringify(validExternalAccount);
      }
    })).toThrow('subject-token file cannot be inspected safely: permission denied');
  });

  it('rejects legacy long-lived credential variables', () => {
    expect(() => getFirebaseAdminEnv({
      FIREBASE_PROJECT_ID: 'urai-content-test',
      FIREBASE_PRIVATE_KEY: 'forbidden'
    })).toThrow('Long-lived Google/Firebase credential variables are forbidden');
  });

  it('parses comma-separated admin UIDs', () => {
    const env = getFirebaseAdminEnv({
      URAI_CONTENT_ADMIN_UIDS: 'admin-1, admin-2,,admin-3 '
    });

    expect(parseAdminUids(env)).toEqual(['admin-1', 'admin-2', 'admin-3']);
  });

  it('verifies seed tokens only when the configured token matches', () => {
    const env = getFirebaseAdminEnv({
      URAI_CONTENT_SEED_TOKEN: 'seed-token-at-least-16-chars'
    });

    expect(verifySeedToken('seed-token-at-least-16-chars', env)).toBe(true);
    expect(verifySeedToken('wrong-token', env)).toBe(false);
    expect(verifySeedToken(null, env)).toBe(false);
    expect(verifySeedToken('seed-token-at-least-16-chars', getFirebaseAdminEnv({}))).toBe(false);
  });
});