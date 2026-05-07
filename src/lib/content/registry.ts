import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadJsonFile } from './loaders.js';
import type { CanonicalContentItem } from './schema.js';

function findPackageRoot(startUrl: string): string {
  let dir = dirname(fileURLToPath(startUrl));

  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, 'package.json')) && existsSync(join(dir, 'content'))) {
      return dir;
    }
    dir = dirname(dir);
  }

  throw new Error('Unable to locate urai-content package root with package.json and content/.');
}

export const packageRoot = findPackageRoot(import.meta.url);
export const contentRoot = join(packageRoot, 'content');

const c = (p: string) => join(contentRoot, p);

export function createContentRegistry(rootDir = contentRoot) {
  const fromContentRoot = (p: string) => join(rootDir, p);

  return {
    home: loadJsonFile<CanonicalContentItem>(fromContentRoot('pages/home.json')),
    privacy: loadJsonFile<CanonicalContentItem>(fromContentRoot('pages/privacy.json')),
    weeklyScrolls: loadJsonFile<CanonicalContentItem[]>(fromContentRoot('demo/weekly-scrolls.json')),
    lifeMapEvents: loadJsonFile<CanonicalContentItem[]>(fromContentRoot('demo/life-map-events.json')),
    councilReflections: loadJsonFile<CanonicalContentItem[]>(fromContentRoot('demo/council-reflections.json')),
    memoryBlooms: loadJsonFile<CanonicalContentItem[]>(fromContentRoot('demo/memory-blooms.json')),
    narratorScripts: loadJsonFile<CanonicalContentItem[]>(fromContentRoot('demo/narrator-scripts.json')),
    sprites: loadJsonFile<CanonicalContentItem[]>(fromContentRoot('sprites/sprite-packs.json'))
  };
}

export const registry = createContentRegistry(c('.'));
