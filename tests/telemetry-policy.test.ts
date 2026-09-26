import { describe, expect, it } from 'vitest';
import { validateContentAnalyticsEvent } from '../src/telemetry/policy.js';
import type { TelemetryEvent } from '../src/schemas/content.js';

const event: TelemetryEvent = {
  event: 'content_viewed',
  userId: 'synthetic-user',
  entityId: 'content-1',
  timestamp: '2026-09-23T00:00:00.000Z',
  metadata: { locale: 'en', surface: 'content' }
};

describe('Content analytics minimization policy', () => {
  it('accepts bounded operational dimensions', () => {
    expect(validateContentAnalyticsEvent(event)).toEqual(event);
  });

  it('rejects raw or non-allowlisted payload fields', () => {
    expect(() => validateContentAnalyticsEvent({ ...event, metadata: { memoryText: 'private memory' } })).toThrow('not allowlisted');
    expect(() => validateContentAnalyticsEvent({ ...event, metadata: { locale: { raw: 'en' } } })).toThrow('scalar');
  });
});
