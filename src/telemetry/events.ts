import { telemetryEventSchema } from '../schemas/content.js';
import { validateContentAnalyticsEvent } from './policy.js';

export const telemetryLog: string[] = [];

export function trackEvent(event: unknown): void {
  const parsed = validateContentAnalyticsEvent(telemetryEventSchema.parse(event));
  telemetryLog.push(`${parsed.event}:${parsed.entityId}`);
}
