import { NextResponse } from 'next/server';
import { getFirebaseAdminEnv, hasFirebaseAdminCredentials, parseAdminUids } from '@/server/firebase/adminEnv';

export const dynamic = 'force-dynamic';

export function GET() {
  const env = getFirebaseAdminEnv();

  return NextResponse.json({
    firebaseAdminConfigured: hasFirebaseAdminCredentials(env),
    projectConfigured: Boolean(env.FIREBASE_PROJECT_ID),
    storageBucketConfigured: Boolean(env.FIREBASE_STORAGE_BUCKET),
    hostingSiteConfigured: Boolean(env.FIREBASE_HOSTING_SITE),
    adminUidCount: parseAdminUids(env).length
  });
}
