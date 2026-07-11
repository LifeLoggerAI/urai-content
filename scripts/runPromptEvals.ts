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
  pass_threshold: number;
  prohibited_patterns: ProhibitedPattern[];
  cases: EvalCase[];
  negative_fixtures: NegativeFixture[];
}

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
    automated_pass: score >= suite.pass_threshold && criticalFailures.length === 0 && prohibitedFailures.length === 0,
    critical_failures: criticalFailures,
    prohibited_failures: prohibitedFailures,
    criteria: results,
    manual_checks: testCase.manual_checks
  };
}

function missingExpected(expected: string[] | undefined, actual: string[]): string[] {
  return (expected ?? []).filter((id) => !actual.includes(id));
}

const reports: ReturnType<typeof evaluate>[] = [];
let failures = 0;
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
  if (report.critical_failures.length) console.log(`  critical: ${report.critical_failures.join(', ')}`);
  if (report.prohibited_failures.length) console.log(`  prohibited: ${report.prohibited_failures.map((rule) => rule.id).join(', ')}`);
}

if (fixtureMode) {
  for (const negative of suite.negative_fixtures) {
    const testCase = suite.cases.find((candidate) => candidate.id === negative.case_id);
    if (!testCase) throw new Error(`Unknown negative fixture case: ${negative.case_id}`);
    const path = join(root, 'prompts/evals', negative.fixture);
    const report = evaluate(testCase, readFileSync(path, 'utf8'));
    const prohibitedIds = report.prohibited_failures.map((rule) => rule.id);
    const missingCritical = missingExpected(negative.expected_critical_failures, report.critical_failures);
    const missingProhibited = missingExpected(negative.expected_prohibited_failures, prohibitedIds);
    const correctlyFailed = !report.automated_pass && missingCritical.length === 0 && missingProhibited.length === 0;
    console.log(`${correctlyFailed ? 'PASS' : 'FAIL'} negative fixture ${basename(path)} rejected`);
    if (missingCritical.length) console.log(`  missing critical assertions: ${missingCritical.join(', ')}`);
    if (missingProhibited.length) console.log(`  missing prohibited assertions: ${missingProhibited.join(', ')}`);
    if (!correctlyFailed) failures += 1;
  }
}

const shouldWriteReport = !fixtureMode || process.env.CI === 'true';
if (shouldWriteReport) {
  const reportPath = fixtureMode ? join(root, 'prompt-eval-fixture-report.json') : join(outputsDir!, 'prompt-eval-report.json');
  writeFileSync(reportPath, JSON.stringify({ generated_at: new Date().toISOString(), fixture_mode: fixtureMode, reports }, null, 2) + '\n');
  console.log(`Report: ${reportPath}`);
}
if (failures > 0) process.exit(1);
