const requiredForProduction = [
  'URAI_CONTENT_BASE_URL',
  'URAI_ALERT_OWNER',
  'URAI_UPTIME_MONITOR_URL',
  'URAI_ERROR_MONITORING_URL'
];

const optionalButRecommended = [
  'SENTRY_DSN',
  'URAI_TRACE_HEADER',
  'URAI_DEPLOYMENT_ALERT_URL',
  'URAI_ROLLBACK_RUNBOOK_URL'
];

const missingRequired = requiredForProduction.filter((key) => !process.env[key]);
const missingRecommended = optionalButRecommended.filter((key) => !process.env[key]);

if (missingRequired.length > 0) {
  console.error('Observability environment check failed. Missing required production observability variables:');
  for (const key of missingRequired) console.error(`- ${key}`);
  process.exit(1);
}

console.log('Observability environment check passed.');
console.log('Required observability variables present:');
for (const key of requiredForProduction) console.log(`- ${key}`);

if (missingRecommended.length > 0) {
  console.warn('Recommended observability variables missing:');
  for (const key of missingRecommended) console.warn(`- ${key}`);
}
