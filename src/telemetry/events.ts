import { telemetryEventSchema } from '../schemas/content.js';

export const telemetryLog: string[] = [];

export function trackEvent(event: unknown): void {
  const parsed = telemetryEventSchema.parse(event);
  telemetryLog.push(`${parsed.event}:${parsed.entityId}`);
}
