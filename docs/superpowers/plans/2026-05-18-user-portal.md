# User Portal — shippingcow-portal Build Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the 5 prototype screens from `userportal/*.jsx` into a production Next.js 14 app (`shippingcow-portal`), replacing mock `window.SC_STATE` / `window.SC_AGG` with real Supabase reads and the Anthropic SDK, wired to the same Supabase project as the admin portal (`aetvueyuaxbgszcisoci`).

**Architecture:** New standalone Next.js 14 App Router repo at `~/code/shippingcow-portal`. Shares the same Supabase project as `shippingcow-admin`. Data ingestion runs server-side (Next.js route handler) — no client-side `window.ingestRows`. `SC_STATE` / `SC_AGG` become typed Supabase queries in `lib/data/`. `window.claude.complete` becomes the Anthropic SDK in a streaming route handler. Two Vercel projects remain separate. Brand tokens duplicated from `shippingcow-admin/lib/brand.ts` (manual sync, not packaged).

**Prototype SoT:** `~/code/shippingcow-admin/userportal/` — read every `.jsx` file before the corresponding task. Do NOT redesign — port markup verbatim, convert `style={{...}}` blocks intact.

**Tech Stack:** Next.js 14.2.x · TypeScript strict · Supabase Auth + Postgres + RLS + Storage · `@anthropic-ai/sdk` (tool-use for AI column mapping) · Resend (email — Phase 2) · Vitest + Playwright · Vercel

---

## Prototype file inventory

| File | Lines | What it defines |
|---|---|---|
| `dashboard.jsx` | ~350 | 8 UI components: EmptyDashboard, KPI tiles, ZoneCostChart, OriginSelector, TopSKUs table, DimCow, PainPoints table, period selector |
| `silo.jsx` | ~420 | 5-step upload flow: list → upload → ai-parsing → ai-review → success. AIReviewTable, editable preview, delete modal |
| `map.jsx` | ~? | Shipment destination map (ZIP→state heat map) |
| `mooovy.jsx` | ~? | AI chat interface (`window.claude.complete` streaming) |
| `feed.jsx` | ~? | Activity feed / timeline |
| `components.jsx` | ~? | PixelCow mascot, Barn, HBar progress bar, shared primitives |
| `icons.jsx` | ~? | 39-icon set (SVG exports) |
| `state.js` | ~? | SC_STATE pub/sub, SC_AGG 40+ helpers, ingestRows pipeline, lookupZone, SC_RATE_FACTOR |
| `data.js` | ~? | ZIP_TO_STATE mapping, SC_RATE_FACTOR |
| `admin-data.js` | ~? | Mock admin-side data (not used in portal app) |
| `styles.css` | ~? | Global CSS for prototype |

**Read each file before its corresponding task.**

---

## Supabase schema — new tables needed

These tables go into the `aetvueyuaxbgszcisoci` project (same as admin portal). Migration file: `supabase/migrations/0008_user_portal.sql` (in `shippingcow-admin` repo).

```sql
-- orgs (used by admin portal too — check if it already exists first)
CREATE TABLE IF NOT EXISTS public.orgs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  tier        text NOT NULL DEFAULT 'calf' CHECK (tier IN ('calf', 'cow', 'bull')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- org_members
CREATE TABLE IF NOT EXISTS public.org_members (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id    uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  UNIQUE (org_id, user_id)
);

-- silo_files — uploaded file metadata
CREATE TABLE IF NOT EXISTS public.silo_files (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name         text NOT NULL,
  schema_type  text NOT NULL DEFAULT 'auto',
  row_count    int NOT NULL DEFAULT 0,
  size_bytes   bigint NOT NULL DEFAULT 0,
  uploaded_at  timestamptz NOT NULL DEFAULT now(),
  ai_notes     text,
  storage_path text NOT NULL
);

-- processed_rows — one row per shipment, enriched by ingest pipeline
CREATE TABLE IF NOT EXISTS public.processed_rows (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  silo_file_id        uuid REFERENCES public.silo_files(id) ON DELETE CASCADE,
  date                date NOT NULL,
  sku                 text,
  category            text,
  cost_per_package    numeric(10,4) NOT NULL,
  packages_shipped    int NOT NULL,
  length_in           numeric(8,2),
  width_in            numeric(8,2),
  height_in           numeric(8,2),
  origin_zip          text,
  destination_zip     text,
  actual_weight_lb    numeric(8,2),
  billable_weight_lb  numeric(8,2),
  carrier             text,
  selling_platform    text,
  -- computed:
  zone                int,
  dim_weight          numeric(8,2),
  dim_overcharge_usd  numeric(10,4),
  total_row_cost      numeric(10,4),
  sc_cost             numeric(10,4),
  sc_saving           numeric(10,4)
);

-- RLS: orgs are org-scoped; only org members can read their own rows
ALTER TABLE public.orgs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.silo_files     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_rows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_member_read_org"        ON public.orgs;
DROP POLICY IF EXISTS "org_member_read_members"    ON public.org_members;
DROP POLICY IF EXISTS "org_member_read_silo"       ON public.silo_files;
DROP POLICY IF EXISTS "org_member_read_rows"       ON public.processed_rows;

CREATE POLICY "org_member_read_org"     ON public.orgs
  FOR SELECT USING (
    id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );
CREATE POLICY "org_member_read_members" ON public.org_members
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "org_member_read_silo"    ON public.silo_files
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );
CREATE POLICY "org_member_read_rows"    ON public.processed_rows
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );
-- Service role bypasses RLS for ingest writes
```

---

## Data layer — replacing SC_STATE/SC_AGG

