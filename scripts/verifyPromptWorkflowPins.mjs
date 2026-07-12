#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const workflowPaths = [
  '.github/workflows/prompt-library.yml',
  '.github/workflows/prompt-review-gate.yml',
  '.github/workflows/governance.yml',
]

const allowedActions = new Set([
  'actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683',
  'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020',
  'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
  'actions/github-script@60a0d83039c74a4aee543508d2ffcb1c3799cdea',
])

const failures = []
const workflows = {}

for (const workflowPath of workflowPaths) {
  const source = readFileSync(path.join(root, workflowPath), 'utf8').replace(/\r\n?/g, '\n')
  const actions = [...source.matchAll(/^\s*uses:\s*([^\s#]+)(?:\s+#.*)?$/gm)].map((match) => match[1])
  workflows[workflowPath] = actions

  for (const action of actions) {
    if (action.startsWith('./')) continue
    const separator = action.lastIndexOf('@')
    const ref = separator >= 0 ? action.slice(separator + 1) : ''
    if (!/^[0-9a-f]{40}$/.test(ref)) failures.push(`${workflowPath} action is not pinned to a full immutable commit SHA: ${action}`)
    if (!allowedActions.has(action)) failures.push(`${workflowPath} uses an unapproved external action: ${action}`)
  }
}

const requiredByWorkflow = {
  '.github/workflows/prompt-library.yml': [
    'actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683',
    'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020',
    'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
  ],
  '.github/workflows/prompt-review-gate.yml': [
    'actions/github-script@60a0d83039c74a4aee543508d2ffcb1c3799cdea',
  ],
  '.github/workflows/governance.yml': [
    'actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683',
    'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020',
  ],
}

for (const [workflowPath, expectedActions] of Object.entries(requiredByWorkflow)) {
  const actual = workflows[workflowPath] ?? []
  for (const expected of expectedActions) {
    const count = actual.filter((action) => action === expected).length
    if (count !== 1) failures.push(`${workflowPath} must use ${expected} exactly once; found ${count}`)
  }
}

const promptLibrary = readFileSync(path.join(root, '.github/workflows/prompt-library.yml'), 'utf8')
for (const requiredPath of [
  "'scripts/runPromptReleaseCandidate.ts'",
  "'scripts/verifyPromptWorkflowPins.mjs'",
  "'.github/workflows/prompt-review-gate.yml'",
  "'.github/workflows/governance.yml'",
]) {
  if (!promptLibrary.includes(requiredPath)) failures.push(`Prompt library workflow path filters omit ${requiredPath}`)
}
if (!promptLibrary.includes('node scripts/verifyPromptWorkflowPins.mjs')) failures.push('Prompt library workflow does not execute the action-pin verifier')
if (!promptLibrary.includes('npm run test:prompt-release-authority')) failures.push('Prompt library workflow does not verify candidate-only prompt release authority')

const reviewGate = readFileSync(path.join(root, '.github/workflows/prompt-review-gate.yml'), 'utf8').replace(/\r\n?/g, '\n')
if (!/^\s{2}pull_request_target:\s*$/m.test(reviewGate)) failures.push('Independent-review gate must execute from pull_request_target default-branch authority')
if (/^\s{2}pull_request:\s*$/m.test(reviewGate)) failures.push('Independent-review gate must not execute approval logic from PR-controlled pull_request workflow code')
if (reviewGate.includes('actions/checkout@')) failures.push('Independent-review gate must not checkout or execute pull-request code')
for (const requiredMarker of [
  "'scripts/runPromptReleaseCandidate.ts'",
  "'scripts/verifyPromptWorkflowPins.mjs'",
  "review.commit_id !== pr.head.sha",
  "['admin', 'maintain', 'write']",
  "review.user.type === 'Bot'",
  "pr.base.ref !== 'main'",
]) {
  if (!reviewGate.includes(requiredMarker)) failures.push(`Independent-review gate missing authority marker: ${requiredMarker}`)
}
if (reviewGate.includes("'triage'")) failures.push('Independent-review gate must not accept triage permission as release approval authority')

const governance = readFileSync(path.join(root, '.github/workflows/governance.yml'), 'utf8')
for (const requiredMarker of [
  'scripts/runPromptReleaseCandidate.ts',
  'scripts/verifyPromptWorkflowPins.mjs',
  'npm run test:prompt-release-authority',
]) {
  if (!governance.includes(requiredMarker)) failures.push(`Governance workflow missing release-authority marker: ${requiredMarker}`)
}

const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
if (packageJson.scripts?.['eval:prompts'] !== 'tsx scripts/runPromptReleaseCandidate.ts') failures.push('eval:prompts must route through the candidate-only release-authority wrapper')
if (packageJson.scripts?.['test:prompt-release-authority'] !== 'tsx scripts/runPromptReleaseCandidate.ts --self-test') failures.push('package.json must expose the prompt release-authority self-test')
if (!String(packageJson.scripts?.check ?? '').includes('npm run test:prompt-release-authority')) failures.push('Full repository check must include prompt release-authority self-test')

const report = {
  schemaVersion: 'urai-content-prompt-workflow-pins-2',
  ok: failures.length === 0,
  workflows,
  allowedActions: [...allowedActions],
  reviewAuthority: {
    event: 'pull_request_target',
    checksOutPullRequestCode: false,
    qualifyingPermissions: ['admin', 'maintain', 'write'],
    exactHeadApprovalRequired: true,
  },
  failures,
}

console.log(JSON.stringify(report, null, 2))
if (failures.length) process.exitCode = 1
