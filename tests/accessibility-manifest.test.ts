import { describe, expect, it } from 'vitest';
import { validateAccessibilityManifest } from '../src/accessibility/manifest.js';

describe('accessibility manifest contract', () => {
  it('requires equivalent media for video and motion/spatial content', () => {
    expect(() => validateAccessibilityManifest({
      version: '1.0.0',
      entityId: 'video-1',
      mediaKind: 'video',
      locale: 'en-US',
      altText: null,
      captionsRef: null,
      transcriptRef: 'transcript-1',
      audioDescriptionRef: null,
      reducedMotionRef: null,
      plainLanguageRef: null,
      provenanceRecordId: 'prov-1',
    })).toThrow('requires captions and transcript');

    const spatial = validateAccessibilityManifest({
      version: '1.0.0',
      entityId: 'scene-1',
      mediaKind: 'spatial',
      locale: 'en-US',
      altText: null,
      captionsRef: null,
      transcriptRef: null,
      audioDescriptionRef: null,
      reducedMotionRef: 'scene-1-reduced',
      plainLanguageRef: null,
      provenanceRecordId: 'prov-2',
    });
    expect(spatial.reducedMotionRef).toBe('scene-1-reduced');
  });
});
