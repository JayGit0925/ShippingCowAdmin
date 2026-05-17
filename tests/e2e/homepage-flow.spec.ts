import { test, expect } from '@playwright/test';

test.describe('homepage / port', () => {
  test('hero renders with "Heavy Goods" headline copy and trust signals', async ({ page }) => {
    await page.goto('http://localhost:3001/');

    // H1: "Moo-ve Your Heavy Goods Without Getting Milked on Shipping Costs"
    // "Heavy Goods" is unique to this page — the /launch hero says "Heavy Freight".
    await expect(page.locator('h1').first()).toContainText(/Heavy Goods/);

    // 4 trust checkmarks
    await expect(page.getByText(/Up to 80% off FedEx Rates/)).toBeVisible();
    await expect(page.getByText(/2-Day Delivery Guarantee/)).toBeVisible();
    await expect(page.getByText(/Zero Shrinkage Promise/)).toBeVisible();
    await expect(page.getByText(/AI-Powered Back Office/)).toBeVisible();
  });

  test('DIM calculator renders and responds to input', async ({ page }) => {
    await page.goto('http://localhost:3001/');

    // The tools section heading confirms the section rendered
    await expect(page.getByText(/DIM Weight Savings Calculator/i)).toBeVisible();

    // Length input — labeled via htmlFor="dc-l" -> "Length (inches)"
    const lengthInput = page.getByLabel('Length (inches)');
    await expect(lengthInput).toBeVisible();

    // Change length from 24 to 30; default W=18, H=16 → cubic = 30×18×16 = 8,640
    await lengthInput.fill('30');
    await expect(page.getByText(/8,?640/)).toBeVisible();

    // The savings callout label is always present once the calc renders
    await expect(page.getByText(/Billable lbs saved vs UPS\/FedEx/i)).toBeVisible();
  });

  test('Shrinkage calculator renders and sliders respond', async ({ page }) => {
    await page.goto('http://localhost:3001/');

    // The "Average Order Value ($)" text input label confirms the calc is mounted
    await expect(page.getByText(/Average Order Value \(\$\)/i)).toBeVisible();

    // Weight slider — use stable id-based locator; label text includes the dynamic badge
    const weightSlider = page.locator('#sc-wt');
    await expect(weightSlider).toBeVisible();
    await weightSlider.fill('100');
    // The badge inside the label renders "{weight} lbs" — after fill, label shows "100 lbs"
    // getByText scans the full page; the badge span will contain "100 lbs"
    await expect(page.getByText(/100 lbs/).first()).toBeVisible();

    // Rate slider — min=2, max=10, step=0.1; default=3
    const rateSlider = page.locator('#sc-rate');
    await rateSlider.fill('5');
    // Badge renders "{rate.toFixed(1)}%" → "5.0%"
    await expect(page.getByText(/5\.0%/)).toBeVisible();

    // Grand total label is always rendered
    await expect(page.getByText(/Total Annual Savings/i)).toBeVisible();
  });

  test('hero CTA scrolls to #inquiry final CTA section', async ({ page }) => {
    await page.goto('http://localhost:3001/');

    // The primary hero CTA is an <a href="#inquiry">
    await page.getByRole('link', { name: /Get My Free Shipping Audit NOW/i }).first().click();

    // URL hash should now contain #inquiry
    await expect(page).toHaveURL(/#inquiry$/);

    // The final CTA section h2
    await expect(
      page.getByRole('heading', { level: 2, name: /Ready to Start Saving/i }),
    ).toBeVisible();
  });

  test('/launch still serves v2 hero', async ({ page }) => {
    await page.goto('http://localhost:3001/launch');

    // Launch v2 hero has the live-counter badge
    await expect(page.getByText(/LIVE — \d+ SELLERS/)).toBeVisible();

    // H1 is about "Heavy Freight" (T7 metadata adjustment) — distinct from homepage "Heavy Goods"
    await expect(page.locator('h1').first()).toContainText(/Heavy Freight/i);
  });
});
