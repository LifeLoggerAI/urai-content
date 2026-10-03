import { describe, expect, it } from 'vitest';
import { validateAccessibilityReview } from '../src/accessibility/review.js';
import type { AccessibilityManifest } from '../src/accessibility/manifest.js';

const manifest: AccessibilityManifest = {
  version:'1.0.0', entityId:'image-1', mediaKind:'image', locale:'en',
  altText:'Description', captionsRef:null, transcriptRef:null, audioDescriptionRef:null,
  reducedMotionRef:null, plainLanguageRef:null, provenanceRecordId:'p1'
};
const digest='sha256:'+'a'.repeat(64);

describe('accessibility review staleness', () => {
  it('rejects accepted reviews when source identity changed', () => {
    expect(() => validateAccessibilityReview(manifest, {
      entityId:'image-1', locale:'en', sourceVersion:'2', sourceChecksum:digest,
      reviewedSourceVersion:'1', reviewedSourceChecksum:digest, reviewState:'accepted',
      reviewedBy:'reviewer', reviewedAt:'2026-09-23T00:00:00.000Z'
    })).toThrow('Stale');
  });

  it('requires human reviewer metadata for accepted accessibility', () => {
    expect(() => validateAccessibilityReview(manifest, {
      entityId:'image-1', locale:'en', sourceVersion:'1', sourceChecksum:digest,
      reviewedSourceVersion:'1', reviewedSourceChecksum:digest, reviewState:'accepted',
      reviewedBy:null, reviewedAt:null
    })).toThrow('reviewer identity');
  });
});
