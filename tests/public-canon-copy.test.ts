import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const publicCanonFiles = [
  'src/seed/productionData.ts',
  'apps/web/src/lib/publicSeo.ts',
  'apps/web/src/lib/publicSiteContent.ts',
  'apps/web/src/app/demo/page.tsx'
];

describe('public URAI naming canon', () => {
  it('keeps retired public product names out of launch-facing copy', () => {
    for (const relativePath of publicCanonFiles) {
      const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(/\bEmotional OS\b/);
      expect(source, relativePath).not.toMatch(/\bCognitive Mirror\b/);
      expect(source, relativePath).not.toMatch(/\bcognitive mirrors\b/i);
    }
  });
});
