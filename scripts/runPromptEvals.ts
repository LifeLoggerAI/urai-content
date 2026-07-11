import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

interface Criterion {
  id: string;
  description: string;
  weight: number;
  pattern: string;
  minimum_matches?: number;
  critical?: boolean;
}
interface EvalCase {
  id: string;
  mode: string;
  title: string;
  prompt_input: string;