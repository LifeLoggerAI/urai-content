import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/server/auth/authorization';
import { getAuthFailureBody, getAuthFailureStatus, getRequestSession } from '@/server/auth/requestSession';
import { createRuntimeContentRepository } from '@/server/content/service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

const moderationRequestSchema = z.object({
  decision: z.enum(['approved', 'rejected', 'changes_requested']),
  notes: z.string().max(4000).optional()
});

async function parseBody(request: Request): Promise<z.infer<typeof moderationRequestSchema> | null> {
  if (!request.headers.get('content-type')?.includes('application/json')) return null;
  const parsed = moderationRequestSchema.safeParse(await request.json());
  return parsed.success ? parsed.data : null;
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getRequestSession(request);
  const authorization = requireAdmin(session);

  if (!authorization.ok) {
    return NextResponse.json(getAuthFailureBody(authorization.reason), { status: getAuthFailureStatus(authorization.reason) });
  }

  const body = await parseBody(request);

  if (!body) {
    return NextResponse.json({ error: 'invalid_request', message: 'Moderation requires a valid JSON body with a supported decision.' }, { status: 400 });
  }

  const { id } = await context.params;
  const repository = createRuntimeContentRepository();
  const submission = await repository.getCreatorSubmission(id);

  if (!submission) {
    return NextResponse.json({ error: 'not_found', message: 'Creator submission not found.' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const moderatedSubmission = {
    ...submission,
    status: body.decision,
    moderationNotes: body.notes ?? null,
    moderatedAt: now,
    moderatedBy: session!.uid,
    updatedAt: now
  };

  await repository.upsertCreatorSubmission(moderatedSubmission);
  await repository.logModeration({
    id: `${id}-${body.decision}-${Date.now()}`,
    entityType: 'creatorSubmission',
    entityId: id,
    decision: body.decision,
    notes: body.notes ?? null,
    moderatedAt: now,
    moderatedBy: session!.uid
  });

  return NextResponse.json({ ok: true, submission: moderatedSubmission });
}
