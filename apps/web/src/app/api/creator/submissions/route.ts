import { NextResponse } from 'next/server';
import { z } from 'zod';
import { canCreateCreatorSubmission, isCreatorSession } from '@/server/auth/authorization';
import { getAuthFailureBody, getAuthFailureStatus, getRequestSession } from '@/server/auth/requestSession';
import { createRuntimeContentRepository, getRuntimePersistenceStatus } from '@/server/content/service';

export const dynamic = 'force-dynamic';

const creatorSubmissionRequestSchema = z.object({
  id: z.string().min(1).max(128).optional(),
  creatorId: z.string().min(1).max(128),
  title: z.string().min(1).max(160),
  body: z.string().min(1).max(20000),
  contentType: z.enum(['story', 'ritual', 'narrator', 'marketplace', 'export']).default('story'),
  tags: z.array(z.string().min(1).max(64)).max(24).default([]),
  locale: z.string().min(2).max(32).default('en-US')
});

type CreatorSubmissionRequest = z.infer<typeof creatorSubmissionRequestSchema>;

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 96) || 'submission';
}

function createSubmissionId(input: CreatorSubmissionRequest): string {
  return input.id ?? `${input.creatorId}-${slugify(input.title)}-${Date.now()}`;
}

async function parseBody(request: Request): Promise<CreatorSubmissionRequest | null> {
  if (!request.headers.get('content-type')?.includes('application/json')) return null;
  const parsed = creatorSubmissionRequestSchema.safeParse(await request.json());
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
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json(getAuthFailureBody('unauthenticated'), { status: getAuthFailureStatus('unauthenticated') });
  }

  if (!isCreatorSession(session)) {
    return NextResponse.json(getAuthFailureBody('forbidden'), { status: getAuthFailureStatus('forbidden') });
  }

  const unavailable = persistenceUnavailableResponse();
  if (unavailable) return unavailable;

  const submissions = await createRuntimeContentRepository().listCreatorSubmissions(session.uid);

  return NextResponse.json({ ok: true, creatorId: session.uid, count: submissions.length, submissions });
}

export async function POST(request: Request) {
  const body = await parseBody(request);

  if (!body) {
    return NextResponse.json({ error: 'invalid_request', message: 'Creator submissions require a valid JSON body.' }, { status: 400 });
  }

  const authorization = canCreateCreatorSubmission(await getRequestSession(request), body.creatorId);

  if (!authorization.ok) {
    return NextResponse.json(getAuthFailureBody(authorization.reason), { status: getAuthFailureStatus(authorization.reason) });
  }

  const unavailable = persistenceUnavailableResponse();
  if (unavailable) return unavailable;

  const now = new Date().toISOString();
  const submission = {
    id: createSubmissionId(body),
    creatorId: body.creatorId,
    title: body.title,
    body: body.body,
    contentType: body.contentType,
    tags: body.tags,
    locale: body.locale,
    status: 'submitted',
    submittedAt: now,
    updatedAt: now
  };

  await createRuntimeContentRepository().upsertCreatorSubmission(submission);

  return NextResponse.json({ ok: true, submission }, { status: 201 });
}