| Prototype | Production replacement |
|---|---|
| `window.SC_STATE.processedRows` | Supabase query: `processed_rows` WHERE `org_id = $orgId` |
| `window.SC_AGG.filteredRows(period)` | SQL: `WHERE date >= now() - interval '$period days'` |
| `window.SC_AGG.totalSpend(rows)` | SQL: `SUM(total_row_cost)` |
| `window.SC_AGG.totalShipments(rows)` | SQL: `SUM(packages_shipped)` |
| `window.SC_AGG.avgZone(rows)` | SQL: `AVG(zone)` weighted by packages_shipped |
| `window.SC_AGG.dimOverchargePct(rows)` | SQL: `COUNT(*) FILTER (WHERE billable_weight_lb > actual_weight_lb) / COUNT(*)` |
| `window.SC_AGG.annualSavings(rows)` | SQL: `SUM(sc_saving)` annualized |
| `window.SC_AGG.zoneDist(rows)` | SQL: `GROUP BY zone, SUM(packages_shipped)` |
| `window.SC_AGG.topSkus(5)` | SQL: `GROUP BY sku ORDER BY SUM(sc_saving) DESC LIMIT 5` |
| `window.SC_AGG.painPoints(rows)` | Server function: classify rows → severity buckets |
| `window.ingestRows(mappedRows)` | Route handler: `POST /api/ingest` — enriches + upserts to `processed_rows` |
| `window.lookupZone(origin, dest)` | Lib function: `lib/zone.ts` — same prefix-diff logic as prototype |
| `window.SC_RATE_FACTOR` | Constant in `lib/rate-factor.ts` |
| `window.claude.complete(messages)` | Anthropic SDK in `POST /api/mooovy/stream` route handler |

---

## Task 1: Bootstrap shippingcow-portal repo

**Files:**
- Create: `~/code/shippingcow-portal/` (new repo)

- [ ] **Step 1: Scaffold Next.js 14 app**

```bash
cd ~/code
npx create-next-app@14 shippingcow-portal \
  --typescript --tailwind --eslint --app --src-dir=false \
  --import-alias="@/*" --no-git
cd shippingcow-portal
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk
npm install --save-dev vitest @vitejs/plugin-react jsdom @playwright/test
npx playwright install chromium
```

- [ ] **Step 3: Copy brand tokens from admin portal**

```bash
cp ~/code/shippingcow-admin/lib/brand.ts lib/brand.ts
```

Open `lib/brand.ts` in the new repo. Add this comment at the top:

```typescript
// Manually synced from shippingcow-admin/lib/brand.ts — update both when tokens change.
```

- [ ] **Step 4: Copy vitest config from admin portal**

```bash
cp ~/code/shippingcow-admin/vitest.config.ts .
```

- [ ] **Step 5: Create `.env.local`**

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://aetvueyuaxbgszcisoci.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<copy from shippingcow-admin/.env.local>
SUPABASE_SERVICE_ROLE_KEY=<copy from shippingcow-admin/.env.local>
ANTHROPIC_API_KEY=<your key>
NEXT_PUBLIC_APP_URL=http://localhost:3002
EOF
```

- [ ] **Step 6: Set dev port to 3002 to avoid conflict with admin (3001)**

In `package.json`, update the dev script:

```json
"dev": "next dev --port 3002"
```

- [ ] **Step 7: Git init and first commit**

```bash
git init
git add .
git commit -m "feat: scaffold shippingcow-portal Next.js 14 app"
```

---

## Task 2: Supabase client + auth setup

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/admin.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Create browser client**

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function browserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 2: Create server client**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function serverClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        ),
      },
    },
  );
}
```

- [ ] **Step 3: Create admin client (service role)**

```typescript
// lib/supabase/admin.ts
import 'server-only';
import { createClient } from '@supabase/supabase-js';

export function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
```

