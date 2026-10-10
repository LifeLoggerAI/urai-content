import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getFirebaseAdminDb, isFirebaseAdminConfigured } from '@/server/firebase/admin';
import { implementedPublicRoutes } from '@/lib/publicRoutes';

export const dynamic = 'force-dynamic';

const MAX_INTAKE_BODY_BYTES = 8192;
const leadSchema = z.object({
  kind: z.enum(['waitlist', 'contact']).default('contact'),
  name: z.string().max(160).optional().or(z.literal('')),
  email: z.string().email().max(320),
  leadType: z.enum(['user', 'demo', 'investor', 'partner', 'research', 'press', 'contact']).default('user'),
  organization: z.string().max(200).optional().or(z.literal('')),
  message: z.string().max(2000).optional().or(z.literal('')),
  consentToUpdates: z.union([z.literal('true'), z.boolean()]).optional()
}).strict();

function collectionForLeadType(leadType: z.infer<typeof leadSchema>['leadType']): string | null {
  if (leadType === 'investor') return 'investor_inquiries';
  if (leadType === 'partner') return 'partner_inquiries';
  if (leadType === 'research') return 'research_inquiries';
  if (leadType === 'demo') return 'demo_requests';
  return null;
}

function sourcePath(request: Request): string {
  const referer = request.headers.get('referer');
  if (!referer) return 'direct';
  try {
    const source = new URL(referer);
    return source.origin === new URL(request.url).origin && implementedPublicRoutes.some((route) => route === source.pathname)
      ? source.pathname
      : 'direct';
  } catch {
    return 'direct';
  }
}

class IntakeBodyTooLarge extends Error {}

async function readIntakeBody(request: Request): Promise<string> {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let byteCount = 0;
  let text = '';
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      byteCount += chunk.value.byteLength;
      if (byteCount > MAX_INTAKE_BODY_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new IntakeBodyTooLarge();
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

function unavailableResponse() {
  return NextResponse.json({
    ok: false,
    stored: false,
    message: 'Intake is temporarily unavailable. Please try again.'
  }, { status: 503, headers: { 'cache-control': 'no-store' } });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ ok: false, stored: false, message: 'This request origin is not allowed.' }, { status: 403 });
  }
  if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    return NextResponse.json({ ok: false, stored: false, message: 'A JSON request is required.' }, { status: 415 });
  }
  const declaredLength = Number(request.headers.get('content-length'));
  if (declaredLength > MAX_INTAKE_BODY_BYTES) {
    return NextResponse.json({ ok: false, stored: false, message: 'This request is too large.' }, { status: 413 });
  }
  let inputBody: unknown;
  try {
    inputBody = JSON.parse(await readIntakeBody(request));
  } catch (error) {
    if (error instanceof IntakeBodyTooLarge) {
      return NextResponse.json({ ok: false, stored: false, message: 'This request is too large.' }, { status: 413 });
    }
    return NextResponse.json({ ok: false, stored: false, message: 'Please enter valid inquiry details.' }, { status: 400 });
  }
  const parsed = leadSchema.safeParse(inputBody);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, stored: false, message: 'Please enter a valid email and required fields.' }, { status: 400 });
  }
  const input = parsed.data;
  const consentToUpdates = input.consentToUpdates === true || input.consentToUpdates === 'true';
  if (input.kind === 'waitlist' && !consentToUpdates) {
    return NextResponse.json({ ok: false, stored: false, message: 'Waitlist updates require your explicit agreement.' }, { status: 400 });
  }
  if (!isFirebaseAdminConfigured()) return unavailableResponse();

  const baseRecord = {
    email: input.email.toLowerCase(),
    name: input.name || null,
    organization: input.organization || null,
    message: input.message || null,
    sourcePath: sourcePath(request),
    userAgent: request.headers.get('user-agent')?.slice(0, 512) ?? null,
    createdAt: new Date().toISOString(),
    status: 'new',
    consentToUpdates
  };
  try {
    const db = getFirebaseAdminDb();
    const batch = db.batch();
    if (input.kind === 'waitlist') {
      batch.create(db.collection('waitlist_signups').doc(), {
        ...baseRecord,
        interestType: input.leadType,
        sourceCTA: 'waitlist_form'
      });
    } else {
      const leadRecord = { ...baseRecord, leadType: input.leadType, sourceCTA: 'lead_form' };
      batch.create(db.collection('leads').doc(), leadRecord);
      const specializedCollection = collectionForLeadType(input.leadType);
      if (specializedCollection) batch.create(db.collection(specializedCollection).doc(), leadRecord);
    }
    await batch.commit();
  } catch {
    return unavailableResponse();
  }
  return NextResponse.json({
    ok: true,
    stored: true,
    message: input.kind === 'waitlist' ? 'You are on the URAI waitlist.' : 'Inquiry received for review.'
  }, { headers: { 'cache-control': 'no-store' } });
}
