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
  writeFileSync(join(root, 'content', 'seo', 'open-graph.json'), JSON.stringify({ defaultTitle: 'x', defaultDescription: 'y', image: '/og/card.svg' }));
  mkdirSync(join(root, 'public', 'og'), { recursive: true });
  writeFileSync(join(root, 'public', 'og', 'card.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
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
    const root = setup([{ ...validItem, path: 'public/missing.svg' }]);
    expect(() => validateContent({ rootDir: root })).toThrow(/Missing asset path/);
  });

  it('fails empty asset files', () => {
    const root = setup([{ ...validItem, path: 'public/empty.svg' }]);
    mkdirSync(join(root, 'public'), { recursive: true });
    writeFileSync(join(root, 'public', 'empty.svg'), '');
    expect(() => validateContent({ rootDir: root })).toThrow(/Asset file is empty/);
  });

  it('fails invalid svg assets', () => {
    const root = setup([{ ...validItem, path: 'public/not-svg.svg' }]);
    mkdirSync(join(root, 'public'), { recursive: true });
    writeFileSync(join(root, 'public', 'not-svg.svg'), 'not svg');
    expect(() => validateContent({ rootDir: root })).toThrow(/not a valid SVG/);
  });

  it('fails sprite preview references to unknown sprite ids', () => {
    const root = setup([validItem]);
    mkdirSync(join(root, 'content', 'sprites'), { recursive: true });
    mkdirSync(join(root, 'public', 'sprites', 'previews'), { recursive: true });
    writeFileSync(join(root, 'public', 'sprites', 'previews', 'preview.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    writeFileSync(join(root, 'content', 'sprites', 'sprites-previews.json'), JSON.stringify([{ id: 'preview-1', spriteId: 'missing', previewPath: 'public/sprites/previews/preview.svg' }]));
    expect(() => validateContent({ rootDir: root })).toThrow(/unknown spriteId/);
  });

  it('fails missing open graph assets', () => {
    const root = setup([validItem]);
    writeFileSync(join(root, 'content', 'seo', 'open-graph.json'), JSON.stringify({ defaultTitle: 'x', defaultDescription: 'y', image: '/og/missing.svg' }));
    expect(() => validateContent({ rootDir: root })).toThrow(/Missing asset path/);
  });
});
