import { describe, expect, it } from 'vitest';
import {
  isTranslationStale,
  validateLocaleRegistry,
  validateTranslationRecord,
} from '../src/localization/contracts.js';

const digest = 'sha256:' + 'a'.repeat(64);

describe('localization governance contracts', () => {
  it('supports registered fallbacks and rtl direction without claiming translation completeness', () => {
    const locales = validateLocaleRegistry([
      { locale: 'en-US', label: 'English (US)', direction: 'ltr', fallbackLocale: null, enabled: true },
      { locale: 'ar', label: 'Arabic', direction: 'rtl', fallbackLocale: 'en-US', enabled: false },
    ]);
    expect(locales[1]?.direction).toBe('rtl');
  });

  it('requires independent review metadata for approved translations and detects staleness', () => {
    const draft = validateTranslationRecord({
      entityId: 'content-1',
      locale: 'es',
      sourceLocale: 'en-US',
      sourceVersion: '1.0.0',
      sourceChecksum: digest,
      translatedFields: { title: 'Titulo' },
      status: 'draft',
      provenanceRecordId: 'prov-1',
      reviewerId: null,
      reviewedAt: null,
    });
    expect(isTranslationStale(draft, '1.0.1', digest)).toBe(true);

    expect(() => validateTranslationRecord({ ...draft, status: 'approved' })).toThrow('requires reviewer');
  });
});
