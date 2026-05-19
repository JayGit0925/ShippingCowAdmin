// tests/e2e/admin-smoke.spec.ts
import { test, expect } from '@playwright/test';

// With DEV_BYPASS=1 all /admin/* routes return 200 without Supabase auth.
// Each test verifies: (a) no server crash, (b) section eyebrow renders.

const SECTIONS = [
  { path: '/admin',           eyebrow: '// DASHBOARD',         h1: 'Operations'  },
  { path: '/admin/customers', eyebrow: '// CUSTOMERS',         h1: 'Customers'   },
  { path: '/admin/revenue',   eyebrow: '// REVENUE',           h1: 'Revenue'     },
  { path: '/admin/reference', eyebrow: '// REFERENCE DATA',    h1: null          },
  { path: '/admin/platform',  eyebrow: '// PLATFORM CONTROLS', h1: 'Platform'    },
  { path: '/admin/audit',     eyebrow: '// AUDIT LOG',         h1: 'Audit'       },
  { path: '/admin/security',  eyebrow: '// SECURITY',          h1: 'Security'    },
  { path: '/admin/tickets',   eyebrow: '// TICKETS',           h1: null          },
] as const;

for (const s of SECTIONS) {
  test(`${s.path} renders eyebrow and doesn't crash`, async ({ page }) => {
    await page.goto(`http://localhost:3001${s.path}`);
    await expect(page.getByText(s.eyebrow).first()).toBeVisible();
    if (s.h1) {
      await expect(
        page.getByRole('heading', { level: 1, name: new RegExp(s.h1, 'i') })
      ).toBeVisible();
    }
  });
}

test('/admin renders KPI bar', async ({ page }) => {
  await page.goto('http://localhost:3001/admin');
  // _kpi-bar.tsx renders tiles with "MRR" label — present even with empty DB
  await expect(page.getByText(/MRR/i).first()).toBeVisible();
});

test('/admin/customers shows org count or upstream-missing notice', async ({ page }) => {
  await page.goto('http://localhost:3001/admin/customers');
  const hasCount   = await page.getByText(/Showing .* of .* orgs/).isVisible().catch(() => false);
  const hasMissing = await page.getByText(/Upstream tables missing/).isVisible().catch(() => false);
  expect(hasCount || hasMissing).toBe(true);
});

test('/admin/audit renders log table column headers', async ({ page }) => {
  await page.goto('http://localhost:3001/admin/audit');
  await expect(page.getByRole('columnheader', { name: 'WHEN' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'ACTION' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'ACTOR' })).toBeVisible();
  await expect(page.getByText('EXPORT CSV')).toBeVisible();
});

test('/admin/platform default tab is Flags', async ({ page }) => {
  await page.goto('http://localhost:3001/admin/platform');
  await expect(page.getByText(/Flags/i).first()).toBeVisible();
});

test('/admin does not redirect to /login with DEV_BYPASS', async ({ page }) => {
  const res = await page.goto('http://localhost:3001/admin');
  expect(res?.status()).toBe(200);
  await expect(page).toHaveURL(/\/admin$/);
});
