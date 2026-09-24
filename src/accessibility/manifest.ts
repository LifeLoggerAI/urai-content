export type AccessibleMediaKind = 'image' | 'audio' | 'video' | 'animation' | 'spatial';

export type AccessibilityManifest = {
  version: '1.0.0';
  entityId: string;
  mediaKind: AccessibleMediaKind;
  locale: string;
  altText: string | null;
  captionsRef: string | null;
  transcriptRef: string | null;
  audioDescriptionRef: string | null;
  reducedMotionRef: string | null;
  plainLanguageRef: string | null;
  provenanceRecordId: string;
};

export function validateAccessibilityManifest(
  manifest: AccessibilityManifest,
): AccessibilityManifest {
  if (!manifest.entityId || !manifest.locale || !manifest.provenanceRecordId) {
    throw new Error('Accessibility manifest identity, locale and provenance are required');
  }

  if (manifest.mediaKind === 'image' && !manifest.altText?.trim()) {
    throw new Error('Image accessibility manifest requires alt text');
  }
  if (manifest.mediaKind === 'audio' && !manifest.transcriptRef) {
    throw new Error('Audio accessibility manifest requires a transcript');
  }
  if (manifest.mediaKind === 'video' && (!manifest.captionsRef || !manifest.transcriptRef)) {
    throw new Error('Video accessibility manifest requires captions and transcript');
  }
  if ((manifest.mediaKind === 'animation' || manifest.mediaKind === 'spatial') && !manifest.reducedMotionRef) {
    throw new Error('Motion/spatial accessibility manifest requires a reduced-motion equivalent');
  }

  return { ...manifest };
}
