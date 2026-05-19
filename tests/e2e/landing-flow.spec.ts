import { test, expect } from '@playwright/test';

test('landing → quote → submitted', async ({ page }) => {
  await page.goto('http://localhost:3001/launch');
  await expect(page.getByText(/LIVE — \d+ SELLERS/)).toBeVisible();

  await page.locator('input[name="name"]').fill('E2E Test');
  await page.locator('input[name="email"]').fill('e2e@example.com');
  await page.locator('input[name="weight_lbs"]').fill('75');
  await page.locator('input[name="origin_zip"]').fill('10001');

  await page.getByRole('button', { name: /get|quote|send/i }).click();

  await expect(page).toHaveURL(/\/quote\/submitted/);
  await expect(page.getByRole('heading', { name: /Holy Cow/i })).toBeVisible();

  // Cal.com embed: the div[data-cal-link] is in the React tree regardless of
  // whether Cal.com's runtime has loaded. Skip only in CI if network is blocked.
  if (process.env.CI !== 'true') {
    await expect(page.locator('[data-cal-link]')).toBeVisible();
  }
});

test('empty submit is blocked by HTML5 required validation', async ({ page }) => {
  await page.goto('http://localhost:3001/launch');
  await page.getByRole('button', { name: /get|quote|send/i }).click();
  // All inputs are required — browser prevents form submit; URL stays on /launch
  await expect(page).toHaveURL(/\/launch/);
});

test('invalid email format is blocked by HTML5 type=email validation', async ({ page }) => {
  await page.goto('http://localhost:3001/launch');
  await page.locator('input[name="name"]').fill('Test User');
  await page.locator('input[name="email"]').fill('not-an-email');
  await page.locator('input[name="weight_lbs"]').fill('75');
  await page.locator('input[name="origin_zip"]').fill('10001');
  await page.getByRole('button', { name: /get|quote|send/i }).click();
  await expect(page).toHaveURL(/\/launch/);
});
