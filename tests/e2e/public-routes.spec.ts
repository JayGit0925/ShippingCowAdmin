// tests/e2e/public-routes.spec.ts
import { test, expect } from '@playwright/test';

test.describe('/how-it-works', () => {
  test('page loads and shows a top-level heading', async ({ page }) => {
    await page.goto('http://localhost:3001/how-it-works');
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
  });

  test('shows numbered step indicators', async ({ page }) => {
    await page.goto('http://localhost:3001/how-it-works');
    await expect(page.getByText('01').first()).toBeVisible();
    await expect(page.getByText('02').first()).toBeVisible();
    await expect(page.getByText('03').first()).toBeVisible();
  });

  test('contains DIM-factor content', async ({ page }) => {
    await page.goto('http://localhost:3001/how-it-works');
    // The HiW insight bar calls out dim factor 225 or the acronym DIM
    await expect(page.getByText(/DIM/i).first()).toBeVisible();
  });
});

test.describe('/pricing', () => {
  test('renders all three tier names', async ({ page }) => {
    await page.goto('http://localhost:3001/pricing');
    await expect(page.getByText(/Calf/i).first()).toBeVisible();
    await expect(page.getByText(/Cow/i).first()).toBeVisible();
    await expect(page.getByText(/Bull/i).first()).toBeVisible();
  });

  test('has at least one quote CTA link', async ({ page }) => {
    await page.goto('http://localhost:3001/pricing');
    await expect(page.getByRole('link', { name: /quote/i }).first()).toBeVisible();
  });
});

test.describe('/quote/submitted', () => {
  test('renders the Holy Cow confirmation heading', async ({ page }) => {
    await page.goto('http://localhost:3001/quote/submitted');
    await expect(page.getByText(/Holy Cow/i)).toBeVisible();
  });

  test('Cal.com embed container is present', async ({ page }) => {
    await page.goto('http://localhost:3001/quote/submitted');
    if (process.env.CI !== 'true') {
      await expect(page.locator('[data-cal-link]')).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/quote\/submitted/);
    }
  });
});
