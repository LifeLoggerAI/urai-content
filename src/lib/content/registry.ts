import { join } from 'node:path';
import { loadJsonFile } from './loaders.js';
import type { CanonicalContentItem } from './schema.js';

const c = (p: string) => join(process.cwd(), 'content', p);

export const registry = {
  home: loadJsonFile<CanonicalContentItem>(c('pages/home.json')),
  privacy: loadJsonFile<CanonicalContentItem>(c('pages/privacy.json')),
  weeklyScrolls: loadJsonFile<CanonicalContentItem[]>(c('demo/weekly-scrolls.json')),
  lifeMapEvents: loadJsonFile<CanonicalContentItem[]>(c('demo/life-map-events.json')),
  councilReflections: loadJsonFile<CanonicalContentItem[]>(c('demo/council-reflections.json')),
  sprites: loadJsonFile<CanonicalContentItem[]>(c('sprites/sprite-packs.json'))
};
