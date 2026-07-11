import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function finalizePromptReport(reportPath: string): void {
  const parsed = JSON.parse(readFileSync(reportPath, 'utf8')) as unknown;
  if (!isRecord(parsed)) throw new Error('Prompt evaluation report must contain a JSON object');

  const reports = Array.isArray(parsed.reports) ? parsed.reports : [];
  const evidenceContract = isRecord(parsed.evidence_contract) ? parsed.evidence_contract : {};
  const candidateValid =
    parsed.schema_version === 'urai-content-prompt-eval-report-2' &&
    parsed.evidence_class === 'live_model_release_candidate' &&
    parsed.fixture_mode === false &&
    parsed.release_eligible === true &&
    evidenceContract.manifest_validated === true &&
    reports.length > 0 &&
    reports.every((report) => isRecord(report) && report.automated_pass === true);

  if (!candidateValid) {
    throw new Error('Prompt evaluation output is not a valid live-model release candidate');
  }

  const limitations = Array.isArray(parsed.limitations)
    ? parsed.limitations.filter((entry): entry is string => typeof entry === 'string')
    : [];
  const authorityLimitation =
    'Automated evaluation and self-declared manifest attestations are candidate evidence only. Release eligibility requires independent current-head GitHub approval, terminal exact-head CI, merge to main, the v1.0.0 tag, and verified mirror parity.';
  if (!limitations.includes(authorityLimitation)) limitations.push(authorityLimitation);

  const finalized = {
    ...parsed,
    schema_version: 'urai-content-prompt-eval-report-3',
    source_report_schema: parsed.schema_version,
    finalized_at: new Date().toISOString(),
    candidate_valid: true,
    release_eligible: false,
    limitations,
    evidence_contract: {
      ...evidenceContract,
      manual_attestation_trust: 'self-declared-supporting-evidence',
      external_release_gates_required: true
    },
    release_authority: {
      status: 'external-gates-required',
      required: [
        'terminal exact-head CI on one unchanged candidate commit',
        'independent non-author GitHub approval on the exact candidate head',
        'merge of the approved candidate to main',
        'v1.0.0 tag at the merged commit',
        'verified Google Docs mirror parity against the tagged release'
      ]
    }
  };

  writeFileSync(reportPath, JSON.stringify(finalized, null, 2) + '\n');
  console.log(`Candidate-only report finalized: ${reportPath}`);
}

function runSelfTest(): void {
  const directory = mkdtempSync(join(tmpdir(), 'urai-prompt-release-authority-'));
  try {
    const reportPath = join(directory, 'prompt-eval-report.json');
    writeFileSync(reportPath, JSON.stringify({
      schema_version: 'urai-content-prompt-eval-report-2',
      evidence_class: 'live_model_release_candidate',
      fixture_mode: false,
      release_eligible: true,
      limitations: [],
      evidence_contract: { manifest_validated: true },
      reports: [{ case_id: 'self-test', automated_pass: true }]
    }, null, 2) + '\n');

    finalizePromptReport(reportPath);
    const finalized = JSON.parse(readFileSync(reportPath, 'utf8')) as JsonRecord;
    if (finalized.schema_version !== 'urai-content-prompt-eval-report-3') {
      throw new Error('self-test did not emit report schema v3');
    }
    if (finalized.candidate_valid !== true || finalized.release_eligible !== false) {
      throw new Error('self-test did not preserve candidate validity while blocking release eligibility');
    }
    const authority = finalized.release_authority;
    if (!isRecord(authority) || authority.status !== 'external-gates-required') {
      throw new Error('self-test did not encode external release authority');
    }

    writeFileSync(reportPath, JSON.stringify({
      schema_version: 'urai-content-prompt-eval-report-2',
      evidence_class: 'live_model_release_candidate',
      fixture_mode: false,
      release_eligible: true,
      evidence_contract: { manifest_validated: true },
      reports: [{ case_id: 'self-test', automated_pass: false }]
    }, null, 2) + '\n');
    let rejected = false;
    try {
      finalizePromptReport(reportPath);
    } catch {
      rejected = true;
    }
    if (!rejected) throw new Error('self-test accepted a failed automated report');

    console.log('[PASS] prompt release-authority finalizer self-test');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

const args = process.argv.slice(2);
if (args.includes('--self-test')) {
  runSelfTest();
} else {
  const outputsIndex = args.indexOf('--outputs');
  const outputsDirectory = outputsIndex >= 0 ? resolve(args[outputsIndex + 1] ?? '') : '';
  if (!outputsDirectory) {
    console.error('Usage: npm run eval:prompts -- --outputs <directory>');
    process.exit(2);
  }
  await import('./runPromptEvals.ts');
  finalizePromptReport(join(outputsDirectory, 'prompt-eval-report.json'));
}
