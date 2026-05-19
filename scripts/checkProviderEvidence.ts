const required = [
  'URAI_CONTENT_BASE_URL',
  'URAI_FIREBASE_PROJECT_ID',
  'URAI_FIREBASE_HOSTING_TARGET',
  'URAI_DNS_HOSTNAME',
  'URAI_SSL_EVIDENCE_URL',
  'URAI_UPTIME_MONITOR_URL',
  'URAI_ERROR_MONITORING_URL',
  'URAI_ALERT_OWNER',
  'URAI_ROLLBACK_RUNBOOK_URL'
];

const optional = [
  'URAI_STRIPE_MODE',
  'URAI_STRIPE_WEBHOOK_URL',
  'URAI_FIRESTORE_RULES_EVIDENCE_URL',
  'URAI_STORAGE_RULES_EVIDENCE_URL',
  'URAI_RBAC_EVIDENCE_URL',
  'URAI_BROWSER_E2E_EVIDENCE_URL',
  'URAI_ROLLBACK_EVIDENCE_URL'
];

const missing = required.filter((key) => !process.env[key]);
const missingOptional = optional.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error('Provider evidence gate failed. Missing required live-provider evidence variables:');
  for (const key of missing) console.error(`- ${key}`);
  process.exit(1);
}

console.log('Provider evidence gate passed for required variables:');
for (const key of required) console.log(`- ${key}`);

if (missingOptional.length > 0) {
  console.warn('Optional provider evidence variables missing or deferred:');
  for (const key of missingOptional) console.warn(`- ${key}`);
}
