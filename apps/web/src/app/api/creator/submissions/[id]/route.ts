import { NextResponse } from 'next/server';
import { canReadOwnedResource } from '@/server/auth/authorization';
import { getAuthFailureBody, getAuthFailureStatus, getRequestSession } from '@/server/auth/requestSession';
import { recheckRequestSession } from '@/server/auth/currentRequest';
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

  // Authenticate before reading private records or revealing their existence.
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json(getAuthFailureBody('unauthenticated'), { status: getAuthFailureStatus('unauthenticated') });
  }

  const { id } = await context.params;
  if (!await recheckRequestSession(request, session)) {
    return NextResponse.json(getAuthFailureBody('unauthenticated'), { status: getAuthFailureStatus('unauthenticated') });
  }
  const submission = await createRuntimeContentRepository().getCreatorSubmission(id);

  const currentSession = await recheckRequestSession(request, session);
  if (!currentSession) {
    return NextResponse.json(getAuthFailureBody('unauthenticated'), { status: getAuthFailureStatus('unauthenticated') });
  }
  if (!submission) {
    return NextResponse.json({ error: 'not_found', message: 'Creator submission not found.' }, { status: 404 });
  }

  const authorization = canReadOwnedResource(currentSession, String(submission.creatorId ?? ''));

  if (!authorization.ok) {
    return NextResponse.json(getAuthFailureBody(authorization.reason), { status: getAuthFailureStatus(authorization.reason) });
  }

  return NextResponse.json({ ok: true, submission });
}
