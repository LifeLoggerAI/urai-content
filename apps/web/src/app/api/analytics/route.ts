import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getFirebaseAdminDb, isFirebaseAdminConfigured } from '@/server/firebase/admin';

const analyticsSchema = z.object({
  eventName: z.enum([
    'page_view',
    'cta_clicked',
    'waitlist_started',
    'waitlist_submitted',
    'waitlist_failed',
    'demo_requested',
    'investor_inquiry_submitted',
    'partner_inquiry_submitted',
    'research_inquiry_submitted',
    'faq_opened',
    'privacy_page_viewed',
    'data_ownership_page_viewed',
    'demo_video_played',
    'outbound_email_clicked'
  ]),
  properties: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).default({})
});

export async function POST(request: Request) {
  const parsed = analyticsSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ ok: true, stored: false });
  }

  const db = getFirebaseAdminDb();
  await db.collection('public_analytics_events').add({
    eventName: parsed.data.eventName,
    properties: parsed.data.properties,
    path: request.headers.get('referer') ?? null,
    userAgent: request.headers.get('user-agent') ?? null,
    createdAt: new Date().toISOString()
  });

  return NextResponse.json({ ok: true, stored: true });
}
