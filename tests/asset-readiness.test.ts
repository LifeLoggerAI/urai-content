import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { validateContent } from '../src/lib/content/validate.js';

describe('asset readiness admission', () => {
  let root: string;
  const item = {
    id: 'sprite-fixture', title: 'Test sprite', slug: 'sprite-fixture',
    summary: 'Test-only sprite record.', status: 'demo', visibility: 'public',
    updatedAt: '2026-05-03T00:00:00.000Z', tags: ['sprites'], relatedSystem: 'test'
  };

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'urai-content-assets-'));
    mkdirSync(join(root, 'content', 'seo'), { recursive: true });
    mkdirSync(join(root, 'public', 'sprites'), { recursive: true });
    writeFileSync(join(root, 'content', 'seo', 'metadata.json'), '{}');
    writeFileSync(join(root, 'content', 'seo', 'sitemap-routes.json'), '[]');
  });

  afterEach(() => rmSync(root, { recursive: true, force: true }));

  function record(value: object) {
    writeFileSync(join(root, 'content', 'asset.json'), JSON.stringify(value));
  }

  it('admits unavailable metadata without inventing an asset file', () => {
    record({ ...item, assetAvailability: 'unavailable' });
    expect(() => validateContent({ rootDir: root })).not.toThrow();
  });

  it('denies a deliverable path on an unavailable asset', () => {
    record({ ...item, assetAvailability: 'unavailable', path: 'public/sprites/test.png' });
    expect(() => validateContent({ rootDir: root })).toThrow('Unavailable assets must omit');
  });

  it('requires a path for a ready asset', () => {
    record({ ...item, assetAvailability: 'ready' });
    expect(() => validateContent({ rootDir: root })).toThrow('Ready assets require');
  });

  it('rejects a missing ready asset', () => {
    record({ ...item, assetAvailability: 'ready', path: 'public/sprites/test.png' });
    expect(() => validateContent({ rootDir: root })).toThrow('Missing asset path');
  });

  it('rejects a zero-byte asset even when availability is not declared', () => {
    writeFileSync(join(root, 'public', 'sprites', 'test.png'), '');
    record({ ...item, path: 'public/sprites/test.png' });
    expect(() => validateContent({ rootDir: root })).toThrow('nonempty file');
  });

  it('rejects a directory masquerading as an asset', () => {
    record({ ...item, assetAvailability: 'ready', path: 'public/sprites' });
    expect(() => validateContent({ rootDir: root })).toThrow('nonempty file');
  });

  it('admits a nonempty regular file without claiming format or visual quality', () => {
    writeFileSync(join(root, 'public', 'sprites', 'test.txt'), 'test-only bytes');
    record({ ...item, assetAvailability: 'ready', path: 'public/sprites/test.txt' });
    expect(() => validateContent({ rootDir: root })).not.toThrow();
  });

  it('validates zero-byte preview paths that were previously skipped', () => {
    writeFileSync(join(root, 'public', 'sprites', 'test.png'), '');
    record({ id: 'preview-fixture', spriteId: item.id, previewPath: 'public/sprites/test.png' });
    expect(() => validateContent({ rootDir: root })).toThrow('nonempty file');
  });

  it('admits unavailable preview metadata without a path', () => {
    record({ id: 'preview-fixture', spriteId: item.id, assetAvailability: 'unavailable' });
    expect(() => validateContent({ rootDir: root })).not.toThrow();
  });

  it('denies a deliverable path on an unavailable preview', () => {
    record({ id: 'preview-fixture', spriteId: item.id, assetAvailability: 'unavailable', previewPath: 'public/sprites/test.png' });
    expect(() => validateContent({ rootDir: root })).toThrow('Unavailable previews must omit');
  });

  it('requires a path for a ready preview', () => {
    record({ id: 'preview-fixture', spriteId: item.id, assetAvailability: 'ready' });
    expect(() => validateContent({ rootDir: root })).toThrow('Ready previews require');
  });

  it('admits a nonempty preview file', () => {
    writeFileSync(join(root, 'public', 'sprites', 'test.txt'), 'test-only preview bytes');
    record({ id: 'preview-fixture', spriteId: item.id, assetAvailability: 'ready', previewPath: 'public/sprites/test.txt' });
    expect(() => validateContent({ rootDir: root })).not.toThrow();
  });
});
