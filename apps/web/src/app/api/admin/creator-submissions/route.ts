import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/server/auth/authorization';
import { getAuthFailureBody, getAuthFailureStatus, getRequestSession } from '@/server/auth/requestSession';
import { createRuntimeContentRepository, getRuntimePersistenceStatus } from '@/server/content/service';

export const dynamic = 'force-dynamic';

const queueSearchSchema = z.object({
  status: z.enum(['submitted', 'approved', 'rejected', 'changes_requested']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

function parseSearchParams(request: Request): z.infer<typeof queueSearchSchema> | null {
  const url = new URL(request.url);
  const parsed = queueSearchSchema.safeParse({
    status: url.searchParams.get('status') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined
  });

  return parsed.success ? parsed.data : null;
}

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

export async function GET(request: Request) {
  const authorization = requireAdmin(await getRequestSession(request));

  if (!authorization.ok) {
    return NextResponse.json(getAuthFailureBody(authorization.reason), { status: getAuthFailureStatus(authorization.reason) });
  }

  const unavailable = persistenceUnavailableResponse();
  if (unavailable) return unavailable;

  const search = parseSearchParams(request);

  if (!search) {
    return NextResponse.json(
      {
        error: 'invalid_request',
        message: 'Creator submission queue requires a valid status and limit.'
      },
      { status: 400 }
    );
  }

  const submissions = await createRuntimeContentRepository().listCreatorSubmissionQueue(search);

  return NextResponse.json({
    ok: true,
    status: search.status ?? null,
    limit: search.limit,
    count: submissions.length,
    submissions
  });
}