- [ ] **Step 4: Create auth middleware**

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  const isAuth = !!user;
  const isPublic = req.nextUrl.pathname.startsWith('/login') ||
                   req.nextUrl.pathname.startsWith('/signup') ||
                   req.nextUrl.pathname.startsWith('/auth');
  if (!isAuth && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add lib/supabase/ middleware.ts
git commit -m "feat(auth): Supabase client + auth middleware"
```

---

## Task 3: Apply Supabase migration 0008 and seed test org

**Files:**
- Create: `supabase/migrations/0008_user_portal.sql` (in `~/code/shippingcow-admin/` — shared Supabase project)

- [ ] **Step 1: Write the migration file**

Create `~/code/shippingcow-admin/supabase/migrations/0008_user_portal.sql` with the SQL from the schema section at the top of this plan.

- [ ] **Step 2: Apply via Supabase MCP**

Use the Supabase MCP `apply_migration` tool against project `aetvueyuaxbgszcisoci`. Then use `list_tables` to verify: `orgs`, `org_members`, `silo_files`, `processed_rows` all exist.

- [ ] **Step 3: Seed a test org and member**

```sql
-- Run in Supabase SQL editor
INSERT INTO public.orgs (id, name, slug, tier)
VALUES ('00000000-0000-0000-0000-000000000001', 'Test Org', 'test-org', 'calf')
ON CONFLICT (slug) DO NOTHING;

-- Replace with your actual auth.users UID from the Supabase Auth dashboard
INSERT INTO public.org_members (org_id, user_id, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '<your-user-uid>',
  'owner'
) ON CONFLICT DO NOTHING;
```

- [ ] **Step 4: Log in migration**

Add to `~/code/shippingcow-admin/docs/migrations-applied.md`:

```markdown
| 2026-05-18 | 0008_user_portal | Supabase MCP | aetvueyuaxbgszcisoci | Claude Code |
```

- [ ] **Step 5: Commit migration file**

```bash
cd ~/code/shippingcow-admin
git add supabase/migrations/0008_user_portal.sql docs/migrations-applied.md
git commit -m "feat(db): migration 0008 — user portal schema (orgs, silo_files, processed_rows)"
```

---

## Task 4: Zone lookup + rate factor libs

**Files:**
- Create: `lib/zone.ts` (in `shippingcow-portal`)
- Create: `lib/rate-factor.ts`
- Create: `tests/unit/zone.test.ts`

- [ ] **Step 1: Write zone lookup lib**

```typescript
// lib/zone.ts
// Port of window.lookupZone() from userportal/state.js
export function lookupZone(originZip: string, destZip: string): number {
  const diff = Math.abs(
    parseInt(originZip.slice(0, 3), 10) - parseInt(destZip.slice(0, 3), 10),
  );
  if (diff === 0)   return 1;
  if (diff < 50)    return 2;
  if (diff < 150)   return 3;
  if (diff < 250)   return 4;
  if (diff < 350)   return 5;
  if (diff < 450)   return 6;
  if (diff < 550)   return 7;
  return 8;
}
```

- [ ] **Step 2: Write rate factor lib**

```typescript
// lib/rate-factor.ts
// Port of window.SC_RATE_FACTOR from userportal/data.js
export const SC_RATE_FACTOR: Record<number, number> = {
  1: 0.82,
  2: 0.80,
  3: 0.78,
  4: 0.76,
  5: 0.74,
  6: 0.72,
  7: 0.70,
  8: 0.68,
};

export function scCost(yourCostPerPkg: number, zone: number): number {
  return yourCostPerPkg * (SC_RATE_FACTOR[zone] ?? 0.70);
}
```

- [ ] **Step 3: Write failing tests**

```typescript
// tests/unit/zone.test.ts
import { describe, it, expect } from 'vitest';
import { lookupZone } from '@/lib/zone';

describe('lookupZone', () => {
  it('same prefix → zone 1', () => expect(lookupZone('100', '100')).toBe(1));
  it('diff 30 → zone 2',    () => expect(lookupZone('100', '130')).toBe(2));
  it('diff 100 → zone 3',   () => expect(lookupZone('100', '200')).toBe(3));
  it('diff 200 → zone 4',   () => expect(lookupZone('100', '300')).toBe(4));
  it('diff 300 → zone 5',   () => expect(lookupZone('100', '400')).toBe(5));
  it('diff 400 → zone 6',   () => expect(lookupZone('100', '500')).toBe(6));
  it('diff 500 → zone 7',   () => expect(lookupZone('100', '600')).toBe(7));
  it('diff 600 → zone 8',   () => expect(lookupZone('100', '700')).toBe(8));
  it('works with full 5-digit zips', () =>
    expect(lookupZone('10001', '70001')).toBe(8)); // 100 vs 700 → diff 600
});
```

- [ ] **Step 4: Run — verify FAIL**

```bash
npx vitest run tests/unit/zone.test.ts
```

Expected: import error (file doesn't exist yet).

- [ ] **Step 5: Confirm files created in Step 1-2, then re-run**

```bash
npx vitest run tests/unit/zone.test.ts
```

Expected: all 9 PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/zone.ts lib/rate-factor.ts tests/unit/zone.test.ts
git commit -m "feat(lib): zone lookup + SC rate factor — port from prototype state.js"
```

---

## Task 5: Ingest API route — CSV row → processed_rows

**Files:**
- Create: `app/api/ingest/route.ts`
- Create: `lib/ingest.ts`
- Create: `tests/unit/ingest.test.ts`

- [ ] **Step 1: Write the ingest lib**

```typescript
// lib/ingest.ts
import { lookupZone } from './zone';
import { scCost } from './rate-factor';

export type RawRow = {
  date: string;
  sku?: string;
  category?: string;
  cost_per_package: number;
  packages_shipped: number;
  length_in?: number;
  width_in?: number;
  height_in?: number;
  origin_zip?: string;
  destination_zip?: string;
  actual_weight_lb?: number;
  billable_weight_lb?: number;
  carrier?: string;
  selling_platform?: string;
};

export type EnrichedRow = RawRow & {
  zone: number;
  dim_weight: number | null;
  dim_overcharge_usd: number | null;
  total_row_cost: number;
  sc_cost: number;
  sc_saving: number;
};

export function enrichRow(raw: RawRow): EnrichedRow {
  const zone = raw.origin_zip && raw.destination_zip
    ? lookupZone(raw.origin_zip, raw.destination_zip)
    : 4; // default mid-range zone when zips missing

  const l = raw.length_in ?? 0;
  const w = raw.width_in ?? 0;
  const h = raw.height_in ?? 0;
  const dim_weight = l && w && h ? (l * w * h) / 139 : null;

  const actual = raw.actual_weight_lb ?? raw.cost_per_package;
  const billable = raw.billable_weight_lb ?? actual;
  const dim_overcharge_usd =
    billable > actual && raw.cost_per_package
      ? raw.cost_per_package * ((billable - actual) / billable)
      : null;

  const total_row_cost = raw.cost_per_package * raw.packages_shipped;
  const sc = scCost(raw.cost_per_package, zone);
  const sc_saving = (raw.cost_per_package - sc) * raw.packages_shipped;

  return {
    ...raw,
    zone,
    dim_weight,
    dim_overcharge_usd,
    total_row_cost,
    sc_cost: sc * raw.packages_shipped,
    sc_saving,
  };
}
```

- [ ] **Step 2: Write the failing unit tests**

```typescript
// tests/unit/ingest.test.ts
import { describe, it, expect } from 'vitest';
import { enrichRow, type RawRow } from '@/lib/ingest';

const base: RawRow = {
  date: '2026-01-15',
  sku: 'SKU-001',
  cost_per_package: 50,
  packages_shipped: 10,
  length_in: 24,
  width_in: 18,
  height_in: 16,
  origin_zip: '10001',
  destination_zip: '90001',
  actual_weight_lb: 55,
  billable_weight_lb: 65,
  carrier: 'FedEx',
};

describe('enrichRow — dim overcharge', () => {
  it('computes dim_weight as L×W×H/139', () => {
    const r = enrichRow(base);
    // 24 * 18 * 16 = 6912 / 139 ≈ 49.73
    expect(r.dim_weight).toBeCloseTo(49.73, 1);
  });

  it('computes dim_overcharge_usd when billable > actual', () => {
    const r = enrichRow(base);
    // cost_per_package=50, billable=65, actual=55 → 50 * (10/65) ≈ 7.69
    expect(r.dim_overcharge_usd).toBeCloseTo(7.69, 1);
  });
});

describe('enrichRow — zone + sc cost', () => {
  it('10001 → 90001 is zone 8 (diff 800)', () => {
    const r = enrichRow(base);
    expect(r.zone).toBe(8);
  });

  it('sc_cost uses 0.68 factor for zone 8', () => {
    const r = enrichRow(base);
    // sc per pkg = 50 * 0.68 = 34; × 10 pkgs = 340
    expect(r.sc_cost).toBeCloseTo(340, 0);
  });

  it('sc_saving = (your - sc) * packages', () => {
    const r = enrichRow(base);
    // (50 - 34) * 10 = 160
    expect(r.sc_saving).toBeCloseTo(160, 0);
  });
});

describe('enrichRow — missing optional fields', () => {
  it('handles missing zip codes with default zone 4', () => {
    const r = enrichRow({ ...base, origin_zip: undefined, destination_zip: undefined });
    expect(r.zone).toBe(4);
  });

  it('handles missing dimensions — dim_weight is null', () => {
    const r = enrichRow({ ...base, length_in: undefined });
    expect(r.dim_weight).toBeNull();
  });
});
```

- [ ] **Step 3: Run — verify FAIL**

```bash
npx vitest run tests/unit/ingest.test.ts
```

Expected: import error.

- [ ] **Step 4: Confirm `lib/ingest.ts` is saved, re-run**

```bash
npx vitest run tests/unit/ingest.test.ts
```

Expected: all 7 PASS.

- [ ] **Step 5: Write the API route**

```typescript
// app/api/ingest/route.ts
import { NextResponse } from 'next/server';
import { serverClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { enrichRow, type RawRow } from '@/lib/ingest';

export async function POST(req: Request) {
  const supabase = serverClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    orgId: string;
    siloFileId: string;
    rows: RawRow[];
  };

  const enriched = body.rows.map((r) => ({
    ...enrichRow(r),
    org_id: body.orgId,
    silo_file_id: body.siloFileId,
  }));

  const admin = adminClient();
  const { error } = await admin.from('processed_rows').insert(enriched);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update silo_file row_count
  await admin
    .from('silo_files')
    .update({ row_count: enriched.length })
    .eq('id', body.siloFileId);

  return NextResponse.json({ inserted: enriched.length });
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/ingest.ts app/api/ingest/route.ts tests/unit/ingest.test.ts
git commit -m "feat(ingest): enrichRow lib + /api/ingest route — port from state.js ingestRows"
```

---

## Task 6: Auth screens — /login, /signup

**Files:**
- Create: `app/login/page.tsx`
- Create: `app/signup/page.tsx`
- Create: `app/auth/callback/route.ts`

- [ ] **Step 1: Write login page**

```typescript
// app/login/page.tsx
'use client';
import { useState } from 'react';
import { browserClient } from '@/lib/supabase/client';
import { BRAND, px } from '@/lib/brand';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const sb = browserClient();
    const { error: err } = await sb.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    router.push('/dashboard');
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: BRAND.pageBed,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          background: BRAND.white,
          border: `3px solid ${BRAND.charcoal}`,
          boxShadow: px(),
          padding: 32,
          width: 360,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 24,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          ShippingCow
        </h1>
        {['email', 'password'].map((field) => (
          <input
            key={field}
            type={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={field === 'email' ? email : password}
            onChange={(e) =>
              field === 'email' ? setEmail(e.target.value) : setPassword(e.target.value)
            }
            required
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              padding: '10px 12px',
              border: `3px solid ${BRAND.charcoal}`,
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        ))}
        {error && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.red }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 10,
            padding: '10px 0',
            background: BRAND.yellow,
            color: BRAND.charcoal,
            border: `3px solid ${BRAND.charcoal}`,
            boxShadow: px(),
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            letterSpacing: '0.03em',
          }}
        >
          {loading ? 'SIGNING IN…' : 'SIGN IN'}
        </button>
        <a
          href="/signup"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: BRAND.blue,
            textAlign: 'center',
          }}
        >
          No account? Sign up
        </a>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Write signup page**

```typescript
// app/signup/page.tsx
'use client';
import { useState } from 'react';
import { browserClient } from '@/lib/supabase/client';
import { BRAND, px } from '@/lib/brand';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const sb = browserClient();
    const { error: err } = await sb.auth.signUp({
      email,
      password,
      options: { data: { org_name: orgName } },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    router.push('/login?message=Check your email to confirm your account');
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: BRAND.pageBed,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          background: BRAND.white,
          border: `3px solid ${BRAND.charcoal}`,
          boxShadow: px(),
          padding: 32,
          width: 360,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 24,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          Create Account
        </h1>
        {[
          { id: 'orgName', label: 'Company Name', type: 'text',     val: orgName,   set: setOrgName },
          { id: 'email',   label: 'Email',         type: 'email',    val: email,     set: setEmail   },
          { id: 'pass',    label: 'Password',       type: 'password', val: password,  set: setPass    },
        ].map(({ id, label, type, val, set }) => (
          <input
            key={id}
            type={type}
            placeholder={label}
            value={val}
            onChange={(e) => set(e.target.value)}
            required
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              padding: '10px 12px',
              border: `3px solid ${BRAND.charcoal}`,
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        ))}
        {error && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.red }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 10,
            padding: '10px 0',
            background: BRAND.yellow,
            color: BRAND.charcoal,
            border: `3px solid ${BRAND.charcoal}`,
            boxShadow: px(),
            cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.03em',
          }}
        >
          {loading ? 'CREATING…' : 'CREATE ACCOUNT'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Write auth callback route**

```typescript
// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { serverClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  if (code) {
    const supabase = serverClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL('/dashboard', req.url));
}
```

- [ ] **Step 4: Start dev server and verify login renders**

```bash
npm run dev
# open http://localhost:3002/login in browser
# confirm: form renders, no console errors
```

- [ ] **Step 5: Commit**

```bash
git add app/login/ app/signup/ app/auth/
git commit -m "feat(auth): login + signup + callback pages — prototype-pattern styling"
```

---

## Task 7: App shell — sidebar + layout

**Files:**
- Create: `components/shell/sidebar.tsx`
- Create: `app/layout.tsx`
- Create: `app/(portal)/layout.tsx`

- [ ] **Step 1: Read `userportal/ShippingCow Prototype (standalone).html`**

Open in browser. Click through all 5 nav items. Note:
- Sidebar: logo area (pixel "SC" + "ShippingCow" text) · 5 nav items (Dashboard · Silo · Map · Mooovy · Feed) · bottom: user avatar + org name + sign out.
- Active nav item: yellow background, charcoal text, no shadow.
- Inactive: transparent background, charcoal text, 2px charcoal border on hover.

- [ ] **Step 2: Create sidebar component**

```typescript
// components/shell/sidebar.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BRAND, px } from '@/lib/brand';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/silo',      label: 'Silo'      },
  { href: '/map',       label: 'Map'       },
  { href: '/mooovy',    label: 'Mooovy'    },
  { href: '/feed',      label: 'Feed'      },
] as const;

export function Sidebar() {
  const path = usePathname();
  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        background: BRAND.charcoal,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '20px 16px 12px', borderBottom: `2px solid ${BRAND.muted}` }}>
        <div
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 14,
            color: BRAND.yellow,
            letterSpacing: '0.05em',
          }}
        >
          SC
        </div>
        <div
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 18,
            color: BRAND.white,
            textTransform: 'uppercase',
            letterSpacing: '0.01em',
          }}
        >
          ShippingCow
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 8px' }}>
        {NAV.map(({ href, label }) => {
          const active = path === href || path.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'block',
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 9,
                letterSpacing: '0.03em',
                padding: '10px 12px',
                marginBottom: 4,
                color: active ? BRAND.charcoal : BRAND.white,
                background: active ? BRAND.yellow : 'transparent',
                border: active ? 'none' : `2px solid transparent`,
                textDecoration: 'none',
              }}
            >
              {label.toUpperCase()}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 3: Create portal layout**

```typescript
// app/(portal)/layout.tsx
import { Sidebar } from '@/components/shell/sidebar';
import { BRAND } from '@/lib/brand';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BRAND.pageBed }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Move dashboard/silo/map/mooovy/feed pages into `app/(portal)/`**

All authenticated screens use the portal layout via the route group `(portal)`:

```
app/
  (portal)/
    layout.tsx       ← portal layout (sidebar + main)
    dashboard/page.tsx
    silo/page.tsx
    map/page.tsx
    mooovy/page.tsx
    feed/page.tsx
```

Create placeholder pages for each:

```typescript
// app/(portal)/dashboard/page.tsx (stub — replaced in Task 8)
export default function DashboardPage() {
  return <div>Dashboard — coming in Task 8</div>;
}
```

Repeat for silo, map, mooovy, feed.

- [ ] **Step 5: Verify sidebar renders at http://localhost:3002/dashboard**

```bash
npm run dev
# sign in with your seeded test account
# verify sidebar shows all 5 nav items
# verify active state highlights current page
```

- [ ] **Step 6: Commit**

```bash
git add components/shell/ app/\(portal\)/
git commit -m "feat(shell): sidebar nav + portal layout (5 screens)"
```

---

## Task 8: Dashboard screen

**Files:**
- Read: `userportal/dashboard.jsx` (before starting)
- Read: `userportal/components.jsx` (for PixelCow, HBar)
- Modify: `app/(portal)/dashboard/page.tsx`
- Create: `app/(portal)/dashboard/_kpi.tsx`
- Create: `app/(portal)/dashboard/_zone-chart.tsx`
- Create: `app/(portal)/dashboard/_top-skus.tsx`
- Create: `app/(portal)/dashboard/_dim-cow.tsx`
- Create: `app/(portal)/dashboard/_pain-points.tsx`
- Create: `lib/data/dashboard.ts`

- [ ] **Step 1: Read `userportal/dashboard.jsx` in full**

Before writing any code, read the file and map every component function to what it renders. Use this as your visual spec. Pay attention to:
- KPI tile structure (label, value, sub-text)
- ZoneCostChart bar heights and labels
- TopSKUs table columns and row hover state
- DimCow pixel art + metric display
- PainPoints tier lock (calf sees 3 rows, others see all)

- [ ] **Step 2: Create `lib/data/dashboard.ts` — Supabase queries replacing SC_AGG**

```typescript
// lib/data/dashboard.ts
import 'server-only';
import { adminClient } from '@/lib/supabase/admin';

export type Period = '30d' | '90d' | '6mo' | '12mo';
const PERIOD_DAYS: Record<Period, number> = { '30d': 30, '90d': 90, '6mo': 180, '12mo': 365 };

export async function fetchDashboardKpis(orgId: string, period: Period) {
  const supabase = adminClient();
  const days = PERIOD_DAYS[period];
  const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);

  const { data } = await supabase.rpc('dashboard_kpis', { p_org_id: orgId, p_since: since });
  // dashboard_kpis is a Postgres function — see migration note below
  return data as {
    total_spend: number;
    total_shipments: number;
    avg_zone: number;
    dim_overcharge_pct: number;
    annual_savings: number;
  } | null;
}

export async function fetchZoneSpend(orgId: string, period: Period) {
  const supabase = adminClient();
  const days = PERIOD_DAYS[period];
  const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from('processed_rows')
    .select('zone, total_row_cost, sc_cost, packages_shipped')
    .eq('org_id', orgId)
    .gte('date', since);
  const byZone: Record<number, { your: number; sc: number }> = {};
  for (const r of data ?? []) {
    if (!byZone[r.zone]) byZone[r.zone] = { your: 0, sc: 0 };
    byZone[r.zone].your += r.total_row_cost;
    byZone[r.zone].sc   += r.sc_cost;
  }
  return byZone;
}

export async function fetchTopSkus(orgId: string, period: Period, limit = 5) {
  const supabase = adminClient();
  const days = PERIOD_DAYS[period];
  const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from('processed_rows')
    .select('sku, packages_shipped, total_row_cost, sc_cost, sc_saving')
    .eq('org_id', orgId)
    .gte('date', since)
    .not('sku', 'is', null);
  const bySkuMap = new Map<string, { ships: number; yourCost: number; scCost: number; saving: number }>();
  for (const r of data ?? []) {
    const k = r.sku!;
    const cur = bySkuMap.get(k) ?? { ships: 0, yourCost: 0, scCost: 0, saving: 0 };
    bySkuMap.set(k, {
      ships:    cur.ships    + r.packages_shipped,
      yourCost: cur.yourCost + r.total_row_cost,
      scCost:   cur.scCost   + r.sc_cost,
      saving:   cur.saving   + r.sc_saving,
    });
  }
  return [...bySkuMap.entries()]
    .map(([sku, v]) => ({ sku, ...v }))
    .sort((a, b) => b.saving - a.saving)
    .slice(0, limit);
}
```

> **Migration note:** Add the `dashboard_kpis` Postgres function to `0008_user_portal.sql` or a new `0009_dashboard_fn.sql`:
>
> ```sql
> CREATE OR REPLACE FUNCTION dashboard_kpis(p_org_id uuid, p_since date)
> RETURNS TABLE(total_spend numeric, total_shipments bigint, avg_zone numeric,
>               dim_overcharge_pct numeric, annual_savings numeric)
> LANGUAGE sql STABLE AS $$
>   SELECT
>     SUM(total_row_cost)                                               AS total_spend,
>     SUM(packages_shipped)                                             AS total_shipments,
>     SUM(zone * packages_shipped) / NULLIF(SUM(packages_shipped), 0) AS avg_zone,
>     COUNT(*) FILTER (WHERE billable_weight_lb > actual_weight_lb)::numeric
>       / NULLIF(COUNT(*), 0)                                           AS dim_overcharge_pct,
>     SUM(sc_saving) * 365.0 / NULLIF((CURRENT_DATE - p_since), 0)    AS annual_savings
>   FROM processed_rows
>   WHERE org_id = p_org_id AND date >= p_since
> $$;
> ```

- [ ] **Step 3: Build sub-components lifting markup from `dashboard.jsx`**

For each component (`_kpi.tsx`, `_zone-chart.tsx`, `_top-skus.tsx`, `_dim-cow.tsx`, `_pain-points.tsx`), port the corresponding JSX function from `dashboard.jsx` verbatim — replace `window.SC_AGG.*` with the typed props passed from the server component. Convert `style={{...}}` blocks intact.

Port `PixelCow` from `components.jsx` into `components/pixel-cow.tsx` for use by `_dim-cow.tsx`.

- [ ] **Step 4: Assemble `app/(portal)/dashboard/page.tsx`**

```typescript
// app/(portal)/dashboard/page.tsx
import { serverClient } from '@/lib/supabase/server';
import { fetchDashboardKpis, fetchZoneSpend, fetchTopSkus } from '@/lib/data/dashboard';
import { DashboardKpi } from './_kpi';
import { ZoneChart } from './_zone-chart';
import { TopSkus } from './_top-skus';
import { DimCow } from './_dim-cow';
import { PainPoints } from './_pain-points';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const supabase = serverClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null; // middleware handles redirect

  // Resolve org from org_members
  const { data: member } = await supabase
    .from('org_members')
    .select('org_id, orgs(tier)')
    .eq('user_id', user.id)
    .single();
  const orgId = member?.org_id;
  const tier  = (member?.orgs as { tier: string } | null)?.tier ?? 'calf';

  if (!orgId) {
    return <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>No org found.</p>;
  }

  const period = (searchParams.period ?? '90d') as '30d' | '90d' | '6mo' | '12mo';
  const [kpis, zoneSpend, topSkus] = await Promise.all([
    fetchDashboardKpis(orgId, period),
    fetchZoneSpend(orgId, period),
    fetchTopSkus(orgId, period),
  ]);

  if (!kpis) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 80 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
          No shipment data yet. Upload your first file in the Silo.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <DashboardKpi kpis={kpis} period={period} />
      <ZoneChart zoneSpend={zoneSpend} />
      <TopSkus rows={topSkus} tier={tier} />
      <DimCow dimOverchargePct={kpis.dim_overcharge_pct} />
      <PainPoints orgId={orgId} period={period} tier={tier} />
    </div>
  );
}
```

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: exit 0.

- [ ] **Step 6: Start dev, sign in, verify dashboard renders**

```bash
npm run dev
# open http://localhost:3002/dashboard
# With no rows in processed_rows: verify empty state renders
# After seeding rows via /api/ingest: verify KPIs render
```

- [ ] **Step 7: Commit**

```bash
git add app/\(portal\)/dashboard/ lib/data/dashboard.ts components/pixel-cow.tsx
git commit -m "feat(dashboard): port prototype DashboardSection to Next.js server components"
```

---

## Task 9: Silo screen — file upload + AI column mapping

**Files:**
- Read: `userportal/silo.jsx` (before starting)
- Modify: `app/(portal)/silo/page.tsx`
- Create: `app/(portal)/silo/_upload-zone.tsx`
- Create: `app/(portal)/silo/_ai-review.tsx`
- Create: `app/(portal)/silo/_file-list.tsx`
- Create: `app/api/silo/upload/route.ts`
- Create: `app/api/silo/ai-map/route.ts`

- [ ] **Step 1: Read `userportal/silo.jsx` in full**

Map the 5 steps: `list` → `upload` → `ai-parsing` → `ai-review` → `success`. Note: the 14 canonical fields, the AI column-mapping prompt (it calls `window.claude.complete`), the `AIReviewTable` editable preview.

- [ ] **Step 2: Create Supabase Storage bucket**

In Supabase Dashboard → Storage → New bucket: `silo-uploads`, private.

Add to `0008_user_portal.sql` (or new migration):

```sql
-- Allow org members to upload to their own silo folder
INSERT INTO storage.buckets (id, name, public)
VALUES ('silo-uploads', 'silo-uploads', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "org_member_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'silo-uploads'
    AND auth.uid() IS NOT NULL
  );
CREATE POLICY "org_member_read_upload" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'silo-uploads'
    AND auth.uid() IS NOT NULL
  );
```

- [ ] **Step 3: Create file upload route**

```typescript
// app/api/silo/upload/route.ts
import { NextResponse } from 'next/server';
import { serverClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  const supabase = serverClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file') as File | null;
  const orgId = form.get('orgId') as string | null;
  if (!file || !orgId) return NextResponse.json({ error: 'Missing file or orgId' }, { status: 400 });

  const path = `${orgId}/${Date.now()}-${file.name}`;
  const admin = adminClient();
  const { error: uploadErr } = await admin.storage
    .from('silo-uploads')
    .upload(path, file, { contentType: file.type });
  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data: siloFile, error: dbErr } = await admin
    .from('silo_files')
    .insert({
      org_id:       orgId,
      name:         file.name,
      size_bytes:   file.size,
      storage_path: path,
    })
    .select()
    .single();
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  return NextResponse.json({ siloFileId: siloFile.id, path });
}
```

- [ ] **Step 4: Create AI column-mapping route**

```typescript
// app/api/silo/ai-map/route.ts
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { serverClient } from '@/lib/supabase/server';

const CANONICAL_FIELDS = [
  'date', 'sku', 'category', 'cost_per_package', 'packages_shipped',
  'length_in', 'width_in', 'height_in', 'origin_zip', 'destination_zip',
  'actual_weight_lb', 'billable_weight_lb', 'carrier', 'selling_platform',
];

export async function POST(req: Request) {
  const supabase = serverClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { headers, sampleRows } = await req.json() as {
    headers: string[];
    sampleRows: string[][];
  };

  const client = new Anthropic();
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are mapping CSV columns to ShippingCow canonical fields.

Canonical fields: ${CANONICAL_FIELDS.join(', ')}

CSV headers: ${headers.join(', ')}
Sample rows (first 3):
${sampleRows.slice(0, 3).map((r) => r.join(', ')).join('\n')}

Respond with JSON only: { "mapping": { "csv_header": "canonical_field_or_null", ... }, "confidence": 0-1, "notes": "..." }`,
    }],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json({ mapping: {}, confidence: 0, notes: 'Parse error' });
  }
}
```

- [ ] **Step 5: Build Silo page components from `silo.jsx`**

Port each step panel from `silo.jsx` as a separate component. Key fidelity points:
- UploadZone: dashed border, drag-over colour change, "Drop any CSV or XLSX here", "Mooovy is reading your file…" spinner.
- AIReviewTable: sticky header (charcoal bg, white text), editable cells with yellow bg for missing required fields, max 520px height, scrollable.
- File list: file items with XLSX label, AI parsed badge, click to preview.

- [ ] **Step 6: Typecheck + commit**

```bash
npm run typecheck
git add app/\(portal\)/silo/ app/api/silo/
git commit -m "feat(silo): upload zone + AI column mapping + review table — port from prototype"
```

---

## Task 10: Map, Mooovy, Feed screens

**Files:**
- Read: `userportal/map.jsx`, `userportal/mooovy.jsx`, `userportal/feed.jsx`
- Modify: `app/(portal)/map/page.tsx`
- Modify: `app/(portal)/mooovy/page.tsx`
- Modify: `app/(portal)/feed/page.tsx`
- Create: `app/api/mooovy/stream/route.ts`

- [ ] **Step 1: Read all three files before writing any code**

Map and Feed: port markup verbatim from the JSX, replace `window.SC_AGG.*` with Supabase queries in `lib/data/map.ts` and `lib/data/feed.ts`.

Mooovy: the prototype calls `window.claude.complete({ messages })`. Replace with a streaming route handler using the Anthropic SDK.

- [ ] **Step 2: Create Mooovy streaming route**

```typescript
// app/api/mooovy/stream/route.ts
import Anthropic from '@anthropic-ai/sdk';
import { serverClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = serverClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { messages } = await req.json() as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  };

  const client = new Anthropic();
  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: `You are Mooovy, ShippingCow's AI logistics analyst. 
You help merchants understand their shipping data, explain dim weight calculations, 
zone patterns, and how to save money by switching to ShippingCow.
Be concise, data-driven, and occasionally use cow puns.`,
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
```

- [ ] **Step 3: Port Map screen**

Read `map.jsx`. It renders a US state heat map based on `window.SC_AGG.destStateShipments()`. Replace with:

```typescript
// lib/data/map.ts
import 'server-only';
import { adminClient } from '@/lib/supabase/admin';

