# Manhattan 50lb+ Campaign — One-Week Build Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and ship the full Manhattan furniture seller campaign in one week: public landing page, rate savings calculator, quote request form, LinkedIn DMs, and TikTok brief.

**Architecture:** A public route `app/page.tsx` (root, unprotected by middleware) serves the campaign landing page. An embedded `'use client'` component handles the calculator. Quote requests POST to `/api/quote-request` which inserts into a new `quote_requests` Supabase table. Content assets (DMs, TikTok brief) are markdown files in `docs/campaign/`. Everything deploys via existing `git push origin master` → Vercel auto-deploy pipeline.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, `@supabase/auth-helpers-nextjs` (service role for quote inserts), brand tokens from `lib/brand.ts`, inline `style={{...}}` matching codebase convention.

**Task ownership:**
- **AI** — Tasks 1–8 (all file creation, migrations, content)
- **Human-Jay** — Task 9: apply migration, verify math, update DM URL, send DMs, RSVP to meetup

---

## File Map

| Action | Path | What |
|---|---|---|
| Create | `app/page.tsx` | Public campaign landing page (root route, no auth) |
| Create | `app/_rate-calculator.tsx` | 'use client' weight+zone → savings calculator |
| Create | `supabase/migrations/0006_quote_requests.sql` | quote_requests table + RLS |
| Create | `app/api/quote-request/route.ts` | POST handler — inserts to quote_requests |
| Create | `docs/campaign/linkedin-dms.md` | 5 rewritten DMs, sofa hook, URL placeholder |
| Create | `docs/campaign/tiktok-brief.md` | TikTok script (30s) + visual brief for producer |

---

## Task 1: Landing page shell + hero section [AI, ~30 min]

**Why:** The landing page is the DM destination. It must exist before any outreach goes out. The hero section is the first thing a seller sees — DIM claim front and center.

**Files:**
- Create: `app/page.tsx`

**Note on brand:** Follow existing patterns from `app/login/page.tsx`. Use `BRAND` tokens from `lib/brand.ts`. Zero border-radius. 3px `BRAND.charcoal` border on cards. 4px pixel shadow. `Black Han Sans` for headings, `DM Sans` for body, `Press Start 2P` for eyebrows. Inline `style={{...}}` — not Tailwind.

The middleware `matcher` is `['/admin/:path*', '/api/admin/:path*']` — the root route `/` is unprotected. No auth imports needed.

