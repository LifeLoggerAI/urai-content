import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export function verifyAudit(report, exitCode) {
  if (exitCode !== '0') throw new Error('Dependency audit did not succeed');
  if (!report || typeof report !== 'object' || Array.isArray(report) || report.error) throw new Error('Dependency audit report is invalid');
  if (report.auditReportVersion !== 2) throw new Error('Unsupported dependency audit schema');
  const counts = report.metadata?.vulnerabilities;
  if (!counts || typeof counts !== 'object' || Array.isArray(counts)) throw new Error('Dependency audit counts are missing');
  for (const name of ['info', 'low', 'moderate', 'high', 'critical', 'total']) {
    if (!Number.isSafeInteger(counts[name]) || counts[name] !== 0) throw new Error('Dependency audit contains findings or malformed counts');
  }
  if (Object.values(counts).some(value => value !== 0)) throw new Error('Dependency audit contains unrecognized nonzero findings');
  if (!report.vulnerabilities || typeof report.vulnerabilities !== 'object' || Array.isArray(report.vulnerabilities) || Object.keys(report.vulnerabilities).length) throw new Error('Dependency audit findings disagree with counts');
  return { auditReportVersion: report.auditReportVersion, registryVulnerabilities: 0, localSecurityForkAcceptance: false };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const [reportPath, exitPath] = process.argv.slice(2);
  if (!reportPath || !exitPath) throw new Error('Usage: verify-rules-tool-audit.mjs REPORT EXIT_CODE');
  console.log(JSON.stringify(verifyAudit(JSON.parse(readFileSync(reportPath, 'utf8')), readFileSync(exitPath, 'utf8').trim())));
}
