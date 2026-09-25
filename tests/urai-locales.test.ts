import { describe, expect, it } from 'vitest';
import { URAI_GOVERNED_LOCALES, isProductionLocaleAdmitted, uraiLocaleRegistry } from '../src/localization/uraiLocales.js';
import { createTranslationBundle, verifyTranslationBundle } from '../src/localization/bundle.js';

describe('URAI governed locale authority', () => {
  it('locks the governed 20-locale set and RTL metadata without claiming production completion', () => {
    expect(URAI_GOVERNED_LOCALES).toHaveLength(20);
    expect(uraiLocaleRegistry.find((entry) => entry.locale === 'ar')?.direction).toBe('rtl');
    expect(uraiLocaleRegistry.find((entry) => entry.locale === 'fa')?.direction).toBe('rtl');
    expect(isProductionLocaleAdmitted('en')).toBe(true);
    expect(isProductionLocaleAdmitted('es')).toBe(false);
  });

  it('creates deterministic translation exchange bundles and rejects unsupported locales', () => {
    const bundle = createTranslationBundle('en', '1', [{
      entityId:'c1', locale:'es', sourceLocale:'en', sourceVersion:'1',
      sourceChecksum:'sha256:' + 'a'.repeat(64), translatedFields:{title:'Titulo'},
      status:'draft', provenanceRecordId:'p1', reviewerId:null, reviewedAt:null
    }]);
    expect(verifyTranslationBundle(bundle)).toBe(true);
    expect(() => createTranslationBundle('xx', '1', [])).toThrow('Unsupported source locale');
  });
});
