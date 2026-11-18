import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getCatalogSourceDescription, getCatalogSourceMode } from '../src/server/content/catalogSource';

describe('catalog source mode', () => {
  it('reports canonical JSON mode when Firebase Admin credentials are absent', () => {
    const originalProjectId = process.env.FIREBASE_PROJECT_ID;
    const originalClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const originalPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;

    try {
      expect(getCatalogSourceMode()).toBe('canonical-json');
      expect(getCatalogSourceDescription()).toContain('canonical JSON');
    } finally {
      if (originalProjectId !== undefined) process.env.FIREBASE_PROJECT_ID = originalProjectId;
      if (originalClientEmail !== undefined) process.env.FIREBASE_CLIENT_EMAIL = originalClientEmail;
      if (originalPrivateKey !== undefined) process.env.FIREBASE_PRIVATE_KEY = originalPrivateKey;
    }
  });
  it('reports embedded-snapshot when canonical files are absent', () => {
    const originalCwd = process.cwd();
    const workdir = mkdtempSync(join(tmpdir(), 'urai-content-source-mode-'));
    const keys = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'] as const;
    const saved = keys.map((key) => [key, process.env[key]] as const);
    try {
      for (const key of keys) delete process.env[key];
      process.chdir(workdir);
      expect(getCatalogSourceMode()).toBe('embedded-snapshot');
      expect(getCatalogSourceDescription()).toContain('embedded snapshot');
      expect(getCatalogSourceDescription()).toContain('not publication approval');
    } finally {
      process.chdir(originalCwd);
      for (const [key, value] of saved) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
      rmSync(workdir, { recursive: true, force: true });
    }
  });

});
