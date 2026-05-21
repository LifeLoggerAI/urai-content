import { expect, test } from '@playwright/test';

const routes = ['/', '/robots.txt', '/sitemap.xml'];

for (const route of routes) {
  test(`public route responds: ${route}`, async ({ page }) => {
    const response = await page.goto(route);

    expect(response).not.toBeNull();
    expect(response?.ok()).toBeTruthy();
  });
}

test('homepage exposes expected metadata', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/URAI/i);

  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveCount(1);
});

test('404 route renders intentionally', async ({ page }) => {
  const response = await page.goto('/this-route-should-not-exist');

  expect(response?.status()).toBe(404);

  await expect(page.locator('body')).toContainText(/404|not found/i);
});
