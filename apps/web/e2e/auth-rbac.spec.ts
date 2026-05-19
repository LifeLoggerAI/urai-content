import { expect, test } from '@playwright/test';

const protectedRoutes = ['/admin', '/dashboard', '/settings'];

for (const route of protectedRoutes) {
  test(`protected route fails closed without auth: ${route}`, async ({ page }) => {
    const response = await page.goto(route);

    expect(response).not.toBeNull();

    const status = response?.status() ?? 0;

    expect([200, 302, 401, 403, 404]).toContain(status);

    const currentUrl = page.url();

    const redirectedToAuth = /login|signin|auth/i.test(currentUrl);
    const forbiddenUiVisible = await page.locator('body').textContent();

    const failClosed =
      redirectedToAuth ||
      /unauthorized|forbidden|sign in|access denied/i.test(forbiddenUiVisible ?? '');

    expect(failClosed || status === 401 || status === 403).toBeTruthy();
  });
}
