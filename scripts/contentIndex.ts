import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { contentRoot, registry } from '../src/lib/content/registry.js';

const items = [
  registry.home,
  registry.privacy,
  ...registry.weeklyScrolls,
  ...registry.lifeMapEvents,
  ...registry.councilReflections,
  ...registry.memoryBlooms,
  ...registry.narratorScripts,
  ...registry.sprites
].sort((a, b) => a.slug.localeCompare(b.slug));

const latest = items.map((item) => item.updatedAt).sort().at(-1) ?? '1970-01-01T00:00:00.000Z';
const output = {
  generatedAt: latest,
  count: items.length,
  routes: items.map((item) => item.slug)
};
writeFileSync(join(contentRoot, 'generated-index.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log('Generated content index.');
