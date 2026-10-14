import { NextResponse } from 'next/server';
import { requireAdmin } from '@/server/auth/authorization';
import { getAuthFailureBody, getAuthFailureStatus, getRequestSession } from '@/server/auth/requestSession';
import { recheckRequestSession } from '@/server/auth/currentRequest';
import { createRuntimeContentRepository } from '@/server/content/service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const session = await getRequestSession(request);
  const authorization = requireAdmin(session);

  if (!authorization.ok) {
    return NextResponse.json(getAuthFailureBody(authorization.reason), { status: getAuthFailureStatus(authorization.reason) });
  }

  const { id } = await context.params;
  const readAuthorization = requireAdmin(await recheckRequestSession(request, session!));
  if (!readAuthorization.ok) {
    return NextResponse.json(getAuthFailureBody(readAuthorization.reason), { status: getAuthFailureStatus(readAuthorization.reason) });
  }
  const submission = await createRuntimeContentRepository().getCreatorSubmission(id);
  const currentAuthorization = requireAdmin(await recheckRequestSession(request, session!));
  if (!currentAuthorization.ok) {
    return NextResponse.json(getAuthFailureBody(currentAuthorization.reason), { status: getAuthFailureStatus(currentAuthorization.reason) });
  }

  if (!submission) {
    return NextResponse.json({ error: 'not_found', message: 'Creator submission not found.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, submission });
}
