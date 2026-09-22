import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const output = process.env.URAI_CONTENT_VISUAL_DIR ?? 'artifacts/content-visual';

test.beforeAll(async () => {
  await fs.mkdir(output, { recursive: true });
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

test('retain protected fail-closed state', async ({ page }, testInfo) => {
  const response = await page.goto('/dashboard', { waitUntil: 'networkidle' });
  expect(response).not.toBeNull();
  expect(response?.status() ?? 500).toBeLessThan(500);
  const name = `${testInfo.project.name}-dashboard-fail-closed.png`;
  await page.screenshot({ path: path.join(output, name), fullPage: true });
});
