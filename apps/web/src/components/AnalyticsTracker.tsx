'use client';

import { useEffect } from 'react';

const allowedEvents = new Set([
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
]);

export function trackPublicEvent(eventName: string, properties: Record<string, string | number | boolean | null> = {}) {
  if (!allowedEvents.has(eventName)) return;

  void fetch('/api/analytics', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ eventName, properties })
  }).catch(() => undefined);
}

export function AnalyticsTracker() {
  useEffect(() => {
    trackPublicEvent('page_view', {
      path: window.location.pathname
    });
  }, []);

  return null;
}
