import { NextResponse } from 'next/server';
import { canReadOwnedResource } from '@/server/auth/authorization';
import { getAuthFailureBody, getAuthFailureStatus, getRequestSession } from '@/server/auth/requestSession';
import { createRuntimeContentRepository } from '@/server/content/service';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const repository = createRuntimeContentRepository();
  const submission = await repository.getCreatorSubmission(id);

  if (!submission) {
    return NextResponse.json(
      {
        error: 'not_found',
        message: 'Creator submission not found.'
      },
      { status: 404 }
    );
  }

  const authorization = canReadOwnedResource(getRequestSession(request), String(submission.creatorId ?? ''));

  if (!authorization.ok) {
    return NextResponse.json(getAuthFailureBody(authorization.reason), { status: getAuthFailureStatus(authorization.reason) });
  }

  return NextResponse.json({
    ok: true,
    submission
  });
}
