import { describe, expect, it } from 'vitest';
import {
  assetManifests,
  consentRecords,
  contentLicenses,
  contentPacks,
  exportJobs,
  provenanceRecords,
  seoPages
} from '../src/seed/productionData.js';
import {
  assetManifestSchema,
  consentRecordSchema,
  contentLicenseSchema,
  contentPackSchema,
  exportJobSchema,
  provenanceRecordSchema,
  seoPageSchema
} from '../src/schemas/production.js';

describe('production domain seed data', () => {
  it('validates provenance and consent records', () => {
    const provenance = provenanceRecords.map((record) => provenanceRecordSchema.parse(record));
    const consents = consentRecords.map((record) => consentRecordSchema.parse(record));

    expect(provenance.length).toBeGreaterThanOrEqual(3);
    expect(consents.every((record) => record.policyVersion.length > 0)).toBe(true);
  });

  it('validates asset manifests and content packs', () => {
    const manifests = assetManifests.map((manifest) => assetManifestSchema.parse(manifest));
    const packs = contentPacks.map((pack) => contentPackSchema.parse(pack));

    expect(manifests.every((manifest) => manifest.assets.length > 0)).toBe(true);
    expect(packs.map((pack) => pack.slug)).toContain('memory-weather-pack');
    expect(packs.some((pack) => pack.tierVisibility.includes('licensingPartner'))).toBe(true);
  });

  it('validates licenses and export jobs', () => {
    const licenses = contentLicenses.map((license) => contentLicenseSchema.parse(license));
    const jobs = exportJobs.map((job) => exportJobSchema.parse(job));

    expect(licenses.some((license) => license.scope === 'studioCampaign')).toBe(true);
    expect(jobs.map((job) => job.type)).toContain('srtCaptions');
    expect(jobs.some((job) => job.status === 'failed' && job.errorMessage)).toBe(true);
  });

  it('validates SEO pages for standalone domain readiness', () => {
    const pages = seoPages.map((page) => seoPageSchema.parse(page));

    expect(pages.map((page) => page.path)).toContain('/');
    expect(pages.every((page) => page.canonicalUrl.startsWith('https://www.uraicontent.com'))).toBe(true);
    expect(pages.find((page) => page.path === '/admin')?.noIndex).toBe(true);
  });
});
