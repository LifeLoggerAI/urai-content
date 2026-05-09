import { NextResponse } from 'next/server';
import { seedCanonicalContent } from '@/server/content/canonicalSeed';
import { createFirestoreContentRepository } from '@/server/firebase/contentRepository';
import { getFirebaseAdminDb, isFirebaseAdminConfigured } from '@/server/firebase/admin';
import { verifySeedToken } from '@/server/firebase/adminEnv';

export const dynamic = 'force-dynamic';

type SeedRequestBody = {
  token?: string;
  dryRun?: boolean;
};

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  return authorization.slice('Bearer '.length).trim();
}

async function parseBody(request: Request): Promise<SeedRequestBody> {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return {};
  }

  return (await request.json()) as SeedRequestBody;
}

export async function POST(request: Request) {
  const body = await parseBody(request);
  const providedToken = body.token ?? getBearerToken(request);

  if (!verifySeedToken(providedToken)) {
    return NextResponse.json(
      {
        error: 'unauthorized',
        message: 'Canonical content seeding requires a valid server seed token.'
      },
      { status: 401 }
    );
  }

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      {
        error: 'firebase_not_configured',
        message: 'Firebase Admin must be configured before canonical content can be seeded.'
      },
      { status: 409 }
    );
  }

  if (body.dryRun) {
    return NextResponse.json({
      dryRun: true,
      message: 'Seed token and Firebase configuration checks passed. No writes were performed.'
    });
  }

  const repository = createFirestoreContentRepository(getFirebaseAdminDb());
  const result = await seedCanonicalContent(repository);

  return NextResponse.json({
    ok: true,
    seeded: result
  });
}