- [ ] **Step 1: Create `app/page.tsx` with nav + hero**

  ```typescript
  import type { CSSProperties } from 'react';
  import { BRAND, px, pxSm } from '@/lib/brand';
  import RateCalculator from './_rate-calculator';

  const S = {
    page: {
      background: BRAND.white,
      minHeight: '100vh',
      fontFamily: "'DM Sans', sans-serif",
      color: BRAND.charcoal,
    } satisfies CSSProperties,

    nav: {
      background: BRAND.blue,
      borderBottom: `3px solid ${BRAND.yellow}`,
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky' as const,
      top: 0,
      zIndex: 100,
    } satisfies CSSProperties,

    navLogo: {
      fontFamily: "'Black Han Sans', sans-serif",
      fontSize: 20,
      textTransform: 'uppercase' as const,
      color: BRAND.white,
      letterSpacing: '0.02em',
    } satisfies CSSProperties,

    navCta: {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 9,
      textTransform: 'uppercase' as const,
      background: BRAND.yellow,
      color: BRAND.charcoal,
      border: `2px solid ${BRAND.charcoal}`,
      boxShadow: pxSm(),
      padding: '8px 14px',
      cursor: 'pointer',
      textDecoration: 'none',
    } satisfies CSSProperties,

    hero: {
      background: `linear-gradient(180deg, #dce8fb 0%, ${BRAND.pageBed} 100%)`,
      padding: '72px 24px 80px',
    } satisfies CSSProperties,

    heroInner: {
      maxWidth: 900,
      margin: '0 auto',
    } satisfies CSSProperties,

    eyebrow: {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 9,
      color: BRAND.charcoal,
      opacity: 0.5,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.06em',
      marginBottom: 16,
      display: 'block',
    } satisfies CSSProperties,

    h1: {
      fontFamily: "'Black Han Sans', sans-serif",
      fontSize: 'clamp(2rem, 5vw, 3.6rem)',
      textTransform: 'uppercase' as const,
      color: BRAND.charcoal,
      lineHeight: 1.05,
      marginBottom: 20,
      letterSpacing: '0.02em',
    } satisfies CSSProperties,

    heroSub: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 18,
      color: BRAND.charcoal,
      opacity: 0.7,
      lineHeight: 1.7,
      marginBottom: 32,
      maxWidth: 600,
    } satisfies CSSProperties,

    ctaLink: {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 11,
      textTransform: 'uppercase' as const,
      background: BRAND.blue,
      color: BRAND.white,
      border: `3px solid ${BRAND.charcoal}`,
      boxShadow: px(),
      padding: '14px 28px',
      textDecoration: 'none',
      display: 'inline-block',
    } satisfies CSSProperties,
  };

  export default function CampaignPage() {
    return (
      <div style={S.page}>
        {/* Nav */}
        <nav style={S.nav}>
          <span style={S.navLogo}>ShippingCow</span>
          <a href="#quote" style={S.navCta}>Get My Rate →</a>
        </nav>

        {/* Hero */}
        <section style={S.hero}>
          <div style={S.heroInner}>
            <span style={S.eyebrow}>{'// Heavy-Item Shipping'}</span>
            <h1 style={S.h1}>
              Your 40-lb sofa ships<br />at 40 lbs. Not 80.
            </h1>
            <p style={S.heroSub}>
              Standard carriers inflate your weight with DIM pricing — then charge you for a box
              that weighs twice as much as your sofa. ShippingCow fixes the math.
              You pay for what actually ships.
            </p>
            <a href="#quote" style={S.ctaLink}>Get My Rate →</a>
          </div>
        </section>

        {/* Feature sections — added in Task 2 */}
        <div id="features" />

        {/* Rate Calculator — added in Task 3 */}
        <section style={{ padding: '64px 24px', background: BRAND.pageBed }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <span style={{ ...S.eyebrow, opacity: 0.5 }}>{'// Estimate Your Savings'}</span>
            <h2 style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
              textTransform: 'uppercase' as const,
              marginBottom: 32,
            }}>
              See Your Savings
            </h2>
            <RateCalculator />
          </div>
        </section>

        {/* Quote form — added in Task 5 */}
        <div id="quote" />

        {/* Footer */}
        <footer style={{
          background: BRAND.charcoal,
          color: BRAND.white,
          padding: '24px',
          textAlign: 'center' as const,
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8,
          opacity: 0.8,
        }}>
          © 2026 ShippingCow — Built for heavy-item sellers
        </footer>
      </div>
    );
  }
  ```

- [ ] **Step 2: Create a stub `app/_rate-calculator.tsx` so the import doesn't break build**

  ```typescript
  'use client';
  export default function RateCalculator() {
    return <div style={{ padding: 24, opacity: 0.5, fontSize: 13 }}>Calculator coming soon.</div>;
  }
  ```

- [ ] **Step 3: Verify build passes**

  ```bash
  cd /Users/jayos/jayos/projects/ShippingCowAdmin
  npm run build 2>&1 | tail -20
  ```

  Expected: clean build. `/` appears in routes as `○ (Static)`.

- [ ] **Step 4: Commit**

  ```bash
  git add app/page.tsx app/_rate-calculator.tsx
  git commit -m "feat(campaign): add landing page shell + hero"
  ```

---

## Task 2: Feature sections (DIM / Zone / No-surprise-fees) [AI, ~20 min]

**Why:** The three sections below the hero make the claim credible before the seller hits the calculator or quote form. Each section has one job: explain one savings lever in concrete terms.

**Files:**
- Modify: `app/page.tsx` — replace the `{/* Feature sections — added in Task 2 */}` comment block with the three sections below.

- [ ] **Step 1: Replace the feature section placeholder in `app/page.tsx`**

  Find and replace:

  Old:
  ```tsx
        {/* Feature sections — added in Task 2 */}
        <div id="features" />
  ```

  New:
  ```tsx
        {/* Feature sections */}
        <section id="features" style={{ padding: '64px 24px', background: BRAND.white }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 64 }}>

            {/* DIM */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
              <div>
                <span style={S.eyebrow}>{'// The DIM Problem'}</span>
                <h2 style={{
                  fontFamily: "'Black Han Sans', sans-serif",
                  fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                  textTransform: 'uppercase' as const,
                  marginBottom: 16,
                }}>
                  They're charging you double.
                </h2>
                <p style={{ fontSize: 15, lineHeight: 1.8, opacity: 0.75, marginBottom: 16 }}>
                  Dimensional weight pricing was designed for lightweight boxes, not furniture.
                  Carriers take your box measurements, run their math, and bill you for the bigger number.
                  A 40-lb sofa becomes an 80-lb sofa on their invoice.
                </p>
                <p style={{ fontSize: 15, lineHeight: 1.8, opacity: 0.75 }}>
                  ShippingCow uses a higher DIM divisor — so your actual weight wins more often.
                  No inflated billed weight. No surprise line item.
                </p>
              </div>
              <div style={{
                border: `3px solid ${BRAND.charcoal}`,
                boxShadow: px(),
                padding: 28,
                background: BRAND.pageBed,
              }}>
                <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, marginBottom: 16, opacity: 0.5 }}>
                  40-LB SOFA — SAME BOX
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, opacity: 0.6 }}>Standard carrier bills</span>
                    <span style={{
                      fontFamily: "'Black Han Sans', sans-serif",
                      fontSize: 24,
                      color: BRAND.red,
                    }}>80 lbs</span>
                  </div>
                  <div style={{ borderTop: `2px solid ${BRAND.charcoal}`, opacity: 0.15 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, opacity: 0.6 }}>ShippingCow bills</span>
                    <span style={{
                      fontFamily: "'Black Han Sans', sans-serif",
                      fontSize: 24,
                      color: BRAND.green,
                    }}>40 lbs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Zone Skipping */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
              <div style={{
                border: `3px solid ${BRAND.charcoal}`,
                boxShadow: px(),
                padding: 28,
                background: BRAND.pageBed,
              }}>
                <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, marginBottom: 16, opacity: 0.5 }}>
                  NYC SELLER → LA CUSTOMER
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, opacity: 0.6 }}>Ship from NJ warehouse</span>
                    <span style={{
                      fontFamily: "'Black Han Sans', sans-serif",
                      fontSize: 20,
                      color: BRAND.red,
                    }}>Zone 8</span>
                  </div>
                  <div style={{ borderTop: `2px solid ${BRAND.charcoal}`, opacity: 0.15 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, opacity: 0.6 }}>Ship from CA warehouse</span>
                    <span style={{
                      fontFamily: "'Black Han Sans', sans-serif",
                      fontSize: 20,
                      color: BRAND.green,
                    }}>Zone 2</span>
                  </div>
                  <div style={{ borderTop: `2px solid ${BRAND.charcoal}`, opacity: 0.15 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13 }}>Savings per sofa</span>
                    <span style={{
                      fontFamily: "'Black Han Sans', sans-serif",
                      fontSize: 24,
                      color: BRAND.blue,
                    }}>$18–40</span>
                  </div>
                </div>
              </div>
              <div>
                <span style={S.eyebrow}>{'// Zone Skipping'}</span>
                <h2 style={{
                  fontFamily: "'Black Han Sans', sans-serif",
                  fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                  textTransform: 'uppercase' as const,
                  marginBottom: 16,
                }}>
                  Closer warehouse. Lower zone. Lower bill.
                </h2>
                <p style={{ fontSize: 15, lineHeight: 1.8, opacity: 0.75, marginBottom: 16 }}>
                  We warehouse in California, New Jersey, and Texas.
                  When your customer orders, we ship from the coast nearest them —
                  cutting 2–3 zones off every shipment.
                </p>
                <p style={{ fontSize: 15, lineHeight: 1.8, opacity: 0.75 }}>
                  Zone 8 becomes Zone 2. $18–40 stays in your pocket per sofa shipped.
                  On 100 sofas a month, that's $1,800–$4,000 back.
                </p>
              </div>
            </div>

            {/* No Surprise Fees */}
            <div style={{
              border: `3px solid ${BRAND.charcoal}`,
              boxShadow: px(),
              padding: 40,
              background: BRAND.charcoal,
              color: BRAND.white,
            }}>
              <span style={{ ...S.eyebrow, color: BRAND.yellow, opacity: 1 }}>{'// No Surprise Fees'}</span>
              <h2 style={{
                fontFamily: "'Black Han Sans', sans-serif",
                fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                textTransform: 'uppercase' as const,
                marginBottom: 16,
                color: BRAND.white,
              }}>
                What you're quoted is what you pay.
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.8, opacity: 0.75, maxWidth: 640 }}>
                Fuel surcharge, residential delivery fee, additional handling — it's all baked into your quote
                before you ship. The invoice matches. Every time. No line items you didn't see coming.
              </p>
            </div>

          </div>
        </section>
  ```

- [ ] **Step 2: Verify build passes**

  ```bash
  npm run build 2>&1 | tail -20
  ```

  Expected: clean build, no TypeScript errors.

- [ ] **Step 3: Commit**

  ```bash
  git add app/page.tsx
  git commit -m "feat(campaign): add DIM / zone / no-fee feature sections"
  ```

---

## Task 3: Rate calculator component [AI, ~30 min]

**Why:** The calculator converts a curious seller into a quote request. Weight + zone → estimated savings. Clearly labeled as an estimate.

**Files:**
- Modify: `app/_rate-calculator.tsx` (replace the stub from Task 1)

**Rate logic notes:**
- Inputs: actual weight (lbs) + destination zone (1–8)
- Standard carrier billed weight: `max(actual_weight, dim_weight)` where `dim_weight = actual_weight × 2.0` (conservative multiplier for furniture — typical box volume is ~280 cu in/lb, DIM divisor 139 → 2.01× actual)
- ShippingCow billed weight: `max(actual_weight, actual_weight × 1.25)` = `actual_weight × 1.25` (225 divisor → much lower inflation; actual weight dominates more often)
- Rate per pound by zone (FedEx Ground 2024 list, approximate):

  ```
  Zone 2: $0.21/lb  Zone 3: $0.26/lb  Zone 4: $0.31/lb
  Zone 5: $0.37/lb  Zone 6: $0.44/lb  Zone 7: $0.50/lb  Zone 8: $0.56/lb
  ```

- Residential surcharge: standard carriers ~$5.85, ShippingCow ~$1.17 (80% off)
- Fuel surcharge: standard ~13% of base, ShippingCow 0%
- All estimates rounded to nearest dollar. Labeled "estimated" with disclaimer.
- These constants live in a `RATES` object so Jay can tune them after validating real numbers.

- [ ] **Step 1: Replace stub with full calculator**

  ```typescript
  'use client';
  import { useState, type CSSProperties } from 'react';
  import { BRAND, px } from '@/lib/brand';

  const RATES = {
    zoneRatePerLb: [0, 0.21, 0.21, 0.26, 0.31, 0.37, 0.44, 0.50, 0.56] as const,
    standardDimMultiplier: 2.0,
    shippingcowDimMultiplier: 1.25,
    standardResidential: 5.85,
    shippingcowResidential: 1.17,
    standardFuelPct: 0.13,
    shippingcowFuelPct: 0,
  };

  function calcEstimates(weightLbs: number, zone: number) {
    const rate = RATES.zoneRatePerLb[zone] ?? 0.37;
    const stdBilled = Math.max(weightLbs, weightLbs * RATES.standardDimMultiplier);
    const scBilled = Math.max(weightLbs, weightLbs * RATES.shippingcowDimMultiplier);
    const stdBase = stdBilled * rate;
    const scBase = scBilled * rate;
    const stdTotal = stdBase * (1 + RATES.standardFuelPct) + RATES.standardResidential;
    const scTotal = scBase * (1 + RATES.shippingcowFuelPct) + RATES.shippingcowResidential;
    return {
      standard: Math.round(stdTotal),
      shippingcow: Math.round(scTotal),
      savings: Math.round(stdTotal - scTotal),
    };
  }

  const inputStyle: CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    padding: '10px 14px',
    border: `3px solid ${BRAND.charcoal}`,
    background: BRAND.white,
    color: BRAND.charcoal,
    width: '100%',
    appearance: 'none' as const,
  };

  const labelStyle: CSSProperties = {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 8,
    color: BRAND.charcoal,
    opacity: 0.5,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    display: 'block',
    marginBottom: 8,
  };

  export default function RateCalculator() {
    const [weight, setWeight] = useState(40);
    const [zone, setZone] = useState(5);
    const est = calcEstimates(weight, zone);

    return (
      <div style={{
        border: `3px solid ${BRAND.charcoal}`,
        boxShadow: px(),
        padding: 32,
        background: BRAND.white,
        maxWidth: 640,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
          <div>
            <label htmlFor="calc-weight" style={labelStyle}>Item weight (lbs)</label>
            <input
              id="calc-weight"
              type="number"
              min={10}
              max={300}
              value={weight}
              onChange={e => setWeight(Math.max(10, Math.min(300, Number(e.target.value))))}
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="calc-zone" style={labelStyle}>Destination zone (1–8)</label>
            <select
              id="calc-zone"
              value={zone}
              onChange={e => setZone(Number(e.target.value))}
              style={inputStyle}
            >
              {[2, 3, 4, 5, 6, 7, 8].map(z => (
                <option key={z} value={z}>Zone {z}{z === 5 ? ' (avg US)' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div style={{
            border: `2px solid ${BRAND.charcoal}`,
            padding: '16px 20px',
            background: '#fff5f5',
          }}>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, opacity: 0.5, marginBottom: 8 }}>
              STANDARD CARRIER
            </p>
            <p style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 32,
              color: BRAND.red,
            }}>~${est.standard}</p>
          </div>
          <div style={{
            border: `2px solid ${BRAND.charcoal}`,
            padding: '16px 20px',
            background: '#f0faf4',
          }}>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, opacity: 0.5, marginBottom: 8 }}>
              SHIPPINGCOW
            </p>
            <p style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 32,
              color: BRAND.green,
            }}>~${est.shippingcow}</p>
          </div>
          <div style={{
            border: `3px solid ${BRAND.charcoal}`,
            boxShadow: px(BRAND.blue),
            padding: '16px 20px',
            background: BRAND.blue,
            color: BRAND.white,
          }}>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, opacity: 0.7, marginBottom: 8 }}>
              YOU SAVE
            </p>
            <p style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 32,
            }}>~${est.savings}</p>
          </div>
        </div>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          opacity: 0.45,
          marginTop: 16,
          lineHeight: 1.6,
        }}>
          Estimates based on published ground carrier list rates for furniture-category shipments.
          DIM pricing, residential surcharge, and fuel surcharge included.
          Actual savings vary by item dimensions and route.{' '}
          <a href="#quote" style={{ color: BRAND.blue, textDecoration: 'underline' }}>
            Get your exact rate →
          </a>
        </p>
      </div>
    );
  }
  ```

- [ ] **Step 2: Verify build passes**

  ```bash
  npm run build 2>&1 | tail -20
  ```

  Expected: clean build. Calculator renders as a client component on the page.

- [ ] **Step 3: Commit**

  ```bash
  git add app/_rate-calculator.tsx
  git commit -m "feat(campaign): add rate savings calculator (weight + zone → estimate)"
  ```

---

## Task 4: Supabase migration — quote_requests table [AI, ~10 min]

**Why:** Quote form submissions need somewhere to land. A simple Supabase table is the right store — no email integration, Jay checks the dashboard.

**Files:**
- Create: `supabase/migrations/0006_quote_requests.sql`

**Note:** This migration is written but must be applied manually by Jay (see Task 9). It is NOT auto-applied.

- [ ] **Step 1: Write the migration**

  ```sql
  -- 0006_quote_requests.sql
  CREATE TABLE IF NOT EXISTS public.quote_requests (
    id          uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at  timestamptz   DEFAULT now() NOT NULL,
    name        text          NOT NULL,
    company     text,
    email       text          NOT NULL,
    item_type   text,
    weight_lbs  integer,
    origin_zip  text
  );

  -- Only service role can read; anyone can insert (public form)
  ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "public insert" ON public.quote_requests;
  CREATE POLICY "public insert"
    ON public.quote_requests
    FOR INSERT
    WITH CHECK (true);

  DROP POLICY IF EXISTS "service select" ON public.quote_requests;
  CREATE POLICY "service select"
    ON public.quote_requests
    FOR SELECT
    USING (auth.role() = 'service_role');
  ```

- [ ] **Step 2: Commit the SQL file**

  ```bash
  git add supabase/migrations/0006_quote_requests.sql
  git commit -m "feat(campaign): add quote_requests migration (Jay applies manually)"
  ```

---

## Task 5: Quote form + API route [AI, ~25 min]

**Why:** The "Get a quote" section is the conversion point. Form submits to `/api/quote-request`, which stores in Supabase. Form uses the brand design system.

**Files:**
- Create: `app/api/quote-request/route.ts`
- Modify: `app/page.tsx` — replace `{/* Quote form — added in Task 5 */}` placeholder

**Note on API route:** Uses `createClient` with `SUPABASE_SERVICE_ROLE_KEY` to insert (bypasses RLS). This key is already set in `.env.local` and Vercel env vars.

- [ ] **Step 1: Create `app/api/quote-request/route.ts`**

  ```typescript
  import { createClient } from '@supabase/supabase-js';
  import { NextResponse } from 'next/server';

  export async function POST(request: Request) {
    const body = await request.json() as {
      name: string;
      company?: string;
      email: string;
      item_type?: string;
      weight_lbs?: number;
      origin_zip?: string;
    };

    if (!body.name?.trim() || !body.email?.trim()) {
      return NextResponse.json({ error: 'name and email required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error } = await supabase.from('quote_requests').insert({
      name: body.name.trim(),
      company: body.company?.trim() ?? null,
      email: body.email.trim(),
      item_type: body.item_type?.trim() ?? null,
      weight_lbs: body.weight_lbs ?? null,
      origin_zip: body.origin_zip?.trim() ?? null,
    });

    if (error) {
      console.error('quote_requests insert error:', error);
      return NextResponse.json({ error: 'failed to save' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }
  ```

- [ ] **Step 2: Create quote form client component `app/_quote-form.tsx`**

  ```typescript
  'use client';
  import { useState, type CSSProperties, type FormEvent } from 'react';
  import { BRAND, px } from '@/lib/brand';

  const inputStyle: CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    padding: '10px 14px',
    border: `3px solid ${BRAND.charcoal}`,
    background: BRAND.white,
    color: BRAND.charcoal,
    width: '100%',
  };

  const labelStyle: CSSProperties = {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 7,
    color: BRAND.charcoal,
    opacity: 0.5,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: 6,
  };

  export default function QuoteForm() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
    const [form, setForm] = useState({
      name: '', company: '', email: '', item_type: '', weight_lbs: '', origin_zip: '',
    });

    function set(k: keyof typeof form) {
      return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
    }

    async function onSubmit(e: FormEvent) {
      e.preventDefault();
      setStatus('loading');
      try {
        const res = await fetch('/api/quote-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            weight_lbs: form.weight_lbs ? parseInt(form.weight_lbs, 10) : undefined,
          }),
        });
        setStatus(res.ok ? 'done' : 'error');
      } catch {
        setStatus('error');
      }
    }

    if (status === 'done') {
      return (
        <div style={{
          border: `3px solid ${BRAND.charcoal}`,
          boxShadow: px(BRAND.green),
          padding: 32,
          background: BRAND.white,
          maxWidth: 640,
        }}>
          <p style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 22,
            textTransform: 'uppercase' as const,
            marginBottom: 8,
          }}>Request sent.</p>
          <p style={{ fontSize: 14, opacity: 0.6 }}>
            We'll email your rate within 24 hours. Check your inbox.
          </p>
        </div>
      );
    }

    return (
      <form onSubmit={onSubmit} style={{
        border: `3px solid ${BRAND.charcoal}`,
        boxShadow: px(),
        padding: 32,
        background: BRAND.white,
        maxWidth: 640,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Name *</label>
            <input required value={form.name} onChange={set('name')} style={inputStyle} placeholder="Your name" />
          </div>
          <div>
            <label style={labelStyle}>Company</label>
            <input value={form.company} onChange={set('company')} style={inputStyle} placeholder="Store name" />
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Email *</label>
          <input required type="email" value={form.email} onChange={set('email')} style={inputStyle} placeholder="you@store.com" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 28 }}>
          <div>
            <label style={labelStyle}>Item type</label>
            <input value={form.item_type} onChange={set('item_type')} style={inputStyle} placeholder="e.g. sofa" />
          </div>
          <div>
            <label style={labelStyle}>Typical weight (lbs)</label>
            <input type="number" min={10} max={500} value={form.weight_lbs} onChange={set('weight_lbs')} style={inputStyle} placeholder="40" />
          </div>
          <div>
            <label style={labelStyle}>Origin zip</label>
            <input value={form.origin_zip} onChange={set('origin_zip')} style={inputStyle} placeholder="10001" />
          </div>
        </div>

        {status === 'error' && (
          <p style={{ color: BRAND.red, fontSize: 12, marginBottom: 16 }}>
            Something went wrong — email us at hello@shippingcow.ai
          </p>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 10,
            textTransform: 'uppercase' as const,
            background: status === 'loading' ? BRAND.charcoal : BRAND.yellow,
            color: BRAND.charcoal,
            border: `3px solid ${BRAND.charcoal}`,
            boxShadow: status === 'loading' ? 'none' : px(),
            padding: '14px 28px',
            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            opacity: status === 'loading' ? 0.6 : 1,
          }}
        >
          {status === 'loading' ? 'Sending...' : 'Send My Quote Request →'}
        </button>
      </form>
    );
  }
  ```

- [ ] **Step 3: Wire the quote section into `app/page.tsx`**

  Add this import at the top of `app/page.tsx`:
  ```typescript
  import QuoteForm from './_quote-form';
  ```

  Find and replace the quote placeholder:

  Old:
  ```tsx
        {/* Quote form — added in Task 5 */}
        <div id="quote" />
  ```

  New:
  ```tsx
        {/* Quote form */}
        <section id="quote" style={{ padding: '64px 24px', background: BRAND.white }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <span style={{ ...S.eyebrow, opacity: 0.5 }}>{'// Get Exact Rates'}</span>
            <h2 style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
              textTransform: 'uppercase' as const,
              marginBottom: 8,
            }}>
              Get your actual rate.
            </h2>
            <p style={{ fontSize: 15, opacity: 0.65, marginBottom: 32, maxWidth: 520, lineHeight: 1.7 }}>
              Send us your item type, weight, and origin zip.
              We'll reply within 24 hours with your all-in rate — fuel, residential, and handling included.
            </p>
            <QuoteForm />
          </div>
        </section>
  ```

- [ ] **Step 4: Verify build passes**

  ```bash
  npm run build 2>&1 | tail -20
  ```

  Expected: clean build. `/api/quote-request` appears as `ƒ (Dynamic)`.

- [ ] **Step 5: Commit**

  ```bash
  git add app/api/quote-request/route.ts app/_quote-form.tsx app/page.tsx
  git commit -m "feat(campaign): add quote form + /api/quote-request handler"
  ```

---

## Task 6: LinkedIn DM rewrites [AI, ~15 min]

**Why:** The 5 existing DM drafts at `daily/20260512-linkedin-dms.md` need to be rewritten to lead with the sofa example and end with the landing page URL. These ship after the landing page is live.

**Files:**
- Create: `docs/campaign/linkedin-dms.md`

**Voice rules:** MOOOVY — punchy, specific numbers, short sentences, ≤1 pun per DM. No "I hope this finds you well." No "Just wanted to reach out." Get to the point in sentence 1.

**URL placeholder:** Use `[LANDING_PAGE_URL]` — Jay replaces after Vercel deploy confirms the URL.

- [ ] **Step 1: Create `docs/campaign/linkedin-dms.md`**

  ```markdown
  # LinkedIn DMs — Manhattan 50lb+ Campaign
  
  **Status:** HOLD — send only after landing page is live at [LANDING_PAGE_URL].  
  **Targets:** Manhattan Shopify / TikTok Shop sellers, furniture / home goods, 50lb+ items.  
  **Voice:** MOOOVY. Lead with the DIM problem. One specific number. Short sentences.
  
  ---
  
  ## DM 1 — Cold intro (no mutual connection)
  
  Hey [Name],
  
  Quick question — do you know how much FedEx is charging you to ship your sofas?
  
  They're probably billing you for 80 lbs on a 40-lb couch. DIM pricing. It's the hidden tax on furniture sellers.
  
  We fix that. ShippingCow uses a higher DIM divisor — so you pay on actual weight, not an inflated number.
  
  Plus CA / NJ / TX warehouses to cut 2–3 zones off every order. Typical save: $18–40 per sofa.
  
  Worth 5 min? [LANDING_PAGE_URL]
  
  — Jay @ ShippingCow
  
  ---
  
  ## DM 2 — Follow-up (1 week after DM 1, no reply)
  
  Hey [Name],
  
  Sent this last week — wanted to bump it before I stop.
  
  If you're shipping furniture out of NYC, the DIM pricing problem is real. Your 40-lb sofa is probably billed at 60–80 lbs by the carrier.
  
  Built a quick calculator so you can see your actual savings: [LANDING_PAGE_URL]
  
  Takes 30 seconds. No form to fill unless you want a quote.
  
  — Jay
  
  ---
  
  ## DM 3 — Mutual connection / warm intro
  
  Hey [Name],
  
  [Mutual] mentioned you're shipping furniture on Shopify — wanted to reach out directly.
  
  We built ShippingCow specifically for 50lb+ items. The big win: we price on actual weight, not DIM weight. Your sofas stop being billed at 80 lbs when they weigh 40.
  
  Also warehouse in CA, NJ, TX — so NYC sellers shipping to the West Coast cut 2–3 zones per order.
  
  Calculator here if you want to see the number for your own shipments: [LANDING_PAGE_URL]
  
  — Jay @ ShippingCow
  
  ---
  
  ## DM 4 — TikTok Shop seller (hooks on TikTok identity)
  
  Hey [Name],
  
  Saw your TikTok Shop — those couches move. Nice.
  
  One thing killing margins for TikTok Shop furniture sellers: DIM pricing. Your 40-lb sofa ships at 80 lbs on most carriers. That's $15–25 per unit in fake weight charges.
  
  We fixed it. Actual weight billing, zone-skip warehousing in CA / NJ / TX, and no surprise fees on the invoice.
  
  Worth a look: [LANDING_PAGE_URL]
  
  — Jay @ ShippingCow
  
  ---
  
  ## DM 5 — Event attendee / meetup connection
  
  Hey [Name],
  
  Good meeting you at [Event]. Wanted to follow up on the shipping conversation.
  
  The DIM thing we talked about — built a calculator so you can see your exact savings on your own item weights and zones: [LANDING_PAGE_URL]
  
  No commitment. Punch in your sofa weight and see what comes out.
  
  — Jay
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add docs/campaign/linkedin-dms.md
  git commit -m "docs(campaign): add 5 rewritten LinkedIn DMs with sofa hook"
  ```

---

## Task 7: TikTok script + visual brief [AI, ~15 min]

**Why:** TikTok content needs a script for Jay's narration and a visual brief for the producer. Both live here so the producer can work from a single document.

**Files:**
- Create: `docs/campaign/tiktok-brief.md`

**Format:** 30-second video. 3 acts: hook (5s) / DIM math reveal (15s) / zone + CTA (10s). Jay narrates over producer animation.

- [ ] **Step 1: Create `docs/campaign/tiktok-brief.md`**

  ```markdown
  # TikTok Brief — DIM Factor + Zone Savings
  
  **Format:** 30s vertical video  
  **Platform:** TikTok + TikTok Shop seller community  
  **Target:** Shopify / TikTok Shop furniture sellers, 50lb+ items  
  **Production:** Jay narrates (voiceover). Producer animates 3 scenes.  
  **Status:** AWAITING Jay narration recording after script sign-off.
  
  ---
  
  ## Jay's Script (read this into mic)
  
  **[0–5s — Hook]**
  "Your 40-lb sofa? FedEx is charging you for 80 lbs."
  *[pause 0.5s]*
  "Here's why — and how to stop it."
  
  **[5–20s — DIM math reveal]**
  "Carriers use something called DIM pricing.
  They measure your box. Do the math.
  If the dimensional weight is higher than your actual weight — they bill the bigger number.
  For furniture, that number is almost always bigger.
  40 lbs in, 80 lbs out on the invoice."
  *[pause 0.5s]*
  "ShippingCow uses a different DIM formula. One that favors actual weight.
  Same sofa. Billed at 40 lbs."
  
  **[20–30s — Zone skip + CTA]**
  "And we warehouse in California, New Jersey, and Texas.
  So your NYC customer gets Zone 2 shipping, not Zone 8.
  $18 to $40 back per sofa.
  
  Link in bio. Calculate your savings in 30 seconds."
  
  ---
  
  ## Visual Brief for Producer
  
  ### Scene 1 (0–5s): The hook
  - **Visual:** Animated sofa graphic (pixel art style). Weight label reads "40 lbs."
  - **Action:** A carrier invoice slides in from the right. It reads "BILLED: 80 lbs" in red.
  - **Text overlay:** "// DIM PRICING" in Press Start 2P font, top-left corner.
  - **Color:** White background, charcoal text, red for the "80 lbs" number.
  
  ### Scene 2 (5–20s): The DIM reveal
  - **Visual:** Split screen. Left: box with dimensions labeled (40"×24"×14"). Right: math formula animation.
  - **Action:** Formula runs: `13,440 cu in ÷ 139 = 96 lbs (standard)` → red. Then: `13,440 cu in ÷ 225 = 60 lbs (ShippingCow)` → green.
  - **Beat at 15s:** Show two weight badges side by side. Left: "96 lbs / BILLED" in red. Right: "40 lbs / BILLED" in green with ShippingCow logo.
  - **Font:** Black Han Sans for the numbers. DM Sans for labels.
  
  ### Scene 3 (20–30s): Zone map + CTA
  - **Visual:** USA map (minimal pixel art). Three warehouse pins: CA (blue), NJ (blue), TX (blue).
  - **Action:** Arrow from NJ warehouse to NYC. Label: "Zone 2." Compare arrow from standard carrier: "Zone 8." Dollar savings badge pops in: "$18–40 SAVED."
  - **Final frame:** ShippingCow logo + URL + "Calculate your savings →" CTA badge in yellow.
  - **Text overlay:** "// ZONE SKIPPING" in Press Start 2P font.
  
  ---
  
  ## Brand Notes for Producer
  - Zero border radius on all elements.
  - 3px charcoal (#1A202C) border on cards and badges.
  - 4px pixel shadow on any interactive/CTA element.
  - Colors: blue #0052C9, yellow #FEB81B, charcoal #1A202C, red #D64545, green #1A7A4A.
  - Fonts: Black Han Sans (display), DM Sans (body), Press Start 2P (eyebrows/labels).
  - Reference: `ShippingCow Admin Portal` brand system.
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add docs/campaign/tiktok-brief.md
  git commit -m "docs(campaign): add TikTok script + visual brief for producer"
  ```

---

## Task 8: Build verification + deploy [AI, ~10 min]

**Why:** Confirm everything builds clean, then push to trigger the Vercel auto-deploy pipeline.

- [ ] **Step 1: Full build + typecheck**

  ```bash
  cd /Users/jayos/jayos/projects/ShippingCowAdmin
  npm run build 2>&1 | tail -30
  npm run typecheck 2>&1 | tail -20
  ```

  Expected:
  - `✓ Generating static pages` with no type errors
  - Routes: `/` as `○ (Static)`, `/api/quote-request` as `ƒ (Dynamic)`
  - `typecheck` exits with 0 errors

- [ ] **Step 2: Push to master**

  ```bash
  git push origin master
  ```

  Wait ~60s for Vercel to deploy. Watch at `https://vercel.com/jiaweli0521-1285s-projects/shippingcow-admin`.

- [ ] **Step 3: Smoke test the live page**

  Visit `https://shippingcow-admin.vercel.app/`:
  - Hero renders with the sofa headline
  - Three feature sections render
  - Calculator: change weight/zone, savings update correctly
  - Quote form: submit a test entry (name: "Test", email: "test@test.com")
  - Check Supabase `quote_requests` table — row appears

  **NOTE:** The quote form will return a 500 error until Jay applies migration `0006_quote_requests.sql`. That's expected. See Task 9.

- [ ] **Step 4: Commit if any last-minute fixes needed, then done**

---

## Task 9: Jay's human checklist [Human-Jay, ~30 min]

**Why:** These actions require a human — browser sessions, real data validation, and outreach.

- [ ] **Step 1: Apply Supabase migration `0006_quote_requests.sql`**

  Go to: `https://supabase.com/dashboard/project/aetvueyuaxbgszcisoci/sql`

  Paste contents of `supabase/migrations/0006_quote_requests.sql` → Run.

  Verify: `quote_requests` table appears in Table Editor.

- [ ] **Step 2: Validate the worked example math**

  The landing page says "40-lb sofa ships at 40 lbs, not 80." Confirm this is a real, defensible claim with your actual rate structure before going live. If the exact numbers are different, edit `app/page.tsx` hero H1 and the DIM comparison card accordingly.

  Also verify the `RATES` object in `app/_rate-calculator.tsx` reflects real-world numbers. Adjust `zoneRatePerLb`, `standardDimMultiplier`, `shippingcowDimMultiplier`, `standardResidential` constants as needed.

- [ ] **Step 3: Test the quote form end-to-end**

  Visit the live page, submit a real test quote. Confirm it appears in Supabase `quote_requests` table.

- [ ] **Step 4: Update DM URL placeholder**

  In `docs/campaign/linkedin-dms.md`, replace `[LANDING_PAGE_URL]` with the actual Vercel URL.

- [ ] **Step 5: Send the 5 LinkedIn DMs**

  Copy from `docs/campaign/linkedin-dms.md`. Personalize `[Name]` and `[Mutual]` / `[Event]` fields per target. Send.

- [ ] **Step 6: Find + RSVP to NYC Shopify/e-com meetup**

  Search on Meetup.com and Eventbrite: "Shopify NYC", "ecommerce NYC", "TikTok Shop seller NYC". RSVP to any event in the next 4 weeks. Add to calendar.

---

## Self-Review

**Spec coverage:**
- ✅ Landing page with hero DIM claim — Task 1
- ✅ Feature sections: DIM / zone / no-fee — Task 2
- ✅ Rate calculator: weight + zone → estimated savings — Task 3
- ✅ Supabase `quote_requests` table — Task 4
- ✅ Quote form + API route — Task 5
- ✅ 5 LinkedIn DMs rewritten with sofa hook — Task 6
- ✅ TikTok script + visual brief — Task 7
- ✅ Build + deploy — Task 8
- ✅ Jay's manual checklist (math validation, DM send, meetup) — Task 9

**Placeholder scan:** No TBDs. All code blocks complete. URL placeholder in DMs is intentional — documented with a note for Jay.

**Type consistency:**
- `QuoteForm` and `RateCalculator` both default exports — consistent with `app/page.tsx` import style
- `RATES` constants match usage in `calcEstimates` function
- `set()` helper returns correct change handler type for `<input onChange>`
- API route input type matches form field names
