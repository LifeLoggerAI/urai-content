import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';

const root = resolve(process.cwd());
const failures: string[] = [];
const requiredFiles = [
  'prompts/VERSION',
  'prompts/README.md',
  'prompts/autonomous-research-agent-master-prompt.md',
  'prompts/PARITY.md',
  'prompts/SYNC.md',
  'prompts/GOVERNANCE.md',
  'prompts/USAGE.md',
  'prompts/CHANGELOG.md',
  'prompts/parity-manifest.json',
  'prompts/evals/README.md',
  'prompts/evals/cases.json'
];

const read = (path: string) => readFileSync(join(root, path), 'utf8');
for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) failures.push(`Missing required prompt-library file: ${file}`);
}

function compilePattern(sourcePattern: string): void {
  let pattern = sourcePattern;
  let flags = 'u';
  const inlineFlags = pattern.match(/^\(\?([im]+)\)/);
  if (inlineFlags) {
    pattern = pattern.slice(inlineFlags[0].length);
    flags += inlineFlags[1];
  }
  new RegExp(pattern, flags);
}

if (failures.length === 0) {
  const version = read('prompts/VERSION').trim();
  const prompt = read('prompts/autonomous-research-agent-master-prompt.md');
  const readme = read('prompts/README.md');
  const changelog = read('prompts/CHANGELOG.md');
  const manifest = JSON.parse(read('prompts/parity-manifest.json')) as {
    version: string;
    source_sha256: string;
    required_sections: string[];
    anchors: Array<{ section: string; text: string }>;
  };
  if (!prompt.includes(`version: ${version}`)) failures.push(`Prompt frontmatter version does not match prompts/VERSION (${version}).`);
  if (!readme.includes(`Version:** \`${version}\``)) failures.push(`prompts/README.md does not advertise version ${version}.`);
  if (!changelog.includes(`## [${version}]`)) failures.push(`prompts/CHANGELOG.md has no ${version} release heading.`);
  if (manifest.version !== version) failures.push(`Parity manifest version ${manifest.version} does not match ${version}.`);
  if (!prompt.includes(`source_sha256: ${manifest.source_sha256}`)) failures.push('Prompt frontmatter source_sha256 does not match the parity manifest.');

  for (const section of manifest.required_sections) {
    const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const heading = new RegExp(`^#{2,4}\\s+${escaped}\\s*$`, 'm');
    if (!heading.test(prompt)) failures.push(`Prompt is missing required section heading: ${section}`);
  }
  for (const anchor of manifest.anchors) {
    if (!prompt.includes(anchor.text)) failures.push(`Prompt section ${anchor.section} is missing parity anchor: ${anchor.text}`);
  }

  const suite = JSON.parse(read('prompts/evals/cases.json')) as {
    suite_version: string;
    prompt_version: string;
    prohibited_patterns: Array<{ id: string; pattern: string }>;
    cases: Array<{ id: string; fixture: string; criteria: Array<{ weight: number; pattern: string }> }>;
    negative_fixtures: Array<{ case_id: string; fixture: string }>;
  };
  if (suite.prompt_version !== version) failures.push(`Evaluation suite prompt_version ${suite.prompt_version} does not match ${version}.`);
  const ids = new Set<string>();
  for (const testCase of suite.cases) {
    if (ids.has(testCase.id)) failures.push(`Duplicate evaluation case id: ${testCase.id}`);
    ids.add(testCase.id);
    const weight = testCase.criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
    if (weight !== 100) failures.push(`Evaluation case ${testCase.id} weights total ${weight}, expected 100.`);
    const fixturePath = join(root, 'prompts/evals', testCase.fixture);
    if (!existsSync(fixturePath)) failures.push(`Missing passing fixture for ${testCase.id}: ${testCase.fixture}`);
    for (const criterion of testCase.criteria) {
      try { compilePattern(criterion.pattern); } catch (error) { failures.push(`Invalid criterion regex in ${testCase.id}: ${String(error)}`); }
    }
  }
  for (const rule of suite.prohibited_patterns) {
    try { compilePattern(rule.pattern); } catch (error) { failures.push(`Invalid prohibited regex ${rule.id}: ${String(error)}`); }
  }
  for (const negative of suite.negative_fixtures) {
    if (!ids.has(negative.case_id)) failures.push(`Negative fixture references unknown case: ${negative.case_id}`);
    const fixturePath = join(root, 'prompts/evals', negative.fixture);
    if (!existsSync(fixturePath)) failures.push(`Missing negative fixture: ${negative.fixture}`);
  }
}

const markdownFiles = requiredFiles.filter((file) => extname(file) === '.md');
const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
for (const file of markdownFiles) {
  if (!existsSync(join(root, file))) continue;
  const content = read(file);
  for (const match of content.matchAll(linkPattern)) {
    const target = match[1].trim().replace(/^<|>$/g, '');
    if (!target || target.startsWith('#') || /^[a-z]+:/i.test(target)) continue;
    const clean = target.split('#')[0].split('?')[0];
    const resolved = clean.startsWith('/') ? resolve(root, clean.slice(1)) : resolve(root, dirname(file), clean);
    const fromRoot = relative(root, resolved);
    if (fromRoot === '..' || fromRoot.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`)) failures.push(`${file} links outside the repository: ${target}`);
    else if (!existsSync(resolved)) failures.push(`${file} has a broken local link: ${target}`);
  }
}

if (failures.length > 0) {
  console.error('Prompt library validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Prompt library validation passed: parity, sections, versions, safety rules, eval schema, fixtures, and local links are consistent.');
