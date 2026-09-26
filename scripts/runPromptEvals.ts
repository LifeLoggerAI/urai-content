import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
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
  fixture: string;
  criteria: Criterion[];
  manual_checks: string[];
}

interface ProhibitedPattern {
  id: string;
  description: string;
  pattern: string;
}

interface NegativeFixture {
  case_id: string;
  fixture: string;
  expected: 'fail';
  expected_critical_failures?: string[];
  expected_prohibited_failures?: string[];
}

interface Suite {
  suite_version: string;
  prompt_version: string;
  pass_threshold: number;
  prohibited_patterns: ProhibitedPattern[];
  cases: EvalCase[];
  negative_fixtures: NegativeFixture[];
}

interface ManualCheckAttestation {
  check: string;
  status: 'pass';
  reviewer: string;
  reviewed_at: string;
  evidence: string;
}

interface CaseEvidence {
  output_file: string;
  output_sha256: string;
  generated_at: string;
  manual_checks: ManualCheckAttestation[];
}

interface ReleaseEvidenceManifest {
  schema_version: 'urai-content-prompt-eval-evidence-1';
  candidate_commit_sha: string;
  prompt_version: string;
  prompt_sha256: string;
  provider: string;
  model: string;
  runtime: string;
  generator: string;
  generated_at: string;
  cases: Record<string, CaseEvidence>;
}

const SHA40_PATTERN = /^[0-9a-f]{40}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const MANIFEST_FILENAME = 'prompt-eval-evidence.json';
const PROMPT_PATH = 'prompts/autonomous-research-agent-master-prompt.md';

const root = process.cwd();
const suitePath = join(root, 'prompts/evals/cases.json');
const suite = JSON.parse(readFileSync(suitePath, 'utf8')) as Suite;
const args = process.argv.slice(2);
const fixtureMode = args.includes('--fixtures');
const outputsIndex = args.indexOf('--outputs');
const outputsDir = outputsIndex >= 0 ? resolve(args[outputsIndex + 1] ?? '') : null;

