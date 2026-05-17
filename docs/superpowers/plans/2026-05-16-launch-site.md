# Launch Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the v2 design into the existing Next.js app to ship a 4-page public site (`/`, `/how-it-works`, `/pricing`, `/quote/submitted`) sharing one Vercel project with the gated `/admin/*` portal, ready for the LinkedIn DM campaign and the 2026-06-08 launch.

**Architecture:** Single Next.js 14 App Router project (no split). Reuse `lib/brand.ts` tokens and the existing inline `style={{...}}` pattern from `app/page.tsx`. Port content from `landingpage/shippingcow-landingpage-v2(1).html` into Next.js components. The quote form continues to POST `/api/quote-request`; on success it redirects to `/quote/submitted` which embeds Cal.com for demo booking. `/admin/*` routes, `middleware.ts`, and `/login` are untouched.

**Tech Stack:** Next.js 14 App Router · TypeScript strict · React 18 server components by default · `@calcom/embed-react` (new dep) · existing `@supabase/supabase-js` for `quote_requests` · Vitest unit · Playwright e2e.

**Prerequisite (Jay, before Task 1):** Rename Vercel project `shippingcow-admin` → `shippingcowmvp`. Steps: Vercel dashboard → Project Settings → General → Project Name. Confirm `https://shippingcowmvp.vercel.app/` resolves to the current production deploy. The old alias `shippingcow-admin.vercel.app` keeps working.

**Locked decisions (from grill 2026-05-16):**

| # | Decision |
|---|---|
| Domain | `shippingcow.ai` is owned; DNS deferred until after first 5 demos |
| Public URL during deferred-DNS | `shippingcowmvp.vercel.app` (post-rename) |
| Admin/public separation | Single Vercel project; `/admin/*` stays middleware-gated |
| Design source of truth | `landingpage/shippingcow-landingpage-v2(1).html` |
| Page list | `/`, `/how-it-works`, `/pricing`, `/quote/submitted` |
| Setup-page meaning | `/quote/submitted` = "Holy Cow — You're In!" + Cal.com embed |
| ICP page | No standalone `/who-its-for` — folds into hero microcopy + trust section on `/` |
| Pricing | Public on `/pricing` |
| Calendar | Cal.com free tier at `jay-shippingcow/intro-demo` |
| MFA setup, customer portal, content silos, Resend | Out of scope for this plan |

---

## File Structure

