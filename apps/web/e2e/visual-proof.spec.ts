import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { verifyAnonymousReadBoundaries, verifyDeploymentIdentity } from '../scripts/deployment-identity';

const output = process.env.URAI_CONTENT_VISUAL_DIR ?? 'artifacts/content-visual';

test.beforeAll(async ({ baseURL }, testInfo) => {
  await fs.mkdir(output, { recursive: true });
  if (process.env.URAI_CONTENT_VISUAL_PRODUCTION === '1') {
    const identity = await verifyDeploymentIdentity(baseURL!, process.env.EXACT_HEAD ?? '');
    await fs.writeFile(path.join(output, `${testInfo.project.name}-build-identity.json`), JSON.stringify(identity, null, 2));
  }
});

test('retain current public homepage pixels', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  const response = await page.goto('/', { waitUntil: 'networkidle' });
  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/URAI/i);

  const body = page.locator('body');
  const box = await body.boundingBox();
  expect(box?.width ?? 0).toBeLessThanOrEqual(testInfo.project.use.viewport?.width ?? 2000);

  const name = `${testInfo.project.name}-home.png`;
  await page.screenshot({ path: path.join(output, name), fullPage: true });
  expect(errors).toEqual([]);
});

test('retain current missing dashboard UI state', async ({ page }, testInfo) => {
  const response = await page.goto('/dashboard', { waitUntil: 'networkidle' });
  expect(response).not.toBeNull();
  expect(response?.status()).toBe(404);
  await expect(page.locator('body')).toContainText(/404|not found/i);
  const name = `${testInfo.project.name}-dashboard-missing-ui.png`;
  await page.screenshot({ path: path.join(output, name), fullPage: true });
});

// Missing UI routes and actual authentication denials are separate evidence.
test('actual protected Content APIs deny anonymous reads', async ({ baseURL }, testInfo) => {
  await verifyAnonymousReadBoundaries(baseURL!);
  await fs.writeFile(path.join(output, `${testInfo.project.name}-anonymous-api-denial.json`), JSON.stringify({
    exactHead: process.env.EXACT_HEAD ?? null,
    scope: 'Anonymous Admin and creator API reads only; no authenticated UI or provider acceptance.',
    verified: [
      { route: '/api/admin/creator-submissions', status: 401, error: 'unauthenticated' },
      { route: '/api/creator/submissions', status: 401, error: 'unauthenticated' },
      { route: '/__urai_content_unimplemented_route__', status: 404 }
    ]
  }, null, 2));
});