if (!fixtureMode && !outputsDir) {
  console.error('Usage: npm run eval:prompts -- --outputs <directory>  OR  npm run test:prompt-evals');
  process.exit(2);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validTimestamp(value: unknown): value is string {
  return nonEmptyString(value) && Number.isFinite(Date.parse(value));
}

function sha256File(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function currentCommitSha(): string {
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
  if (!SHA40_PATTERN.test(sha)) throw new Error(`git HEAD is not a full lowercase commit SHA: ${sha}`);
  return sha;
}

function countMatches(sourcePattern: string, text: string): number {
  let pattern = sourcePattern;
  let flags = 'gu';
  const inlineFlags = pattern.match(/^\(\?([im]+)\)/);
  if (inlineFlags) {
    pattern = pattern.slice(inlineFlags[0].length);
    if (inlineFlags[1].includes('i')) flags += 'i';
    if (inlineFlags[1].includes('m')) flags += 'm';
  }
  return [...text.matchAll(new RegExp(pattern, flags))].length;
}

function evaluate(testCase: EvalCase, text: string) {
  let score = 0;
  const results = testCase.criteria.map((criterion) => {
    const matches = countMatches(criterion.pattern, text);
    const passed = matches >= (criterion.minimum_matches ?? 1);
    if (passed) score += criterion.weight;
    return { ...criterion, matches, passed };
  });

  const criticalFailures = results
    .filter((result) => result.critical && !result.passed)
    .map((result) => result.id);

  const prohibitedFailures = suite.prohibited_patterns
    .map((rule) => ({ ...rule, matches: countMatches(rule.pattern, text) }))
    .filter((rule) => rule.matches > 0);

  return {
    case_id: testCase.id,
    score,
    threshold: suite.pass_threshold,
    automated_pass:
      score >= suite.pass_threshold &&
      criticalFailures.length === 0 &&
      prohibitedFailures.length === 0,
    critical_failures: criticalFailures,
    prohibited_failures: prohibitedFailures,
    criteria: results,
    manual_checks_required: testCase.manual_checks
  };
}

function sortedUnique(ids: string[] | undefined): string[] {
  return [...new Set(ids ?? [])].sort();
}

function compareExact(expected: string[] | undefined, actual: string[]) {
  const expectedIds = sortedUnique(expected);
  const actualIds = sortedUnique(actual);
  const missing = expectedIds.filter((id) => !actualIds.includes(id));
  const unexpected = actualIds.filter((id) => !expectedIds.includes(id));
  return { missing, unexpected, equal: missing.length === 0 && unexpected.length === 0 };
}

function validateEvidenceManifest(
  candidate: unknown,
  outputDirectory: string,
  expectedCommitSha: string,
  expectedPromptSha256: string
): { manifest: ReleaseEvidenceManifest | null; failures: string[] } {
  const failures: string[] = [];
  if (!isObject(candidate)) {
    return { manifest: null, failures: [`${MANIFEST_FILENAME} must contain a JSON object`] };
  }

  const manifest = candidate as unknown as ReleaseEvidenceManifest;
  if (manifest.schema_version !== 'urai-content-prompt-eval-evidence-1') {
    failures.push('schema_version must equal urai-content-prompt-eval-evidence-1');
  }
  if (!SHA40_PATTERN.test(String(manifest.candidate_commit_sha ?? ''))) {
    failures.push('candidate_commit_sha must be a full lowercase 40-character SHA');
  } else if (manifest.candidate_commit_sha !== expectedCommitSha) {
    failures.push(`candidate_commit_sha must equal checked-out HEAD ${expectedCommitSha}`);
  }
  if (manifest.prompt_version !== suite.prompt_version) {
    failures.push(`prompt_version must equal suite prompt version ${suite.prompt_version}`);
  }
  if (!SHA256_PATTERN.test(String(manifest.prompt_sha256 ?? ''))) {
    failures.push('prompt_sha256 must be a lowercase SHA-256 value');
  } else if (manifest.prompt_sha256 !== expectedPromptSha256) {
    failures.push('prompt_sha256 does not match the checked-out authoritative prompt');
  }

  for (const field of ['provider', 'model', 'runtime', 'generator'] as const) {
    if (!nonEmptyString(manifest[field])) failures.push(`${field} is required`);
  }
  if (!validTimestamp(manifest.generated_at)) failures.push('generated_at must be a valid timestamp');

  if (!isObject(manifest.cases)) {
    failures.push('cases must be an object keyed by every evaluation case ID');
    return { manifest, failures };
  }

  const expectedCaseIds = suite.cases.map((testCase) => testCase.id).sort();
  const actualCaseIds = Object.keys(manifest.cases).sort();
  for (const id of expectedCaseIds.filter((id) => !actualCaseIds.includes(id))) {
    failures.push(`cases is missing ${id}`);
  }
  for (const id of actualCaseIds.filter((id) => !expectedCaseIds.includes(id))) {
    failures.push(`cases contains unexpected case ${id}`);
  }

  for (const testCase of suite.cases) {
    const evidence = manifest.cases[testCase.id];
    const prefix = `cases.${testCase.id}`;
    if (!isObject(evidence)) {
      failures.push(`${prefix} must be an object`);
      continue;
    }

    const expectedFilename = `${testCase.id}.md`;
    if (evidence.output_file !== expectedFilename) {
      failures.push(`${prefix}.output_file must equal ${expectedFilename}`);
    }
    const outputPath = join(outputDirectory, expectedFilename);
    if (!existsSync(outputPath)) {
      failures.push(`${prefix}.output_file is missing at ${outputPath}`);
    } else if (!SHA256_PATTERN.test(String(evidence.output_sha256 ?? ''))) {
      failures.push(`${prefix}.output_sha256 must be a lowercase SHA-256 value`);
    } else {
      const actualDigest = sha256File(outputPath);
      if (evidence.output_sha256 !== actualDigest) {
        failures.push(`${prefix}.output_sha256 does not match ${expectedFilename}`);
      }
    }
    if (!validTimestamp(evidence.generated_at)) {
      failures.push(`${prefix}.generated_at must be a valid timestamp`);
    }
    if (!Array.isArray(evidence.manual_checks)) {
      failures.push(`${prefix}.manual_checks must attest every declared manual check`);
      continue;
    }

    const expectedChecks = [...testCase.manual_checks].sort();
    const actualChecks = evidence.manual_checks
      .map((attestation) => isObject(attestation) ? String(attestation.check ?? '') : '')
      .sort();
    const checkComparison = compareExact(expectedChecks, actualChecks);
    for (const check of checkComparison.missing) {
      failures.push(`${prefix}.manual_checks is missing exact check: ${check}`);
    }
    for (const check of checkComparison.unexpected) {
      failures.push(`${prefix}.manual_checks contains unexpected or duplicate check: ${check}`);
    }

    const seen = new Set<string>();
    for (const [index, attestation] of evidence.manual_checks.entries()) {
      const attestationPrefix = `${prefix}.manual_checks[${index}]`;
      if (!isObject(attestation)) {
        failures.push(`${attestationPrefix} must be an object`);
        continue;
      }
      const check = String(attestation.check ?? '');
      if (seen.has(check)) failures.push(`${attestationPrefix}.check duplicates ${check}`);
      seen.add(check);
      if (attestation.status !== 'pass') failures.push(`${attestationPrefix}.status must equal pass`);
      if (!nonEmptyString(attestation.reviewer)) failures.push(`${attestationPrefix}.reviewer is required`);
      if (
        nonEmptyString(attestation.reviewer) &&
        nonEmptyString(manifest.generator) &&
        attestation.reviewer.trim().toLowerCase() === manifest.generator.trim().toLowerCase()
      ) {
        failures.push(`${attestationPrefix}.reviewer must differ from generator`);
      }
      if (!validTimestamp(attestation.reviewed_at)) {
        failures.push(`${attestationPrefix}.reviewed_at must be a valid timestamp`);
      }
      if (!nonEmptyString(attestation.evidence)) failures.push(`${attestationPrefix}.evidence is required`);
    }
  }

  return { manifest, failures };
}

function runEvidenceContractSelfTest(): void {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'urai-prompt-evidence-'));
  try {
    const head = currentCommitSha();
    const promptDigest = sha256File(join(root, PROMPT_PATH));
    const cases: Record<string, CaseEvidence> = {};

    for (const testCase of suite.cases) {
      const outputFile = `${testCase.id}.md`;
      const outputPath = join(temporaryDirectory, outputFile);
      copyFileSync(join(root, 'prompts/evals', testCase.fixture), outputPath);
      cases[testCase.id] = {
        output_file: outputFile,
        output_sha256: sha256File(outputPath),
        generated_at: '2026-07-11T16:00:00.000Z',
        manual_checks: testCase.manual_checks.map((check) => ({
          check,
          status: 'pass',
          reviewer: 'independent-reviewer',
          reviewed_at: '2026-07-11T16:30:00.000Z',
          evidence: `Reviewed against source inventory for ${testCase.id}`
        }))
      };
    }

    const valid: ReleaseEvidenceManifest = {
      schema_version: 'urai-content-prompt-eval-evidence-1',
      candidate_commit_sha: head,
      prompt_version: suite.prompt_version,
      prompt_sha256: promptDigest,
      provider: 'self-test-provider',
      model: 'self-test-model',
      runtime: 'self-test-runtime',
      generator: 'self-test-generator',
      generated_at: '2026-07-11T16:00:00.000Z',
      cases
    };

    const validResult = validateEvidenceManifest(valid, temporaryDirectory, head, promptDigest);
    if (validResult.failures.length > 0) {
      throw new Error(`valid release evidence fixture failed: ${validResult.failures.join('; ')}`);
    }

    function expectRejected(name: string, mutate: (manifest: ReleaseEvidenceManifest) => void, expected: string) {
      const candidate = JSON.parse(JSON.stringify(valid)) as ReleaseEvidenceManifest;
      mutate(candidate);
      const result = validateEvidenceManifest(candidate, temporaryDirectory, head, promptDigest);
      if (!result.failures.some((failure) => failure.includes(expected))) {
        throw new Error(`${name} did not fail with expected evidence error: ${expected}`);
      }
    }

    expectRejected('stale prompt digest', (manifest) => {
      manifest.prompt_sha256 = '0'.repeat(64);
    }, 'prompt_sha256 does not match');
    expectRejected('stale candidate commit', (manifest) => {
      manifest.candidate_commit_sha = '0'.repeat(40);
    }, 'candidate_commit_sha must equal');
    expectRejected('failed manual check', (manifest) => {
      (manifest.cases[suite.cases[0].id].manual_checks[0] as { status: string }).status = 'fail';
    }, 'status must equal pass');
    expectRejected('self review', (manifest) => {
      manifest.cases[suite.cases[0].id].manual_checks[0].reviewer = manifest.generator;
    }, 'reviewer must differ from generator');
    expectRejected('tampered output digest', (manifest) => {
      manifest.cases[suite.cases[0].id].output_sha256 = '0'.repeat(64);
    }, 'output_sha256 does not match');
    expectRejected('missing case evidence', (manifest) => {
      delete manifest.cases[suite.cases[0].id];
    }, `cases is missing ${suite.cases[0].id}`);

    console.log('[PASS] live prompt release-evidence contract self-test');
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

const reports: ReturnType<typeof evaluate>[] = [];
let failures = 0;
let evidenceManifest: ReleaseEvidenceManifest | null = null;
let evidenceFailures: string[] = [];

if (!fixtureMode) {
  const evidencePath = join(outputsDir!, MANIFEST_FILENAME);
  if (!existsSync(evidencePath)) {
    evidenceFailures.push(`Missing live release evidence manifest: ${evidencePath}`);
  } else {
    try {
      const candidate = JSON.parse(readFileSync(evidencePath, 'utf8')) as unknown;
      const result = validateEvidenceManifest(
        candidate,
        outputsDir!,
        currentCommitSha(),
        sha256File(join(root, PROMPT_PATH))
      );
      evidenceManifest = result.manifest;
      evidenceFailures = result.failures;
    } catch (error) {
      evidenceFailures.push(`Unable to validate ${MANIFEST_FILENAME}: ${String(error)}`);
    }
  }
  if (evidenceFailures.length > 0) {
    failures += 1;
    console.log('FAIL live release evidence contract');
    for (const failure of evidenceFailures) console.log(`  evidence: ${failure}`);
  } else {
    console.log('PASS live release evidence contract');
  }
}

for (const testCase of suite.cases) {
  const path = fixtureMode
    ? join(root, 'prompts/evals', testCase.fixture)
    : join(outputsDir!, `${testCase.id}.md`);

  if (!existsSync(path)) {
    console.error(`Missing evaluation output: ${path}`);
    failures += 1;
    continue;
  }

  const report = evaluate(testCase, readFileSync(path, 'utf8'));
  reports.push(report);
  if (!report.automated_pass) failures += 1;
  console.log(`${report.automated_pass ? 'PASS' : 'FAIL'} ${testCase.id}: ${report.score}/100`);
  if (report.critical_failures.length) {
    console.log(`  critical: ${report.critical_failures.join(', ')}`);
  }
  if (report.prohibited_failures.length) {
    console.log(`  prohibited: ${report.prohibited_failures.map((rule) => rule.id).join(', ')}`);
  }
}

if (fixtureMode) {
  for (const negative of suite.negative_fixtures) {
    const testCase = suite.cases.find((candidate) => candidate.id === negative.case_id);
    if (!testCase) throw new Error(`Unknown negative fixture case: ${negative.case_id}`);

    const path = join(root, 'prompts/evals', negative.fixture);
    const report = evaluate(testCase, readFileSync(path, 'utf8'));
    const prohibitedIds = report.prohibited_failures.map((rule) => rule.id);
    const criticalComparison = compareExact(
      negative.expected_critical_failures,
      report.critical_failures
    );
    const prohibitedComparison = compareExact(
      negative.expected_prohibited_failures,
      prohibitedIds
    );
    const correctlyFailed =
      !report.automated_pass &&
      criticalComparison.equal &&
      prohibitedComparison.equal;

    console.log(`${correctlyFailed ? 'PASS' : 'FAIL'} negative fixture ${basename(path)} rejected`);
    if (criticalComparison.missing.length) {
      console.log(`  missing critical assertions: ${criticalComparison.missing.join(', ')}`);
    }
    if (criticalComparison.unexpected.length) {
      console.log(`  unexpected critical assertions: ${criticalComparison.unexpected.join(', ')}`);
    }
    if (prohibitedComparison.missing.length) {
      console.log(`  missing prohibited assertions: ${prohibitedComparison.missing.join(', ')}`);
    }
    if (prohibitedComparison.unexpected.length) {
      console.log(`  unexpected prohibited assertions: ${prohibitedComparison.unexpected.join(', ')}`);
    }
    if (!correctlyFailed) failures += 1;
  }

  try {
    runEvidenceContractSelfTest();
  } catch (error) {
    failures += 1;
    console.error(`FAIL live release-evidence contract self-test: ${String(error)}`);
  }
}

const evidenceClass = fixtureMode ? 'fixture_regression' : 'live_model_release_candidate';
const releaseEligible =
  !fixtureMode &&
  failures === 0 &&
  evidenceFailures.length === 0 &&
  reports.length === suite.cases.length &&
  reports.every((report) => report.automated_pass);

const shouldWriteReport = !fixtureMode || process.env.CI === 'true';
if (shouldWriteReport) {
  const reportPath = fixtureMode
    ? join(root, 'prompt-eval-fixture-report.json')
    : join(outputsDir!, 'prompt-eval-report.json');
  writeFileSync(
    reportPath,
    JSON.stringify({
      schema_version: 'urai-content-prompt-eval-report-2',
      generated_at: new Date().toISOString(),
      evidence_class: evidenceClass,
      release_eligible: releaseEligible,
      fixture_mode: fixtureMode,
      limitations: fixtureMode
        ? ['Fixture regression evidence is not live-model performance or release evidence.']
        : [],
      evidence_contract: fixtureMode
        ? {
            manifest_required_for_release: true,
            manifest_validated: false
          }
        : {
            manifest_file: MANIFEST_FILENAME,
            manifest_validated: evidenceFailures.length === 0,
            failures: evidenceFailures,
            candidate_commit_sha: evidenceManifest?.candidate_commit_sha ?? null,
            prompt_version: evidenceManifest?.prompt_version ?? null,
            prompt_sha256: evidenceManifest?.prompt_sha256 ?? null,
            provider: evidenceManifest?.provider ?? null,
            model: evidenceManifest?.model ?? null,
            runtime: evidenceManifest?.runtime ?? null,
            generator: evidenceManifest?.generator ?? null
          },
      reports
    }, null, 2) + '\n'
  );
  console.log(`Report: ${reportPath}`);
}

if (failures > 0) process.exit(1);
