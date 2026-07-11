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
  "'scripts/verifyPromptWorkflowPins.mjs'",
  "'.github/workflows/prompt-review-gate.yml'",
  "'.github/workflows/governance.yml'",
]) {
  if (!promptLibrary.includes(requiredPath)) failures.push(`Prompt library workflow path filters omit ${requiredPath}`)
}
if (!promptLibrary.includes('node scripts/verifyPromptWorkflowPins.mjs')) failures.push('Prompt library workflow does not execute the action-pin verifier')

const reviewGate = readFileSync(path.join(root, '.github/workflows/prompt-review-gate.yml'), 'utf8')
if (!reviewGate.includes("'scripts/verifyPromptWorkflowPins.mjs'")) failures.push('Independent-review gate does not classify the action-pin verifier as prompt-sensitive')

const governance = readFileSync(path.join(root, '.github/workflows/governance.yml'), 'utf8')
if (!governance.includes('scripts/verifyPromptWorkflowPins.mjs')) failures.push('Governance workflow does not trigger on or execute the action-pin verifier')

const report = {
  schemaVersion: 'urai-content-prompt-workflow-pins-1',
  ok: failures.length === 0,
  workflows,
  allowedActions: [...allowedActions],
  failures,
}

console.log(JSON.stringify(report, null, 2))
if (failures.length) process.exitCode = 1