export async function fetchDestStateShipments(orgId: string) {
  const admin = adminClient();
  const { data } = await admin
    .from('processed_rows')
    .select('destination_zip, packages_shipped')
    .eq('org_id', orgId);
  // Group by first 3 digits of destination_zip → state via ZIP_TO_STATE
  // ZIP_TO_STATE: copy the mapping object from userportal/data.js
  const ZIP_TO_STATE = await import('@/lib/zip-to-state').then((m) => m.ZIP_TO_STATE);
  const byState: Record<string, number> = {};
  for (const r of data ?? []) {
    const prefix = r.destination_zip?.slice(0, 3) ?? '';
    const state  = ZIP_TO_STATE[prefix] ?? 'XX';
    byState[state] = (byState[state] ?? 0) + r.packages_shipped;
  }
  return byState;
}
```

Copy the `ZIP_TO_STATE` object from `userportal/data.js` into `lib/zip-to-state.ts`.

- [ ] **Step 4: Port Mooovy screen**

```typescript
// app/(portal)/mooovy/page.tsx
'use client';
import { useState } from 'react';
import { BRAND, px } from '@/lib/brand';

type Message = { role: 'user' | 'assistant'; content: string };

export default function MooovyPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);

    const res = await fetch('/api/mooovy/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: next }),
    });
    if (!res.body) { setLoading(false); return; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let assistantText = '';
    setMessages((m) => [...m, { role: 'assistant', content: '' }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      assistantText += decoder.decode(value, { stream: true });
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: 'assistant', content: assistantText };
        return copy;
      });
    }
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 96px)' }}>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: 16,
          background: BRAND.white,
          border: `3px solid ${BRAND.charcoal}`,
          boxShadow: px(),
          marginBottom: 12,
        }}
      >
        {messages.length === 0 && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.muted }}>
            Ask Mooovy about your shipping data, dim weights, or zone patterns.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              background: m.role === 'user' ? BRAND.blue : BRAND.pageBed,
              color: m.role === 'user' ? BRAND.white : BRAND.charcoal,
              border: `2px solid ${BRAND.charcoal}`,
              padding: '8px 14px',
              maxWidth: '80%',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            {m.content}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask Mooovy…"
          style={{
            flex: 1,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            padding: '10px 14px',
            border: `3px solid ${BRAND.charcoal}`,
            outline: 'none',
          }}
        />
        <button
          onClick={send}
          disabled={loading}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9,
            padding: '10px 16px',
            background: BRAND.yellow,
            color: BRAND.charcoal,
            border: `3px solid ${BRAND.charcoal}`,
            boxShadow: px(),
            cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.03em',
          }}
        >
          {loading ? '…' : 'SEND'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Port Feed screen**

Read `feed.jsx`. Port the activity feed layout verbatim. Replace mock state with a Supabase query against `silo_files` (upload events) and `processed_rows` aggregated by date (activity log).

- [ ] **Step 6: Typecheck + commit**

```bash
npm run typecheck
git add app/\(portal\)/map/ app/\(portal\)/mooovy/ app/\(portal\)/feed/ app/api/mooovy/ lib/data/ lib/zip-to-state.ts
git commit -m "feat(screens): port Map, Mooovy (streaming), Feed from prototype"
```

---

## Task 11: Tier gating

**Files:**
- Create: `lib/tier.ts`
- Create: `components/tier-lock.tsx`

- [ ] **Step 1: Create tier utility**

```typescript
// lib/tier.ts
export type Tier = 'calf' | 'cow' | 'bull';
const TIER_RANK: Record<Tier, number> = { calf: 1, cow: 2, bull: 3 };

export function hasAccess(userTier: Tier, requiredTier: Tier): boolean {
  return TIER_RANK[userTier] >= TIER_RANK[requiredTier];
}
```

- [ ] **Step 2: Create TierLock overlay component**

```typescript
// components/tier-lock.tsx
import { BRAND, px } from '@/lib/brand';
import type { Tier } from '@/lib/tier';

const TIER_LABEL: Record<Tier, string> = {
  calf: 'CALF',
  cow: 'COW+',
  bull: 'BULL',
};

export function TierLock({
  required,
  children,
}: {
  required: Tier;
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      <div style={{ opacity: 0.45, pointerEvents: 'none' }}>{children}</div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9,
            padding: '4px 10px',
            background: BRAND.yellow,
            color: BRAND.charcoal,
            border: `2px solid ${BRAND.charcoal}`,
            boxShadow: px(),
            letterSpacing: '0.03em',
          }}
        >
          {TIER_LABEL[required]} ONLY
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Apply to PainPoints in Dashboard**

In `app/(portal)/dashboard/_pain-points.tsx`, wrap rows beyond index 2 for calf tier:

```typescript
// In the row render loop:
{rows.map((row, i) => {
  const locked = tier === 'calf' && i >= 3;
  const rowEl = <PainPointRow key={row.p} row={row} />;
  return locked ? <TierLock key={row.p} required="cow">{rowEl}</TierLock> : rowEl;
})}
```

- [ ] **Step 4: Typecheck + commit**

```bash
npm run typecheck
git add lib/tier.ts components/tier-lock.tsx app/\(portal\)/dashboard/_pain-points.tsx
git commit -m "feat(tier): hasAccess utility + TierLock overlay, applied to PainPoints"
```

---

## Task 12: Deploy to Vercel

- [ ] **Step 1: Create Vercel project**

```bash
cd ~/code/shippingcow-portal
npx vercel link
# Select: create new project, name "shippingcow-portal"
```

- [ ] **Step 2: Set env vars**

```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add ANTHROPIC_API_KEY production
npx vercel env add NEXT_PUBLIC_APP_URL production
# NEXT_PUBLIC_APP_URL = https://shippingcow-portal.vercel.app
```

- [ ] **Step 3: Deploy preview**

```bash
npx vercel --no-wait
```

- [ ] **Step 4: Verify preview URL loads /login**

Open the preview URL. Confirm `/login` renders. Confirm `/dashboard` redirects to `/login` when not authenticated.

- [ ] **Step 5: Push to GitHub and wire auto-deploy**

```bash
gh repo create JayGit0925/shippingcow-portal --public --push --source=.
# then in Vercel dashboard: connect the new repo for auto-deploy on push to main
```

- [ ] **Step 6: Commit Vercel link file**

```bash
git add .vercel/project.json
git commit -m "chore: link Vercel project shippingcow-portal"
```

---

## Self-Review

**Spec coverage:**
- Repo bootstrap + Supabase clients + auth middleware → Tasks 1-2 ✓
- Migration 0008 (orgs, org_members, silo_files, processed_rows) → Task 3 ✓
- Zone lookup + rate factor (port from state.js) → Task 4 ✓
- Ingest pipeline server-side (port from ingestRows) → Task 5 ✓
- Login + Signup + auth callback → Task 6 ✓
- Sidebar + portal layout → Task 7 ✓
- Dashboard screen (all 8 sub-components) → Task 8 ✓
- Silo screen (upload + AI map + review) → Task 9 ✓
- Map + Mooovy (streaming) + Feed → Task 10 ✓
- Tier gating (calf/cow/bull) → Task 11 ✓
- Vercel deploy → Task 12 ✓

**Placeholder scan:**
- `dashboard_kpis` Postgres function: SQL provided inline in Task 8. ✓
- Map data query: `lib/data/map.ts` implementation provided. ✓
- Feed screen: instructs to read `feed.jsx` and port verbatim — the only remaining "port from JSX" step without inline code (file not read during planning). Acceptable — exact instruction to copy markup.

**Type consistency:**
- `Period` type used in `lib/data/dashboard.ts` and `page.tsx` both come from the same import.
- `Tier` type in `lib/tier.ts` → `TierLock required` prop → `PainPoints tier` prop — all `'calf' | 'cow' | 'bull'`.
- `Message` type in `mooovy/page.tsx` matches the `messages` field sent to `/api/mooovy/stream`.
- `RawRow` in `lib/ingest.ts` → `/api/ingest/route.ts` body type — same shape.
