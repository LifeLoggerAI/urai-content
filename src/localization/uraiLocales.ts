import type { LocaleRegistryEntry } from './contracts.js';

export const URAI_GOVERNED_LOCALES = [
  'en','zh-Hans','hi','es','fr','ar','bn','pt-BR','ru','ur','id','de','ja','sw','tr','vi','fil','ko','it','fa'
] as const;

export type UraiLocale = (typeof URAI_GOVERNED_LOCALES)[number];

const labels: Record<UraiLocale, string> = {
  en: 'English',
  'zh-Hans': 'Simplified Mandarin Chinese',
  hi: 'Hindi',
  es: 'Spanish',
  fr: 'French',
  ar: 'Modern Standard Arabic',
  bn: 'Bengali',
  'pt-BR': 'Brazilian Portuguese',
  ru: 'Russian',
  ur: 'Urdu',
  id: 'Indonesian',
  de: 'German',
  ja: 'Japanese',
  sw: 'Swahili',
  tr: 'Turkish',
  vi: 'Vietnamese',
  fil: 'Filipino / Tagalog',
  ko: 'Korean',
  it: 'Italian',
  fa: 'Persian / Farsi',
};

const rtl = new Set<UraiLocale>(['ar','ur','fa']);

export const uraiLocaleRegistry: LocaleRegistryEntry[] = URAI_GOVERNED_LOCALES.map((locale) => ({
  locale,
  label: labels[locale],
  direction: rtl.has(locale) ? 'rtl' : 'ltr',
  fallbackLocale: locale === 'en' ? null : 'en',
  enabled: locale === 'en',
}));

export function isGovernedUraiLocale(locale: string): locale is UraiLocale {
  return (URAI_GOVERNED_LOCALES as readonly string[]).includes(locale);
}

export function isProductionLocaleAdmitted(locale: string): boolean {
  const entry = uraiLocaleRegistry.find((candidate) => candidate.locale === locale);
  return Boolean(entry?.enabled);
}
