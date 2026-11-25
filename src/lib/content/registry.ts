import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadJsonFile } from './loaders.js';
import type { CanonicalContentItem } from './schema.js';

function findPackageRoot(startUrl: string): string {
  let dir = dirname(fileURLToPath(startUrl));
  while (!existsSync(join(dir, 'package.json'))) {
    const parent = dirname(dir);
    if (parent === dir) throw new Error('Unable to locate the urai-content package manifest');
    dir = parent;
  }
  return dir;
}

const contentRoot = join(findPackageRoot(import.meta.url), 'content');
const contentFile = (path: string) => join(contentRoot, path);

export const registry = {
  home: loadJsonFile<CanonicalContentItem>(contentFile('pages/home.json')),
  privacy: loadJsonFile<CanonicalContentItem>(contentFile('pages/privacy.json')),
  weeklyScrolls: loadJsonFile<CanonicalContentItem[]>(contentFile('demo/weekly-scrolls.json')),
  lifeMapEvents: loadJsonFile<CanonicalContentItem[]>(contentFile('demo/life-map-events.json')),
  councilReflections: loadJsonFile<CanonicalContentItem[]>(contentFile('demo/council-reflections.json')),
  sprites: loadJsonFile<CanonicalContentItem[]>(contentFile('sprites/sprite-packs.json'))
};
