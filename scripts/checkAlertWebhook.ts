const webhookUrl = process.env.URAI_DEPLOYMENT_ALERT_URL ?? process.argv.find((arg) => arg.startsWith('--webhook-url='))?.split('=')[1];
const dryRun = process.env.URAI_ALERT_DRY_RUN !== '0' && !process.argv.includes('--send');

if (!webhookUrl) {
  console.error('Missing alert webhook URL. Provide URAI_DEPLOYMENT_ALERT_URL or --webhook-url=<url>.');
  process.exit(1);
}

if (!webhookUrl.startsWith('https://')) {
  console.error('Alert webhook URL must use HTTPS.');
  process.exit(1);
}

const payload = {
  source: 'urai-content',
  type: 'deployment_verification',
  dryRun,
  timestamp: new Date().toISOString(),
  message: dryRun
    ? 'URAI Content alert webhook dry-run validation passed.'
    : 'URAI Content alert webhook live validation message.',
  baseUrl: process.env.URAI_CONTENT_BASE_URL ?? null,
  releaseSha: process.env.GITHUB_SHA ?? process.env.URAI_EXPECTED_RELEASE_SHA ?? null
};

if (dryRun) {
  console.log('Alert webhook dry run passed. Payload that would be sent:');
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'content-type': 'application/json'
  },
  body: JSON.stringify(payload)
});

if (!response.ok) {
  console.error(`Alert webhook validation failed with HTTP ${response.status}.`);
  process.exit(1);
}

console.log(`Alert webhook validation passed with HTTP ${response.status}.`);
