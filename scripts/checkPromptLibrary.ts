import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
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
const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const validSha256 = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);

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

function safeRepositoryPath(path: string): boolean {
  if (!path || path.startsWith('/') || path.includes('\\')) return false;
  const resolved = resolve(root, path);
  const fromRoot = relative(root, resolved);
  return fromRoot !== '..' && !fromRoot.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`);
}

type SourcePart = { path: string; sha256: string };
type ParityManifest = {
  version: string;
  source: string;
  source_document_id: string;
  source_revision_id: string;
  source_export_format: string;
  source_snapshot_normalization: string;
  source_snapshot_sha256: string;
  source_snapshot_full_text_sha256: string;
  legacy_self_reported_source_sha256: string;
  source_snapshot_parts: SourcePart[];
  required_sections: string[];
  anchors: Array<{ section: string; text: string }>;
};

let parityReport: Record<string, unknown> | null = null;

if (failures.length === 0) {
  const version = read('prompts/VERSION').trim();
  const prompt = read('prompts/autonomous-research-agent-master-prompt.md');
  const readme = read('prompts/README.md');
  const parity = read('prompts/PARITY.md');
  const changelog = read('prompts/CHANGELOG.md');
  const manifest = JSON.parse(read('prompts/parity-manifest.json')) as ParityManifest;

  if (manifest.version !== version) failures.push(`Parity manifest version ${manifest.version} does not match ${version}.`);
  if (!manifest.source_document_id || !/^[A-Za-z0-9_-]+$/.test(manifest.source_document_id)) {
    failures.push('Parity manifest lacks a valid Google Doc document ID.');
  }
  if (!manifest.source_revision_id || manifest.source_revision_id.length < 20) {
    failures.push('Parity manifest lacks an exact Google Doc revision ID.');
  }
  if (manifest.source_export_format !== 'text/plain') {
    failures.push('Parity source export format must be text/plain.');
  }
  for (const [field, value] of [
    ['source_snapshot_sha256', manifest.source_snapshot_sha256],
    ['source_snapshot_full_text_sha256', manifest.source_snapshot_full_text_sha256],
    ['legacy_self_reported_source_sha256', manifest.legacy_self_reported_source_sha256]
  ] as const) {
    if (!validSha256(value)) failures.push(`Parity manifest ${field} is not a lowercase SHA-256.`);
  }

  if (!Array.isArray(manifest.source_snapshot_parts) || manifest.source_snapshot_parts.length < 1) {
    failures.push('Parity manifest must enumerate source snapshot parts.');
  } else {
    const seen = new Set<string>();
    const buffers: Buffer[] = [];
    for (const [index, part] of manifest.source_snapshot_parts.entries()) {
      if (!part || typeof part.path !== 'string' || !safeRepositoryPath(part.path)) {
        failures.push(`Source snapshot part ${index} has an unsafe path.`);
        continue;
      }
      if (seen.has(part.path)) failures.push(`Duplicate source snapshot part: ${part.path}`);
      seen.add(part.path);
      if (!validSha256(part.sha256)) failures.push(`Source snapshot part ${part.path} has an invalid SHA-256.`);
      const absolute = join(root, part.path);
      if (!existsSync(absolute)) {
        failures.push(`Missing source snapshot part: ${part.path}`);
        continue;
      }
      const bytes = readFileSync(absolute);
      const actualPartHash = sha256(bytes);
      if (actualPartHash !== part.sha256) {
        failures.push(`Source snapshot part hash mismatch for ${part.path}: ${actualPartHash}`);
      }
      buffers.push(bytes);
    }

    if (buffers.length === manifest.source_snapshot_parts.length) {
      const exactText = Buffer.concat(buffers).toString('utf8');
      const normalized = exactText.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
      const fullTextHash = sha256(normalized);
      const canonical = normalized
        .split('\n')
        .filter((line) => !line.startsWith('Source export SHA-256:'))
        .join('\n');
      const canonicalHash = sha256(canonical);

      if (fullTextHash !== manifest.source_snapshot_full_text_sha256) {
        failures.push(`Full source snapshot hash mismatch: ${fullTextHash}`);
      }
      if (canonicalHash !== manifest.source_snapshot_sha256) {
        failures.push(`Canonical source snapshot hash mismatch: ${canonicalHash}`);
      }
      if (!manifest.source_snapshot_normalization.includes("exclude only lines beginning with 'Source export SHA-256:'")) {
        failures.push('Parity manifest does not document the self-reference exclusion rule.');
      }
      if (!parity.includes(manifest.source_revision_id)) {
        failures.push('PARITY.md does not identify the exact Google Doc revision.');
      }
      if (!parity.includes(canonicalHash)) {
        failures.push('PARITY.md does not identify the computed canonical source hash.');
      }

      const legacyPromptHash = prompt.match(/^source_sha256:\s*([0-9a-f]{64})\s*$/m)?.[1];
      if (legacyPromptHash !== manifest.legacy_self_reported_source_sha256) {
        failures.push('Prompt legacy source_sha256 metadata differs from the explicitly non-authoritative legacy value.');
      }

      parityReport = {
        schemaVersion: '1.0.0',
        version,
        sourceDocumentId: manifest.source_document_id,
        sourceRevisionId: manifest.source_revision_id,
        sourceExportFormat: manifest.source_export_format,
        snapshotParts: manifest.source_snapshot_parts,
        normalizedFullTextSha256: fullTextHash,
        canonicalSourceSha256: canonicalHash,
        legacyPromptSourceSha256: legacyPromptHash,
        legacyPromptHashAuthoritative: false,
        selfReferenceExclusion: 'lines beginning with Source export SHA-256:',
        status: failures.length === 0 ? 'verified' : 'failed'
      };
    }
  }

  if (!prompt.includes(`version: ${version}`)) failures.push(`Prompt frontmatter version does not match prompts/VERSION (${version}).`);
  if (!readme.includes(`Version:** \`${version}\``)) failures.push(`prompts/README.md does not advertise version ${version}.`);
  if (!changelog.includes(`## [${version}]`)) failures.push(`prompts/CHANGELOG.md has no ${version} release heading.`);

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

if (parityReport) {
  parityReport.status = failures.length === 0 ? 'verified' : 'failed';
  parityReport.failures = failures;
  writeFileSync('prompt-parity-report.json', JSON.stringify(parityReport, null, 2) + '\n');
}

if (failures.length > 0) {
  console.error('Prompt library validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Prompt library validation passed: immutable source bytes, exact Drive revision, semantic anchors, versions, safety rules, eval schema, fixtures, and local links are consistent.');
