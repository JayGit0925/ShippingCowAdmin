// tests/e2e/navigation.spec.ts
import { test, expect } from '@playwright/test';

// PublicNav rendered by PublicLayout on all public pages.
// Links: Home · Launch · How it Works · Pricing  CTA: Get a Quote → #inquiry

test.describe('Nav from /', () => {
  test('How it Works link goes to /how-it-works', async ({ page }) => {
    await page.goto('http://localhost:3001/');
    await page.getByRole('link', { name: /how it works/i }).first().click();
    await expect(page).toHaveURL(/\/how-it-works/);
  });

  test('Pricing link goes to /pricing', async ({ page }) => {
    await page.goto('http://localhost:3001/');
    await page.getByRole('link', { name: /^pricing$/i }).first().click();
    await expect(page).toHaveURL(/\/pricing/);
  });

  test('Launch link goes to /launch', async ({ page }) => {
    await page.goto('http://localhost:3001/');
    await page.getByRole('link', { name: /^launch$/i }).first().click();
    await expect(page).toHaveURL(/\/launch/);
  });
});

test.describe('Nav from /launch', () => {
  test('Get a Quote CTA href contains #inquiry', async ({ page }) => {
    await page.goto('http://localhost:3001/launch');
    const cta = page.getByRole('link', { name: /get a quote/i }).first();
    const href = await cta.getAttribute('href');
    // Fix from fe65ca0: /launch nav CTA points to /#inquiry not #inquiry
    expect(href).toMatch(/#inquiry/);
  });

  test('Pricing link goes to /pricing', async ({ page }) => {
    await page.goto('http://localhost:3001/launch');
    await page.getByRole('link', { name: /^pricing$/i }).first().click();
    await expect(page).toHaveURL(/\/pricing/);
  });
});
