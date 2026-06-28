import { NextResponse } from 'next/server';
import { canReadOwnedResource } from '@/server/auth/authorization';
import { getAuthFailureBody, getAuthFailureStatus, getRequestSession } from '@/server/auth/requestSession';
import { createRuntimeContentRepository, getRuntimePersistenceStatus } from '@/server/content/service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

function persistenceUnavailableResponse() {
  const persistence = getRuntimePersistenceStatus();
  if (persistence.writable) return null;

  return NextResponse.json({
    ok: false,
    error: 'persistence_not_configured',
    message: persistence.message,
    persistence
  }, { status: 503 });
}

export async function GET(request: Request, context: RouteContext) {
  const unavailable = persistenceUnavailableResponse();
  if (unavailable) return unavailable;

  const { id } = await context.params;
  const submission = await createRuntimeContentRepository().getCreatorSubmission(id);

  if (!submission) {
    return NextResponse.json({ error: 'not_found', message: 'Creator submission not found.' }, { status: 404 });
  }

  const authorization = canReadOwnedResource(await getRequestSession(request), String(submission.creatorId ?? ''));

  if (!authorization.ok) {
    return NextResponse.json(getAuthFailureBody(authorization.reason), { status: getAuthFailureStatus(authorization.reason) });
  }

  return NextResponse.json({ ok: true, submission });
}
