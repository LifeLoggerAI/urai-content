import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateContent } from '../src/lib/content/validate.js';

function setup(contentItems: unknown[]): string {
  const root = mkdtempSync(join(tmpdir(), 'urai-content-'));
  mkdirSync(join(root, 'content', 'seo'), { recursive: true });
  writeFileSync(join(root, 'content', 'data.json'), JSON.stringify(contentItems));
  writeFileSync(join(root, 'content', 'seo', 'metadata.json'), JSON.stringify({ siteTitle: 'x', description: 'y' }));
  writeFileSync(join(root, 'content', 'seo', 'sitemap-routes.json'), JSON.stringify(['/ok']));
  return root;
}

const validItem = { id: '1', title: 't', slug: '/ok', summary: 's', status: 'live', visibility: 'public', updatedAt: '2026-05-03T00:00:00.000Z', tags: [], relatedSystem: 'URAI Foundation', sections: [{ heading: 'h', body: 'b' }] };

describe('validator failures', () => {
  it('fails duplicate id', () => {
    const root = setup([validItem, { ...validItem, slug: '/ok2' }]);
    expect(() => validateContent({ rootDir: root })).toThrow(/Duplicate id/);
  });

  it('fails duplicate slug', () => {
    const root = setup([validItem, { ...validItem, id: '2' }]);
    expect(() => validateContent({ rootDir: root })).toThrow(/Duplicate slug/);
  });

  it('fails unsafe claim in public content', () => {
    const root = setup([{ ...validItem, summary: 'This is guaranteed.' }]);
    expect(() => validateContent({ rootDir: root })).toThrow(/Unsafe public claim/);
  });

  it('fails missing required field', () => {
    const root = setup([{ ...validItem, title: undefined }]);
    expect(() => validateContent({ rootDir: root })).toThrow();
  });

  it('fails broken asset path', () => {
    const root = setup([{ ...validItem, path: 'public/missing.png' }]);
    expect(() => validateContent({ rootDir: root })).toThrow(/Missing asset path/);
  });
});
