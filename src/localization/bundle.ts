import { createHash } from 'node:crypto';
import type { TranslationRecord } from './contracts.js';
import { isGovernedUraiLocale } from './uraiLocales.js';

export type TranslationBundle = {
  format: 'urai-translation-bundle';
  version: '1.0.0';
  sourceLocale: string;
  sourceVersion: string;
  records: TranslationRecord[];
  checksum: string;
};

function checksum(value: unknown): string {
  return 'sha256:' + createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function createTranslationBundle(
  sourceLocale: string,
  sourceVersion: string,
  records: TranslationRecord[],
): TranslationBundle {
  if (!isGovernedUraiLocale(sourceLocale)) throw new Error('Unsupported source locale');
  if (!sourceVersion) throw new Error('Translation bundle source version is required');
  for (const record of records) {
    if (!isGovernedUraiLocale(record.locale) || !isGovernedUraiLocale(record.sourceLocale)) {
      throw new Error('Translation bundle contains unsupported locale');
    }
    if (record.sourceLocale !== sourceLocale) throw new Error('Translation bundle source locale mismatch');
  }
  const sorted = [...records].sort((a,b) => (a.entityId + ':' + a.locale).localeCompare(b.entityId + ':' + b.locale));
  const payload = { format:'urai-translation-bundle' as const, version:'1.0.0' as const, sourceLocale, sourceVersion, records: sorted };
  return { ...payload, checksum: checksum(payload) };
}

export function verifyTranslationBundle(bundle: TranslationBundle): boolean {
  return createTranslationBundle(bundle.sourceLocale, bundle.sourceVersion, bundle.records).checksum === bundle.checksum;
}
