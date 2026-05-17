import { expect, test } from '@playwright/test';

const authState = process.env.URAI_E2E_AUTH_STATE;
const authenticatedRoutes = ['/dashboard', '/settings'];

test.describe('authenticated session runtime coverage', () => {
  test.skip(!authState, 'URAI_E2E_AUTH_STATE is required for authenticated session E2E. Generate it from the staging/prod auth provider and store it as a CI secret artifact.');

  test.use({ storageState: authState });

  for (const route of authenticatedRoutes) {
    test(`authenticated user can reach ${route} without fail-open bypass`, async ({ page }) => {
      const response = await page.goto(route);

      expect(response).not.toBeNull();
      expect(response?.status()).toBeLessThan(500);

      const body = (await page.locator('body').textContent()) ?? '';
      expect(body).not.toMatch(/demo bypass|mock admin|dev only/i);
      expect(body).not.toMatch(/unauthorized|forbidden|access denied|sign in/i);
    });
  }
});
