import type { AccessibilityManifest } from './manifest.js';

export type AccessibilityReviewBinding = {
  entityId: string;
  locale: string;
  sourceVersion: string;
  sourceChecksum: string;
  reviewedSourceVersion: string;
  reviewedSourceChecksum: string;
  reviewState: 'unreviewed' | 'automated_check' | 'human_review_required' | 'accepted';
  reviewedBy: string | null;
  reviewedAt: string | null;
};

export function isAccessibilityReviewStale(binding: AccessibilityReviewBinding): boolean {
  return binding.sourceVersion !== binding.reviewedSourceVersion
    || binding.sourceChecksum !== binding.reviewedSourceChecksum;
}

export function validateAccessibilityReview(
  manifest: AccessibilityManifest,
  binding: AccessibilityReviewBinding,
): AccessibilityReviewBinding {
  if (manifest.entityId !== binding.entityId || manifest.locale !== binding.locale) {
    throw new Error('Accessibility review binding does not match manifest identity');
  }
  if (!/^sha256:[a-f0-9]{64}$/i.test(binding.sourceChecksum) || !/^sha256:[a-f0-9]{64}$/i.test(binding.reviewedSourceChecksum)) {
    throw new Error('Accessibility review requires SHA-256 source checksums');
  }
  if (binding.reviewState === 'accepted' && (!binding.reviewedBy || !binding.reviewedAt)) {
    throw new Error('Accepted accessibility review requires reviewer identity and timestamp');
  }
  if (binding.reviewState === 'accepted' && isAccessibilityReviewStale(binding)) {
    throw new Error('Stale accessibility review cannot remain accepted');
  }
  return { ...binding };
}
