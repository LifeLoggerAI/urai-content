import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export function loadJsonFile<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

export function walkJsonFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const output: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) output.push(...walkJsonFiles(full));
    else if (entry.endsWith('.json')) output.push(full);
  }
  return output;
}
