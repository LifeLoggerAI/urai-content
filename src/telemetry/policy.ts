import type { TelemetryEvent } from '../schemas/content.js';

export const ALLOWED_CONTENT_ANALYTICS_METADATA_KEYS = [
  'contentVersion',
  'locale',
  'surface',
  'lifecycleStatus',
  'contentType',
  'sourceSystem',
  'experimentKey'
] as const;

const allowed = new Set<string>(ALLOWED_CONTENT_ANALYTICS_METADATA_KEYS);
const forbiddenKeyPattern = /(memory|transcript|body|prompt|email|phone|address|location|latitude|longitude|health|medical|diagnos|token|secret|password)/i;

export function validateContentAnalyticsEvent(event: TelemetryEvent): TelemetryEvent {
  for (const [key, value] of Object.entries(event.metadata)) {
    if (!allowed.has(key)) throw new Error('Analytics metadata key is not allowlisted: ' + key);
    if (forbiddenKeyPattern.test(key)) throw new Error('Sensitive analytics metadata key is forbidden: ' + key);
    if (value !== null && !['string', 'number', 'boolean'].includes(typeof value)) {
      throw new Error('Analytics metadata values must be scalar');
    }
    if (typeof value === 'string' && value.length > 160) {
      throw new Error('Analytics metadata string exceeds bounded length');
    }
  }
  return { ...event, metadata: { ...event.metadata } };
}
