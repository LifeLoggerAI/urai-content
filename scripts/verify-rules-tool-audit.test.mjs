import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyAudit } from './verify-rules-tool-audit.mjs';
const clean = () => ({ auditReportVersion: 2, vulnerabilities: {}, metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 } } });
test('Complete clean registry report passes without accepting local security forks', () => {
  assert.deepEqual(verifyAudit(clean(), '0'), { auditReportVersion: 2, registryVulnerabilities: 0, localSecurityForkAcceptance: false });
});
for (const exit of ['1', '-1', '', '00']) test('Audit fails closed on unsuccessful or malformed exit ' + JSON.stringify(exit), () => assert.throws(() => verifyAudit(clean(), exit)));
test('Audit rejects provider errors even beside zero counts', () => assert.throws(() => verifyAudit({ ...clean(), error: { code: 'EAUDIT' } }, '0')));
test('Audit rejects missing and unsupported schema', () => {
  const report = clean(); delete report.auditReportVersion; assert.throws(() => verifyAudit(report, '0'));
  assert.throws(() => verifyAudit({ ...clean(), auditReportVersion: 1 }, '0'));
});
test('Audit rejects missing and malformed count fields', () => {
  assert.throws(() => verifyAudit({}, '0'));
  const report = clean(); delete report.metadata.vulnerabilities.high; assert.throws(() => verifyAudit(report, '0'));
  report.metadata.vulnerabilities.high = '0'; assert.throws(() => verifyAudit(report, '0'));
});
test('Audit rejects nonzero known and unknown severity', () => {
  for (const severity of ['info','low','moderate','high','critical','total','newSeverity']) {
    const report = clean(); report.metadata.vulnerabilities[severity] = 1; assert.throws(() => verifyAudit(report, '0'));
  }
});
test('Audit rejects findings hidden behind zero counts', () => assert.throws(() => verifyAudit({ ...clean(), vulnerabilities: { vulnerable: { severity: 'high' } } }, '0')));
test('Audit rejects missing or array findings', () => {
  const report = clean(); delete report.vulnerabilities; assert.throws(() => verifyAudit(report, '0'));
  assert.throws(() => verifyAudit({ ...clean(), vulnerabilities: [] }, '0'));
});
