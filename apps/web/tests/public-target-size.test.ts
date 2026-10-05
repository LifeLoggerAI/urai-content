import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

describe('public interaction target sizes', () => {
  it('keeps compact public buttons at the 48px launch target', () => {
    const css = fs.readFileSync(path.join(repoRoot, 'src/app/globals.css'), 'utf8');
    expect(css).toMatch(/\.button\.compact\s*\{[\s\S]*?min-height:\s*48px;/);
    expect(css).not.toMatch(/\.button\.compact\s*\{[\s\S]*?min-height:\s*(?:40|44)px;/);
  });
});
