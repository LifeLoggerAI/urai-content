import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'README.md',
  'URAI_FINAL_COMPLETION_AUDIT.md',
  'DEPLOYMENT_BLOCKERS.md',
  'docs/IMPLEMENTATION_STATUS.md',
  'docs/ROUTE_COVERAGE.md',
  'docs/PRODUCTION_LAUNCH_RUNBOOK.md',
  'docs/ISSUE_LAUNCH_CONTROL.md',
  'docs/EVIDENCE_LOG_TEMPLATE.md',
  'docs/MAINTAINER_RELEASE_CHECKLIST.md',
  'docs/BRANCH_AND_GOVERNANCE_STATUS.md',
  'docs/PRODUCTION_READINESS_DASHBOARD.md',
  'docs/E2E_VERIFICATION_RUNBOOK.md',
  '.github/pull_request_template.md',
  '.github/ISSUE_TEMPLATE/launch_task.md',
  '.github/ISSUE_TEMPLATE/runtime_bug.md',
  '.github/CODEOWNERS',
  '.github/workflows/governance.yml',
  '.github/workflows/web-e2e.yml',
  'scripts/productionSmoke.ts',
  'scripts/rollbackSmoke.ts',
  'scripts/checkNoSecrets.ts',
  'scripts/checkObservabilityEnv.ts',
  'scripts/checkProviderEvidence.ts',
  'scripts/checkAlertWebhook.ts'
];

const requiredReadmeLinks = [
  'docs/PRODUCTION_READINESS_DASHBOARD.md',
  'URAI_FINAL_COMPLETION_AUDIT.md',
  'docs/IMPLEMENTATION_STATUS.md',
  'DEPLOYMENT_BLOCKERS.md',
  'docs/ROUTE_COVERAGE.md',
  'docs/E2E_VERIFICATION_RUNBOOK.md',
  'docs/PRODUCTION_LAUNCH_RUNBOOK.md',
  'docs/ISSUE_LAUNCH_CONTROL.md',
  'docs/EVIDENCE_LOG_TEMPLATE.md',
  'docs/MAINTAINER_RELEASE_CHECKLIST.md',
  'docs/BRANCH_AND_GOVERNANCE_STATUS.md'
];

const requiredPhrases: Array<[string, string]> = [
  ['README.md', 'no evidence means no GREEN'],
  ['README.md', 'npm run check:governance'],
  ['README.md', 'npm run check:observability'],
  ['README.md', 'npm run smoke:production'],
  ['README.md', 'npm run smoke:rollback'],
  ['README.md', 'web-e2e.yml'],
  ['URAI_FINAL_COMPLETION_AUDIT.md', 'No evidence means no GREEN'],
  ['docs/PRODUCTION_READINESS_DASHBOARD.md', 'no evidence means no GREEN'],
  ['docs/PRODUCTION_LAUNCH_RUNBOOK.md', 'No production launch claim is valid without attached evidence'],
  ['docs/ISSUE_LAUNCH_CONTROL.md', 'The issue tracker is not a wish list'],
  ['docs/EVIDENCE_LOG_TEMPLATE.md', 'no evidence means no GREEN'],
  ['docs/EVIDENCE_LOG_TEMPLATE.md', 'npm run smoke:production'],
  ['docs/EVIDENCE_LOG_TEMPLATE.md', 'npm run smoke:rollback'],
  ['docs/EVIDENCE_LOG_TEMPLATE.md', 'npm run check:observability'],
  ['docs/MAINTAINER_RELEASE_CHECKLIST.md', 'npm run check:governance'],
  ['docs/MAINTAINER_RELEASE_CHECKLIST.md', 'Governance verification fails'],
  ['docs/MAINTAINER_RELEASE_CHECKLIST.md', 'Mark GREEN only because the evidence proves it'],
  ['docs/E2E_VERIFICATION_RUNBOOK.md', 'npm run smoke:production'],
  ['docs/E2E_VERIFICATION_RUNBOOK.md', 'npm run smoke:rollback'],
  ['docs/BRANCH_AND_GOVERNANCE_STATUS.md', 'audit/final-completion-2026-05-16'],
  ['docs/ROUTE_COVERAGE.md', 'Do not mark a route **Done** unless'],
  ['.github/pull_request_template.md', 'No evidence means no GREEN'],
  ['.github/pull_request_template.md', 'npm run check:governance'],
  ['.github/pull_request_template.md', 'npm run check:secrets'],
  ['.github/pull_request_template.md', 'npm run check:observability'],
  ['.github/pull_request_template.md', 'npm run smoke:production'],
  ['.github/pull_request_template.md', 'npm run smoke:rollback'],
  ['.github/pull_request_template.md', 'docs/PRODUCTION_READINESS_DASHBOARD.md remains accurate'],
  ['.github/pull_request_template.md', 'Governance verification fails'],
  ['.github/pull_request_template.md', 'Secret scan fails'],
  ['.github/pull_request_template.md', 'Observability verification fails'],
  ['.github/pull_request_template.md', 'Rollback smoke fails'],
  ['.github/workflows/governance.yml', 'npm run check:governance'],
  ['.github/workflows/governance.yml', 'npm run check:secrets'],
  ['.github/workflows/web-e2e.yml', 'npm run e2e'],
  ['.github/workflows/web-e2e.yml', 'workflow_dispatch'],
  ['.github/workflows/web-e2e.yml', 'playwright-report'],
  ['package.json', 'check:provider-evidence'],
  ['package.json', 'check:alerts'],
  ['package.json', 'check:release-env'],
  ['package.json', 'web:e2e'],
  ['.github/ISSUE_TEMPLATE/launch_task.md', 'Evidence required before GREEN'],
  ['.github/ISSUE_TEMPLATE/runtime_bug.md', 'Do not close this issue without reproducible evidence'],
  ['.github/CODEOWNERS', 'URAI Content code ownership']
];

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

const failures: string[] = [];

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) {
    failures.push(`Missing required governance file: ${file}`);
  }
}

if (existsSync(join(root, 'README.md'))) {
  const readme = read('README.md');
  for (const link of requiredReadmeLinks) {
    if (!readme.includes(link)) {
      failures.push(`README.md does not reference ${link}`);
    }
  }
}

for (const [file, phrase] of requiredPhrases) {
  if (!existsSync(join(root, file))) {
    continue;
  }
  const content = read(file);
  if (!content.includes(phrase)) {
    failures.push(`${file} is missing required governance phrase: ${phrase}`);
  }
}

if (failures.length > 0) {
  console.error('Governance docs check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Governance docs check passed for ${requiredFiles.length} files.`);