**Create:**
- `components/shell/public-nav.tsx` — public-site nav. Server component. 4 items: How it works · Pricing · [Get a Quote CTA →#quote on `/`, link to `/` on other routes] · Login (small).
- `components/shell/public-footer.tsx` — public footer. Logo, copyright, contact email, privacy stub link.
- `components/shell/public-layout.tsx` — composes `<PublicNav/>` + `{children}` + `<PublicFooter/>` with body background from v2 design.
- `app/how-it-works/page.tsx` — server component. Sections: dim factor 225 (port from v2 `silo-section`), 3-warehouse zone skipping (port from v2 `hiw-section`), 6:30 AM insight (port from v2 `insight-section`).
- `app/pricing/page.tsx` — server component. Plans table (Calf / Cow / Bull tiers from `admin handoff v1(1).md`) + trust section (port from v2 `trust-section`).
- `app/quote/submitted/page.tsx` — server component. "Holy Cow — You're In!" hero + `<DemoCalendar/>` client component.
- `app/quote/submitted/_demo-calendar.tsx` — client component wrapping `@calcom/embed-react`.
- `lib/cal.ts` — single source of truth: `CAL_SLUG = 'jay-shippingcow/intro-demo'`, namespace constants.
- `tests/unit/quote-form.test.ts` — vitest. Asserts form payload shape + post-submit navigation target.
- `tests/e2e/landing-flow.spec.ts` — Playwright. Visits `/`, fills form, submits, asserts URL is `/quote/submitted`, asserts Cal.com iframe visible.

**Modify:**
- `app/page.tsx` — replace current minimal landing with v2 hero (lines 690–1022 of HTML) + MOOOVY intro band (v2 `mooovy-section`) + existing `<RateCalculator/>` section + existing `<QuoteForm/>` section. Wrap whole page in `<PublicLayout>`. Drop the inline `<footer>` (moves to `<PublicLayout>`).
- `app/_quote-form.tsx` — on successful POST, call `router.push('/quote/submitted')` instead of `setStatus('done')`. Remove the inline success message UI (moves to `/quote/submitted`).
- `app/layout.tsx` — update `metadata.title` from `'ShippingCow Admin'` to `'ShippingCow — The 3PL for Heavy Items'`. `metadata.description` from `'Internal admin portal'` to a public-facing line. Keep root layout otherwise minimal (fonts, globals).
- `package.json` — add `"@calcom/embed-react": "^1.5.0"` to dependencies.
- `app/api/quote-request/route.ts` — unchanged (form does the redirect client-side).

**Test:**
- `tests/unit/quote-form.test.ts`
- `tests/e2e/landing-flow.spec.ts`

---

## Tasks

Ordered: foundation chrome → page builds → integration → tests → ship.

### Task 1: Extract layout chrome to reusable components

The current `app/page.tsx` has nav + footer inline. Three pages will repeat this — extract once.

**Files:**
- Create: `components/shell/public-nav.tsx`
- Create: `components/shell/public-footer.tsx`
- Create: `components/shell/public-layout.tsx`
- Modify: `app/page.tsx` (consume `<PublicLayout>`, remove inline nav + footer)

- [ ] **Step 1: Extract nav markup from `app/page.tsx`**

Read `app/page.tsx` to find the current nav block (it's the first `<nav>` in the body). Lift it into `components/shell/public-nav.tsx` as a server component. Add a `currentPath?: string` prop so the active link can be highlighted later (don't wire highlighting yet — just thread the prop).

Nav items (left to right): logo (links to `/`), `How it works` (`/how-it-works`), `Pricing` (`/pricing`), `Login` (small, far right, `/login`), `Get a Quote` (CTA button, `/#quote` on `/`, else `/`).

- [ ] **Step 2: Build `components/shell/public-footer.tsx`**

```tsx
import type { CSSProperties } from 'react';
import { BRAND, FONT } from '@/lib/brand';

const S = {
  footer: {
    background: BRAND.charcoal,
    color: BRAND.white,
    padding: '32px 24px',
    fontFamily: FONT.body,
    fontSize: 13,
    textAlign: 'center' as const,
    borderTop: `3px solid ${BRAND.yellow}`,
  } satisfies CSSProperties,
};

export function PublicFooter() {
  return (
    <footer style={S.footer}>
      © 2026 ShippingCow — Built for heavy-item sellers · <a href="mailto:jay@shippingcow.ai" style={{color: BRAND.yellow}}>jay@shippingcow.ai</a>
    </footer>
  );
}
```

- [ ] **Step 3: Build `components/shell/public-layout.tsx`**

```tsx
import type { ReactNode } from 'react';
import { PublicNav } from './public-nav';
import { PublicFooter } from './public-footer';

export function PublicLayout({ children, currentPath }: { children: ReactNode; currentPath?: string }) {
  return (
    <>
      <PublicNav currentPath={currentPath} />
      <main>{children}</main>
      <PublicFooter />
    </>
  );
}
```

- [ ] **Step 4: Wire `<PublicLayout>` into `app/page.tsx`**

Wrap the page body in `<PublicLayout currentPath="/">`. Delete the now-duplicate inline `<nav>` and `<footer>` blocks.

- [ ] **Step 5: Build + typecheck**

```bash
npm run typecheck && npm run build 2>&1 | tail -20
```
Expected: PASS. Visit `http://localhost:3001/` (after `npm run dev`) and confirm nav + footer render identically to before.

- [ ] **Step 6: Commit**

```bash
git add components/shell app/page.tsx
git commit -m "refactor(shell): extract PublicNav/Footer/Layout for reuse"
```

---

### Task 2: Port v2 hero + MOOOVY intro into `/`

Replace the current minimal hero with the v2 hero (lines 690–1022 of `landingpage/shippingcow-landingpage-v2(1).html`) and follow with the MOOOVY intro band (v2 `mooovy-section`).

**Files:**
- Modify: `app/page.tsx` (replace hero section)
- Test: visual QA only at this task; e2e in Task 6

- [ ] **Step 1: Read v2 hero (lines 690–1022 of the HTML)**

```bash
sed -n '690,1022p' "landingpage/shippingcow-landingpage-v2(1).html"
```

Note: live badge ("LIVE — 14 SELLERS GOT AUDITED THIS WEEK"), H1, subhead, testimonial strip, hero-right visual.

- [ ] **Step 2: Port hero markup to TSX in `app/page.tsx`**

Convert the v2 hero `<section class="hero">` into a TSX `<section style={...}>`. Map every CSS class to inline styles drawn from `lib/brand.ts`. Pull recurring values (gradient stops, section padding) into the existing `S` object near the top of the file.

ICP microcopy in subhead (folds in `/who-its-for` content): "For Shopify & TikTok Shop sellers moving 50–149lb items. 200–2,000 orders/month."

Keep "LIVE — N SELLERS GOT AUDITED THIS WEEK" copy literal but make `N` a constant at the top of the file so it's editable: `const SELLERS_AUDITED_THIS_WEEK = 14;`.

- [ ] **Step 3: Port v2 `mooovy-section` (lines 1023–1071)**

```bash
sed -n '1023,1071p' "landingpage/shippingcow-landingpage-v2(1).html"
```

Convert to TSX section. Render between hero and the existing rate-calculator section.

- [ ] **Step 4: Drop the old hero block**

Remove the old hero (`{/* Hero section */}` through close `</section>`) and the inline `<footer>` (already replaced by `<PublicLayout>` in Task 1).

- [ ] **Step 5: Build + visual QA**

```bash
npm run build && npm run dev
```
Open `http://localhost:3001/`. Walk the page top to bottom: nav · hero · MOOOVY intro · rate calc · quote form · footer. Compare hero side-by-side with v2 HTML opened directly in browser. Tolerable diffs: typography rendering, image placeholders. Not tolerable: layout breaks, missing live badge, wrong CTA.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx
git commit -m "feat(home): port v2 hero + mooovy intro to /"
```

---

### Task 3: Build `/how-it-works`

3 sections from v2: zone skipping (`silo-section`), 3-step how-it-works (`hiw-section`), 6:30 AM insight (`insight-section`).

**Files:**
- Create: `app/how-it-works/page.tsx`

- [ ] **Step 1: Read v2 sections**

```bash
sed -n '1072,1199p' "landingpage/shippingcow-landingpage-v2(1).html"
```
Covers `insight-section` (1072–1124), `silo-section` (1125–1164), `hiw-section` (1165–1199).

- [ ] **Step 2: Scaffold the page**

```tsx
import type { CSSProperties } from 'react';
import { BRAND, FONT } from '@/lib/brand';
import { PublicLayout } from '@/components/shell/public-layout';

export const metadata = {
  title: 'How it Works — ShippingCow',
  description: 'Dim factor 225, 3-warehouse zone skipping, and 6:30 AM insights. Built for 50–149lb items.',
};

export default function HowItWorksPage() {
  return (
    <PublicLayout currentPath="/how-it-works">
      {/* sections go here */}
    </PublicLayout>
  );
}
```

- [ ] **Step 3: Port `silo-section` → "Why dim factor 225 matters"**

Lead section. Port the silo-section block as TSX. Lead with the dim factor 225 framing. Tie to "$14/order saved on a 60lb item" proof point from `marketing-context.md` §11.

- [ ] **Step 4: Port `hiw-section` → "How a shipment moves through ShippingCow"**

3-step diagram. Pickup → Zone-optimized routing → Last-mile contract label.

- [ ] **Step 5: Port `insight-section` → "Every morning at 6:30 AM"**

The MOOOVY-delivered insight strip. Keep MOOOVY references — this is mid-funnel content where MOOOVY voice is on per `marketing-context.md` §10.

- [ ] **Step 6: Build + visual QA**

`npm run build` (expect PASS), then open `http://localhost:3001/how-it-works`. Check responsive at 375px width (mobile) — v2 design has clamp() font sizes; verify they collapse correctly.

- [ ] **Step 7: Commit**

```bash
git add app/how-it-works
git commit -m "feat(public): add /how-it-works page (silo + hiw + insight)"
```

---

### Task 4: Build `/pricing`

Pricing tiers (Calf / Cow / Bull) per `admin handoff v1(1).md` + trust section.

**Files:**
- Create: `app/pricing/page.tsx`

- [ ] **Step 1: Read v2 pricing + trust sections**

```bash
sed -n '1200,1321p' "landingpage/shippingcow-landingpage-v2(1).html"
```
Covers `pricing-section` (1200–1260) and `trust-section` (1261–1321).

- [ ] **Step 2: Locate the Calf/Cow/Bull tier definitions**

Grep the handoff doc and existing admin code:
```bash
grep -nE 'Calf|Bull|tier' 'admin handoff v1(1).md' | head -20
grep -rnE 'Calf|Bull|tier' app/admin/reference 2>&1 | head -20
```
If tiers are partially defined in `app/admin/reference/*` or in `our_logistics_fees`, use those. If not, write tier names + a "Talk to us for pricing" CTA on each card pointing at `#quote` on `/`.

- [ ] **Step 3: Scaffold the page**

```tsx
import type { CSSProperties } from 'react';
import { BRAND, FONT } from '@/lib/brand';
import { PublicLayout } from '@/components/shell/public-layout';

export const metadata = {
  title: 'Pricing — ShippingCow',
  description: 'Per-order pricing for 50–149lb items. Calf, Cow, and Bull tiers.',
};

export default function PricingPage() {
  return (
    <PublicLayout currentPath="/pricing">
      {/* pricing-section then trust-section */}
    </PublicLayout>
  );
}
```

- [ ] **Step 4: Port `pricing-section` as 3-tier table**

Use the same border + shadow tokens as `<Card>` in `components/ui/card.tsx` — 3px charcoal border, 4px pixel shadow, zero radius. Each tier card has: tier name, "from $X/order" line, 3–5 bullet features, "Get a Quote" CTA → `/#quote`. If real numbers aren't locked, use "from $X" with a footnote: "Final price depends on weight + zone — get an exact quote in 24h."

- [ ] **Step 5: Port `trust-section` as proof bar**

3-warehouse map, dim factor comparison (225 vs 166), real-time dashboard preview thumbnail (placeholder image OK).

- [ ] **Step 6: Build + visual QA**

`npm run build`, then open `http://localhost:3001/pricing`. Check tier cards align horizontally desktop, stack vertical mobile. Trust section visuals can use placeholder boxes — real assets later.

- [ ] **Step 7: Commit**

```bash
git add app/pricing
git commit -m "feat(public): add /pricing page (tiers + trust)"
```

---

### Task 5: Build `/quote/submitted` with Cal.com embed

Post-quote confirmation. "Holy Cow — You're In!" hero + Cal.com inline embed.

**Files:**
- Create: `app/quote/submitted/page.tsx`
- Create: `app/quote/submitted/_demo-calendar.tsx`
- Create: `lib/cal.ts`
- Modify: `package.json` (add `@calcom/embed-react`)

- [ ] **Step 1: Install `@calcom/embed-react`**

```bash
npm install @calcom/embed-react --legacy-peer-deps
```
Verify `package.json` has the new dep. Commit `package.json` + `package-lock.json` change separately at end of task.

- [ ] **Step 2: Create `lib/cal.ts`**

```ts
export const CAL_SLUG = 'jay-shippingcow/intro-demo';
export const CAL_NAMESPACE = 'intro-demo';
```

- [ ] **Step 3: Create `app/quote/submitted/_demo-calendar.tsx`**

```tsx
'use client';

import { getCalApi } from '@calcom/embed-react';
import { useEffect } from 'react';
import { CAL_NAMESPACE, CAL_SLUG } from '@/lib/cal';

export function DemoCalendar() {
  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: CAL_NAMESPACE });
      cal('ui', { hideEventTypeDetails: false, layout: 'month_view' });
    })();
  }, []);

  return (
    <div
      data-cal-namespace={CAL_NAMESPACE}
      data-cal-link={CAL_SLUG}
      data-cal-config='{"layout":"month_view"}'
      style={{ width: '100%', minHeight: 600 }}
    />
  );
}
```

- [ ] **Step 4: Create `app/quote/submitted/page.tsx`**

```tsx
import type { CSSProperties } from 'react';
import { BRAND, FONT } from '@/lib/brand';
import { PublicLayout } from '@/components/shell/public-layout';
import { DemoCalendar } from './_demo-calendar';

export const metadata = {
  title: "Holy Cow — You're In! · ShippingCow",
  description: 'Pick a 30-min demo slot. We reply within 24 hours.',
};

const S = {
  hero: {
    background: BRAND.blue,
    color: BRAND.white,
    padding: '96px 24px 48px',
    textAlign: 'center' as const,
    borderBottom: `3px solid ${BRAND.yellow}`,
  } satisfies CSSProperties,
  h1: {
    fontFamily: FONT.display,
    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
    textTransform: 'uppercase' as const,
    margin: 0,
  } satisfies CSSProperties,
  sub: {
    fontFamily: FONT.body,
    fontSize: 18,
    maxWidth: 600,
    margin: '16px auto 0',
    opacity: 0.9,
  } satisfies CSSProperties,
  calWrap: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '48px 24px 96px',
  } satisfies CSSProperties,
};

export default function QuoteSubmittedPage() {
  return (
    <PublicLayout currentPath="/quote/submitted">
      <section style={S.hero}>
        <h1 style={S.h1}>Holy Cow — You&apos;re In!</h1>
        <p style={S.sub}>
          We&apos;ll reply with your exact rate within 24 hours. While you wait, grab a 30-min slot below.
        </p>
      </section>
      <section style={S.calWrap}>
        <DemoCalendar />
      </section>
    </PublicLayout>
  );
}
```

- [ ] **Step 5: Verify Cal.com setup (Jay's hands)**

Confirm in Cal.com dashboard: account exists, event type `intro-demo` is published, slug `jay-shippingcow/intro-demo` resolves at `https://cal.com/jay-shippingcow/intro-demo` in browser. If account doesn't exist, create one (free tier, 15 min setup).

- [ ] **Step 6: Build + visual QA**

`npm run build`, then open `http://localhost:3001/quote/submitted` directly. Calendar widget should render after ~2s. If you see a Cal.com 404 widget, the event-type slug is wrong — fix `CAL_SLUG` in `lib/cal.ts`.

- [ ] **Step 7: Commit**

```bash
git add app/quote/submitted lib/cal.ts package.json package-lock.json
git commit -m "feat(public): add /quote/submitted with Cal.com embed"
```

---

### Task 6: Wire quote form to redirect to `/quote/submitted`

Currently `app/_quote-form.tsx` sets `status='done'` and renders a success message inline. Change to navigate.

**Files:**
- Modify: `app/_quote-form.tsx`

- [ ] **Step 1: Add `useRouter` import**

At the top of `app/_quote-form.tsx`:
```ts
import { useRouter } from 'next/navigation';
```

- [ ] **Step 2: Use the router in the submit handler**

Inside `handleSubmit`, after the successful POST (`if (res.ok)`), replace `setStatus('done')` with:
```ts
router.push('/quote/submitted');
```
And initialize `const router = useRouter();` at the top of the component.

- [ ] **Step 3: Remove the inline `done` UI block**

Whatever renders when `status === 'done'` is now dead. Delete it. Keep `loading` and `error` branches.

- [ ] **Step 4: Manual smoke test**

`npm run dev`, open `/`, scroll to form, fill required fields with throwaway values, submit. Confirm browser navigates to `/quote/submitted` and Cal.com widget loads. Confirm a row landed in Supabase via:
```bash
# from a different shell, in shippingcow-admin
grep -rn 'supabase\.from..quote_requests' app/api
# then check the prod Supabase quote_requests table for the new row
```

- [ ] **Step 5: Commit**

```bash
git add app/_quote-form.tsx
git commit -m "feat(form): redirect to /quote/submitted on successful POST"
```

---

### Task 7: Update root layout metadata + nav active states

The root layout still says "ShippingCow Admin" in `<title>`. Public pages each have their own metadata but the root applies as fallback. Fix.

**Files:**
- Modify: `app/layout.tsx`
- Modify: `components/shell/public-nav.tsx` (active-state highlighting)

- [ ] **Step 1: Update `app/layout.tsx` metadata**

```ts
export const metadata: Metadata = {
  title: {
    default: 'ShippingCow — The 3PL for 50–149lb items',
    template: '%s · ShippingCow',
  },
  description: 'Built for Shopify & TikTok Shop sellers shipping 50–149lb items. Dim factor 225, 3-warehouse zone skipping, transparent dashboard.',
};
```

- [ ] **Step 2: Wire `currentPath` highlighting in `<PublicNav>`**

For each nav link, compare `href` against `currentPath` and apply a `borderBottom: '3px solid ${BRAND.yellow}'` style when active. Don't add a separate `.active` class — keep inline-style discipline.

- [ ] **Step 3: Build + smoke test**

`npm run dev`. Visit `/`, `/how-it-works`, `/pricing`, `/quote/submitted`. Confirm: tab title updates per page; active nav item is underlined.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx components/shell/public-nav.tsx
git commit -m "feat(shell): public-facing metadata + nav active state"
```

---

### Task 8: Tests

Two coverage layers: a unit test for the form payload shape, and an e2e test for the full landing flow.

**Files:**
- Create: `tests/unit/quote-form.test.ts`
- Create: `tests/e2e/landing-flow.spec.ts`

- [ ] **Step 1: Write unit test for form payload normalization**

The form's `handleSubmit` builds a payload from form state. Extract the build logic into a pure function (`buildQuotePayload(formState)`) inside `app/_quote-form.tsx` and export it. Then:

```ts
// tests/unit/quote-form.test.ts
import { describe, it, expect } from 'vitest';
import { buildQuotePayload } from '@/app/_quote-form';

describe('buildQuotePayload', () => {
  it('includes only name + email when optionals are blank', () => {
    const payload = buildQuotePayload({
      name: 'Jane', company: '', email: 'jane@ex.com',
      item_type: '', weight_lbs: '', origin_zip: '',
    });
    expect(payload).toEqual({ name: 'Jane', email: 'jane@ex.com' });
  });

  it('parses weight_lbs as int, skips on NaN', () => {
    const a = buildQuotePayload({ name: 'A', company: '', email: 'a@b.c', item_type: '', weight_lbs: '60', origin_zip: '' });
    expect(a.weight_lbs).toBe(60);
    const b = buildQuotePayload({ name: 'A', company: '', email: 'a@b.c', item_type: '', weight_lbs: 'abc', origin_zip: '' });
    expect(b.weight_lbs).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run unit test — expect PASS**

```bash
npx vitest run tests/unit/quote-form.test.ts -v
```

- [ ] **Step 3: Write e2e test for landing flow**

```ts
// tests/e2e/landing-flow.spec.ts
import { test, expect } from '@playwright/test';

test('landing → quote → submitted', async ({ page }) => {
  await page.goto('http://localhost:3001/');
  await expect(page.getByText(/LIVE — \d+ SELLERS/)).toBeVisible();

  await page.locator('input[name="name"]').fill('E2E Test');
  await page.locator('input[name="email"]').fill('e2e@example.com');
  await page.locator('input[name="weight_lbs"]').fill('75');
  await page.locator('input[name="origin_zip"]').fill('10001');

  await page.getByRole('button', { name: /get|quote|send/i }).click();

  await expect(page).toHaveURL(/\/quote\/submitted/);
  await expect(page.getByText(/Holy Cow/i)).toBeVisible();
  // Cal.com embed renders an iframe — assert presence (don't trust it loads in CI)
  await expect(page.locator('[data-cal-link]')).toBeVisible();
});
```

The form inputs need stable `name` attributes — if the current `<input>` elements don't have them, add `name={field}` in the JSX inside the form's `handleChange` mapping.

- [ ] **Step 4: Run e2e — expect PASS locally**

```bash
npm run test:e2e:install   # one-time
npm run dev &              # in another shell
npx playwright test tests/e2e/landing-flow.spec.ts
```

In CI the Cal.com iframe assertion will fail because there's no network egress for `cal.com`. Add `test.skip(process.env.CI === 'true', 'Cal.com requires live network')` for the iframe assertion only, or split it into a separate `test.describe` block that skips on CI.

- [ ] **Step 5: Commit**

```bash
git add tests/unit/quote-form.test.ts tests/e2e/landing-flow.spec.ts app/_quote-form.tsx
git commit -m "test: cover quote payload + landing→submitted flow"
```

---

### Task 9: Ship

Final verification, push, prod deploy.

- [ ] **Step 1: Full CI-equivalent run locally**

```bash
npm run lint && npm run typecheck && npm test && npm run build
```
Expected: all PASS. Any failure: fix in place, do NOT bypass.

- [ ] **Step 2: Open Vercel preview**

```bash
git push origin <feature-branch>
```
Vercel auto-deploys a preview. Walk the same flow on the preview URL: `/` → form → `/quote/submitted` → calendar loads. Click each nav item.

- [ ] **Step 3: Decision gate (Jay)**

Stop here. Jay reviews preview URL. Approves merge or sends back for revisions.

- [ ] **Step 4: Merge to master (only after Jay approval — requires explicit ask per CLAUDE.md)**

```bash
git checkout master && git pull && git merge --ff-only <feature-branch> && git push origin master
```
Triggers Vercel prod deploy at `shippingcowmvp.vercel.app`.

- [ ] **Step 5: Post-deploy smoke**

Hit `https://shippingcowmvp.vercel.app/`, submit a real (test) quote, verify it lands in `quote_requests` in Supabase prod (`aetvueyuaxbgszcisoci`). Verify Cal.com slot booking flow end-to-end (book → cancel).

- [ ] **Step 6: Update `docs/migrations-applied.md` Vercel section**

Note the project rename (`shippingcow-admin` → `shippingcow`) and the new public URL. Add a line about the 4 public routes shipping.

- [ ] **Step 7: Tell Jay the DM campaign is unblocked**

The DM copy at `docs/campaign/linkedin-dms.md` already points at `https://shippingcowmvp.vercel.app/`. After the Vercel rename + this deploy, the campaign is technically ready to send.

---

## What's deferred (do NOT add to this plan)

- DNS flip to `shippingcow.ai` (do after first 5 demos)
- Resend / `@shippingcow.ai` email sending (blocked by DNS flip)
- Customer portal / post-MSA onboarding (separate plan; on critical path for 2026-06-30 first-paying-customer goal)
- Admin MFA setup page reintroduction (separate concern)
- SEO content silo (`/guides/*`) — channel allocation is 0% SEO; revisit post-launch
- Schema markup, sitemap.xml, robots.txt tuning — basic Next.js defaults are fine for launch; revisit when SEO becomes a channel
- Splitting admin to its own Vercel project — only if/when customer portal lands

## Out-of-scope discovery surfaced during the grill (file as separate work)

- The **customer portal** doesn't exist anywhere — `../shippingcow-nextjs/` referenced in HANDOFF.md is not on disk. First-paying-customer by 2026-06-30 (`marketing-context.md` §13) requires this exist. Flag for next-session planning.
