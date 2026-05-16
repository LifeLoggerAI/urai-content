import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getFirebaseAdminDb, isFirebaseAdminConfigured } from '@/server/firebase/admin';

const leadSchema = z.object({
  kind: z.enum(['waitlist', 'contact']).default('contact'),
  name: z.string().max(160).optional().or(z.literal('')),
  email: z.string().email(),
  leadType: z.enum(['user', 'demo', 'investor', 'partner', 'research', 'press', 'contact']).default('user'),
  organization: z.string().max(200).optional().or(z.literal('')),
  message: z.string().max(2000).optional().or(z.literal('')),
  consentToUpdates: z.union([z.literal('true'), z.literal(true)]).optional()
});

export async function POST(request: Request) {
  const parsed = leadSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Please enter a valid email and required fields.' }, { status: 400 });
  }

  const input = parsed.data;
  const now = new Date().toISOString();
  const baseRecord = {
    email: input.email.toLowerCase(),
    name: input.name || null,
    organization: input.organization || null,
    message: input.message || null,
    sourcePath: request.headers.get('referer') ?? 'direct',
    userAgent: request.headers.get('user-agent') ?? null,
    createdAt: now,
    status: 'new'
  };

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({
      ok: true,
      stored: false,
      message: 'Received. Firebase intake is not configured in this environment, so this was accepted in preview mode.'
    });
  }

  const db = getFirebaseAdminDb();

  if (input.kind === 'waitlist') {
    await db.collection('waitlist_signups').add({
      ...baseRecord,
      interestType: input.leadType,
      sourceCTA: 'waitlist_form',
      consentToUpdates: Boolean(input.consentToUpdates)
    });
    return NextResponse.json({ ok: true, stored: true, message: 'You are on the URAI waitlist. We will send updates as early access opens.' });
  }

  await db.collection('leads').add({
    ...baseRecord,
    leadType: input.leadType,
    sourceCTA: 'lead_form',
    consentToUpdates: Boolean(input.consentToUpdates)
  });

  return NextResponse.json({ ok: true, stored: true, message: 'Inquiry received. URAI Labs will review it.' });
}
