import { NextResponse } from 'next/server';
import { getRuntimePersistenceStatus } from '@/server/content/service';
import { getFirebaseAdminEnv, hasFirebaseAdminCredentials, parseAdminUids } from '@/server/firebase/adminEnv';

export const dynamic = 'force-dynamic';

export function GET() {
  const env = getFirebaseAdminEnv();
  const persistence = getRuntimePersistenceStatus();

  return NextResponse.json({
    firebaseAdminConfigured: hasFirebaseAdminCredentials(env),
    runtimeContentMode: persistence.mode,
    persistenceWritable: persistence.writable,
    productionSafe: persistence.productionSafe,
    previewMode: persistence.previewMode,
    projectConfigured: Boolean(env.FIREBASE_PROJECT_ID),
    storageBucketConfigured: Boolean(env.FIREBASE_STORAGE_BUCKET),
    hostingSiteConfigured: Boolean(env.FIREBASE_HOSTING_SITE),
    adminUidCount: parseAdminUids(env).length,
    statusMessage: persistence.message
  });
}
