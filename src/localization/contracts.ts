export type LocaleDirection = 'ltr' | 'rtl';
export type TranslationStatus = 'draft' | 'review' | 'approved';

export type LocaleRegistryEntry = {
  locale: string;
  label: string;
  direction: LocaleDirection;
  fallbackLocale: string | null;
  enabled: boolean;
};

export type TranslationRecord = {
  entityId: string;
  locale: string;
  sourceLocale: string;
  sourceVersion: string;
  sourceChecksum: string;
  translatedFields: Record<string, string>;
  status: TranslationStatus;
  provenanceRecordId: string;
  reviewerId: string | null;
  reviewedAt: string | null;
};

const localePattern = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const checksumPattern = /^sha256:[a-f0-9]{64}$/i;

export function validateLocaleRegistry(entries: LocaleRegistryEntry[]): LocaleRegistryEntry[] {
  const locales = new Set(entries.map((entry) => entry.locale));
  if (locales.size !== entries.length) throw new Error('Duplicate locale registry entry');

  for (const entry of entries) {
    if (!localePattern.test(entry.locale) || !entry.label.trim()) {
      throw new Error('Locale registry entry is invalid');
    }
    if (entry.fallbackLocale && !locales.has(entry.fallbackLocale)) {
      throw new Error('Locale fallback is not registered: ' + entry.fallbackLocale);
    }
    if (entry.fallbackLocale === entry.locale) throw new Error('Locale cannot fall back to itself');
  }

  return entries.map((entry) => ({ ...entry }));
}

export function validateTranslationRecord(record: TranslationRecord): TranslationRecord {
  if (!record.entityId || !localePattern.test(record.locale) || !localePattern.test(record.sourceLocale)) {
    throw new Error('Translation identity and locales are required');
  }
  if (!record.sourceVersion || !checksumPattern.test(record.sourceChecksum) || !record.provenanceRecordId) {
    throw new Error('Translation source version, checksum and provenance are required');
  }
  if (Object.keys(record.translatedFields).length === 0) {
    throw new Error('Translation requires at least one translated field');
  }
  if (record.status === 'approved' && (!record.reviewerId || !record.reviewedAt)) {
    throw new Error('Approved translation requires reviewer identity and timestamp');
  }
  return { ...record, translatedFields: { ...record.translatedFields } };
}

export function isTranslationStale(
  record: TranslationRecord,
  currentSourceVersion: string,
  currentSourceChecksum: string,
): boolean {
  return record.sourceVersion !== currentSourceVersion || record.sourceChecksum !== currentSourceChecksum;
}
