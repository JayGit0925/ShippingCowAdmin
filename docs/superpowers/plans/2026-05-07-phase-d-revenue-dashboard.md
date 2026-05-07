# Phase D — Revenue + Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire `/admin` (Dashboard with KPI bar, MRR chart, alert queue, health tiles) and `/admin/revenue` (MRR/expansion/churn metrics, conversion funnel, failed-payment queue). Read paths from Supabase. Stripe API mutating actions (retry, refund, coupon, cancel) build the routes but return 503 with a clear "Stripe not wired" message until `STRIPE_SECRET_KEY` is set.

**Architecture:** All read paths are server components reading from Supabase via `adminClient()`. Charts use a hand-rolled SVG renderer to avoid pulling in a charting library. Each metric is a separate function in `lib/metrics.ts` so failed upstream tables degrade per-metric (one missing table doesn't blank the whole page). Stripe actions sit behind `lib/stripe.ts` which throws `StripeNotConfiguredError` when `STRIPE_SECRET_KEY` is empty; routes catch it and return `503`.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, `@supabase/supabase-js`. Adds runtime dep `stripe@^17` (only loaded when configured). No chart library (hand-rolled SVG).

---

## Assumptions (FLAG before executing)

| Table | Assumed columns | If missing |
|---|---|---|
| `subscriptions` | `org_id, mrr, status` (`'active' \| 'payment_failed' \| 'suspended' \| 'deactivated'`) | Metric returns 0 + degraded flag |
| `subscription_events` | `org_id, event_type, from_tier, to_tier, new_mrr, expansion_mrr, churned_mrr, created_at` | Funnel + chart show "no data yet" |
| `orgs` | `id, status, created_at` | Active-orgs metric returns 0 |
| `mv_org_cost_summary` | `org_id, last_upload_at, status` | Churn-risk metric falls back to "n/a" |
| `alerts` | `id, severity, title, body, created_at` | Alert queue empty |
| Stripe customer ↔ org linkage | `subscriptions.stripe_customer_id` | Failed-payment queue shows org row but no Stripe enrichment |

**Out of scope (deferred):**
- Real Stripe API actions: `retry`, `refund`, `cancel`, `coupon`. Routes are scaffolded and return 503 until `STRIPE_SECRET_KEY` is set.
- `api_health_snapshots`, `ai_usage_events`, `edge_fn_error_log`, `stripe_webhook_log` health-tile data sources — assumed to be cron-populated tables. If absent, tiles render "n/a".

---

## File Structure

```
ShippingCowAdmin/
├── lib/
│   ├── metrics.ts                      # KPI + chart + funnel calculators
│   ├── stripe.ts                        # lazy Stripe client + StripeNotConfiguredError
│   └── env.ts                           # extend: STRIPE_SECRET_KEY
├── components/ui/
│   └── sparkline.tsx                    # hand-rolled SVG line chart
├── app/
│   ├── admin/
│   │   ├── page.tsx                     # replaces Phase A placeholder — Dashboard
│   │   ├── _kpi-bar.tsx                 # 6-card row
│   │   ├── _mrr-chart.tsx               # 12-month chart wrapper
│   │   ├── _alert-queue.tsx             # alerts list
│   │   ├── _health-tiles.tsx            # 4 platform health tiles
│   │   └── revenue/
│   │       ├── page.tsx                 # /admin/revenue
│   │       ├── _funnel.tsx              # 3-stage conversion funnel
│   │       └── _failed-queue.tsx        # failed-payment queue with action buttons
│   └── api/admin/billing/
│       ├── retry/route.ts               # POST { stripeCustomerId }
│       ├── refund/route.ts              # POST { paymentIntentId, amount }
│       ├── cancel/route.ts              # POST { stripeSubscriptionId }
│       └── coupon/route.ts              # POST { stripeCustomerId, couponId }
└── package.json                         # add stripe dep
```

**Files modified:**
- `app/admin/page.tsx` — replaced
- `app/admin/revenue/page.tsx` — replaced
- `lib/env.ts` — add `STRIPE_SECRET_KEY`
- `lib/audit.ts` — extend AuditAction with `PAYMENT_RETRY`, `REFUND_INITIATED`, `COUPON_APPLIED`, `SUBSCRIPTION_CANCELLED` (already in spec list — verify present, add if missing)

---

## Task D.1: Add Stripe dep + env wiring

**Files:** `package.json`, `lib/env.ts`, `lib/stripe.ts` (create).

- [ ] **Step 1: Add `stripe` to dependencies in `package.json`**

In `dependencies`:
```json
"stripe": "^17.5.0"
```

Run:
```bash
npm install --legacy-peer-deps
```

- [ ] **Step 2: Extend `lib/env.ts`**

Add `STRIPE_SECRET_KEY` to the `ENV` object:
```ts
STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? '',
```

Add a flag:
```ts
export const STRIPE_CONFIGURED = has('STRIPE_SECRET_KEY');
```

- [ ] **Step 3: Create `lib/stripe.ts`**

```ts
import 'server-only';
import Stripe from 'stripe';
import { ENV, STRIPE_CONFIGURED } from '@/lib/env';

export class StripeNotConfiguredError extends Error {
  constructor() {
    super('STRIPE_SECRET_KEY not set; billing actions are disabled.');
    this.name = 'StripeNotConfiguredError';
  }
}

let _stripe: Stripe | null = null;

export function stripeClient(): Stripe {
  if (!STRIPE_CONFIGURED) throw new StripeNotConfiguredError();
  if (_stripe) return _stripe;
  _stripe = new Stripe(ENV.STRIPE_SECRET_KEY, { apiVersion: '2025-09-30.acacia' });
  return _stripe;
}
```

(If the Stripe SDK API version pin doesn't match the installed version, drop the `apiVersion` line — Stripe defaults to a recent stable version.)

- [ ] **Step 4: Update `.env.example`**

Append:
```
STRIPE_SECRET_KEY=sk_live_...
```

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add package.json package-lock.json lib/env.ts lib/stripe.ts .env.example
git commit -m "phase D: install stripe SDK + lazy client + StripeNotConfiguredError"
```

---

## Task D.2: Metrics library

**Files:** Create `lib/metrics.ts`.

- [ ] **Step 1: Write `lib/metrics.ts`**

```ts
import 'server-only';
import { adminClient } from '@/lib/supabase/admin';

export type KpiResult = { value: number | string; label: string; degraded?: boolean };

async function safeCount(table: string, filter?: (q: any) => any): Promise<number | null> {
  try {
    const supabase = adminClient();
    let q = supabase.from(table).select('*', { count: 'exact', head: true });
    if (filter) q = filter(q);
    const { count, error } = await q;
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

async function safeSum(table: string, column: string, filter?: (q: any) => any): Promise<number | null> {
  try {
    const supabase = adminClient();
    let q = supabase.from(table).select(column);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error || !data) return null;
    return data.reduce((acc: number, r: Record<string, unknown>) => acc + (Number(r[column]) || 0), 0);
  } catch {
    return null;
  }
}

export async function fetchMrr(): Promise<KpiResult> {
  const sum = await safeSum('subscriptions', 'mrr', (q) => q.eq('status', 'active'));
  return sum == null
    ? { value: '—', label: 'MRR', degraded: true }
    : { value: `$${sum.toLocaleString()}`, label: 'MRR' };
}

export async function fetchActiveOrgs(): Promise<KpiResult> {
  const c = await safeCount('orgs', (q) => q.eq('status', 'active'));
  return c == null
    ? { value: '—', label: 'ACTIVE ORGS', degraded: true }
    : { value: c.toLocaleString(), label: 'ACTIVE ORGS' };
}

export async function fetchSignups30d(): Promise<KpiResult> {
  const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const c = await safeCount('orgs', (q) => q.gte('created_at', cutoff));
  return c == null
    ? { value: '—', label: 'SIGNUPS 30D', degraded: true }
    : { value: c.toLocaleString(), label: 'SIGNUPS 30D' };
}

export async function fetchCalfToCowRate(): Promise<KpiResult> {
  try {
    const supabase = adminClient();
    const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const [upgradeRes, signupRes] = await Promise.all([
      supabase
        .from('subscription_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'upgrade')
        .eq('from_tier', 'calf')
        .gte('created_at', cutoff),
      supabase
        .from('subscription_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'calf_signup')
        .gte('created_at', cutoff),
    ]);
    if (upgradeRes.error || signupRes.error) {
      return { value: '—', label: 'CALF→COW', degraded: true };
    }
    const u = upgradeRes.count ?? 0;
    const s = signupRes.count ?? 0;
    if (s === 0) return { value: '0%', label: 'CALF→COW' };
    return { value: `${Math.round((u / s) * 100)}%`, label: 'CALF→COW' };
  } catch {
    return { value: '—', label: 'CALF→COW', degraded: true };
  }
}

export async function fetchChurnRisk(): Promise<KpiResult> {
  try {
    const supabase = adminClient();
    const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { count, error } = await supabase
      .from('mv_org_cost_summary')
      .select('*', { count: 'exact', head: true })
      .lt('last_upload_at', cutoff);
    if (error) return { value: '—', label: 'CHURN RISK', degraded: true };
    return { value: (count ?? 0).toLocaleString(), label: 'CHURN RISK' };
  } catch {
    return { value: '—', label: 'CHURN RISK', degraded: true };
  }
}

export async function fetchFailedPayments(): Promise<KpiResult> {
  const c = await safeCount('subscriptions', (q) => q.eq('status', 'payment_failed'));
  return c == null
    ? { value: '—', label: 'FAILED PAYMENTS', degraded: true }
    : { value: c.toLocaleString(), label: 'FAILED PAYMENTS' };
}

export type MrrSeriesPoint = { month: string; new_mrr: number; expansion_mrr: number; churned_mrr: number };

export async function fetchMrrSeries(): Promise<MrrSeriesPoint[]> {
  try {
    const supabase = adminClient();
    const cutoff = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString();
    const { data, error } = await supabase
      .from('subscription_events')
      .select('created_at, new_mrr, expansion_mrr, churned_mrr')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    const buckets = new Map<string, MrrSeriesPoint>();
    for (const row of data) {
      const r = row as { created_at: string; new_mrr: number | null; expansion_mrr: number | null; churned_mrr: number | null };
      const month = r.created_at.slice(0, 7);
      const cur = buckets.get(month) ?? { month, new_mrr: 0, expansion_mrr: 0, churned_mrr: 0 };
      cur.new_mrr += Number(r.new_mrr) || 0;
      cur.expansion_mrr += Number(r.expansion_mrr) || 0;
      cur.churned_mrr += Number(r.churned_mrr) || 0;
      buckets.set(month, cur);
    }
    return Array.from(buckets.values()).sort((a, b) => a.month.localeCompare(b.month));
  } catch {
    return [];
  }
}

export type FunnelStages = {
  calf_signups: number;
  first_uploads: number;
  upgraded_to_cow: number;
  degraded: boolean;
};

export async function fetchFunnel(): Promise<FunnelStages> {
  try {
    const supabase = adminClient();
    const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const [signupsRes, uploadsRes, upgradesRes] = await Promise.all([
      supabase
        .from('subscription_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'calf_signup')
        .gte('created_at', cutoff),
      supabase
        .from('subscription_events')
        .select('org_id', { count: 'exact', head: true })
        .eq('event_type', 'first_upload')
        .gte('created_at', cutoff),
      supabase
        .from('subscription_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'upgrade')
        .eq('from_tier', 'calf')
        .gte('created_at', cutoff),
    ]);
    if (signupsRes.error || uploadsRes.error || upgradesRes.error) {
      return { calf_signups: 0, first_uploads: 0, upgraded_to_cow: 0, degraded: true };
    }
    return {
      calf_signups: signupsRes.count ?? 0,
      first_uploads: uploadsRes.count ?? 0,
      upgraded_to_cow: upgradesRes.count ?? 0,
      degraded: false,
    };
  } catch {
    return { calf_signups: 0, first_uploads: 0, upgraded_to_cow: 0, degraded: true };
  }
}

export type FailedPaymentRow = {
  org_id: string;
  org_name: string;
  mrr: number | null;
  stripe_customer_id: string | null;
  decline_code: string | null;
  updated_at: string;
};

export async function fetchFailedPaymentQueue(): Promise<FailedPaymentRow[]> {
  try {
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('subscriptions')
      .select('org_id, mrr, stripe_customer_id, updated_at, orgs!inner(name)')
      .eq('status', 'payment_failed')
      .order('updated_at', { ascending: false })
      .limit(50);
    if (error || !data) return [];
    return (data as Array<Record<string, unknown>>).map((r) => ({
      org_id: r.org_id as string,
      org_name: (r.orgs as { name?: string } | null)?.name ?? '—',
      mrr: (r.mrr as number) ?? null,
      stripe_customer_id: (r.stripe_customer_id as string) ?? null,
      decline_code: null,
      updated_at: r.updated_at as string,
    }));
  } catch {
    return [];
  }
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npm run typecheck
git add lib/metrics.ts
git commit -m "phase D: metrics library (KPIs, MRR series, funnel, failed-payment queue)"
```

---

## Task D.3: Sparkline component

**Files:** Create `components/ui/sparkline.tsx`.

- [ ] **Step 1: Write `components/ui/sparkline.tsx`**

```tsx
import { BRAND } from '@/lib/brand';

export type SeriesPoint = { x: string; y: number };

export function Sparkline({
  series,
  width = 600,
  height = 200,
  stroke = BRAND.blue,
  label = '',
}: {
  series: SeriesPoint[];
  width?: number;
  height?: number;
  stroke?: string;
  label?: string;
}) {
  if (series.length === 0) {
    return (
      <div
        style={{
          background: BRAND.white,
          border: `3px solid ${BRAND.charcoal}`,
          boxShadow: `4px 4px 0 ${BRAND.charcoal}`,
          padding: 24,
          textAlign: 'center',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: BRAND.charcoal,
        }}
      >
        No data yet.
      </div>
    );
  }

  const padX = 28;
  const padY = 14;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const ys = series.map((p) => p.y);
  const minY = Math.min(0, ...ys);
  const maxY = Math.max(1, ...ys);
  const range = maxY - minY || 1;
  const step = innerW / Math.max(1, series.length - 1);

  const points = series.map((p, i) => {
    const x = padX + i * step;
    const y = padY + innerH - ((p.y - minY) / range) * innerH;
    return { x, y, raw: p };
  });

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <div
      style={{
        background: BRAND.white,
        border: `3px solid ${BRAND.charcoal}`,
        boxShadow: `4px 4px 0 ${BRAND.charcoal}`,
        padding: 14,
      }}
    >
      {label ? (
        <div
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9,
            color: BRAND.blue,
            letterSpacing: '0.04em',
            marginBottom: 6,
          }}
        >
          {label}
        </div>
      ) : null}
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label || 'sparkline'}>
        <path d={path} fill="none" stroke={stroke} strokeWidth={3} />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill={stroke} />
        ))}
        {/* X-axis ticks: first, mid, last */}
        {[points[0], points[Math.floor(points.length / 2)], points[points.length - 1]].map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={height - 2}
            fontFamily="'Press Start 2P', monospace"
            fontSize="8"
            fill={BRAND.charcoal}
            textAnchor="middle"
          >
            {p.raw.x}
          </text>
        ))}
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/sparkline.tsx
git commit -m "phase D: hand-rolled Sparkline (no chart library)"
```

---

## Task D.4: Dashboard `/admin` page

**Files:**
- Replace `app/admin/page.tsx`
- Create `app/admin/_kpi-bar.tsx`, `_mrr-chart.tsx`, `_alert-queue.tsx`, `_health-tiles.tsx`

- [ ] **Step 1: Write `_kpi-bar.tsx`** (server component)

```tsx
import { BRAND } from '@/lib/brand';
import type { KpiResult } from '@/lib/metrics';

export function KpiBar({ kpis }: { kpis: KpiResult[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 12,
      }}
    >
      {kpis.map((k, i) => (
        <div
          key={i}
          style={{
            background: BRAND.white,
            border: `3px solid ${BRAND.charcoal}`,
            boxShadow: `4px 4px 0 ${BRAND.charcoal}`,
            padding: 14,
          }}
        >
          <div
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 9,
              color: BRAND.blue,
              letterSpacing: '0.04em',
              marginBottom: 6,
            }}
          >
            {k.label}
          </div>
          <div
            style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 24,
              color: k.degraded ? BRAND.amber : BRAND.charcoal,
              textTransform: 'uppercase',
            }}
          >
            {k.value}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Write `_mrr-chart.tsx`**

```tsx
import { Sparkline } from '@/components/ui/sparkline';
import type { MrrSeriesPoint } from '@/lib/metrics';

export function MrrChart({ series }: { series: MrrSeriesPoint[] }) {
  const points = series.map((s) => ({
    x: s.month,
    y: s.new_mrr + s.expansion_mrr - s.churned_mrr,
  }));
  return <Sparkline series={points} label="NET NEW MRR (12-MONTH TRAILING)" />;
}
```

- [ ] **Step 3: Write `_alert-queue.tsx`**

```tsx
import { Card } from '@/components/ui/card';
import { BRAND } from '@/lib/brand';
import { adminClient } from '@/lib/supabase/admin';

type Alert = {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  body: string | null;
  created_at: string;
};

const severityColor: Record<string, string> = {
  critical: BRAND.red,
  high: BRAND.amber,
  medium: BRAND.blue,
  low: BRAND.sky,
};

const severityRank: Record<string, number> = {
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
};

export async function AlertQueue() {
  let alerts: Alert[] = [];
  try {
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('alerts')
      .select('id, severity, title, body, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error) {
      alerts = ((data ?? []) as Alert[]).sort(
        (a, b) =>
          (severityRank[a.severity] ?? 5) - (severityRank[b.severity] ?? 5) ||
          b.created_at.localeCompare(a.created_at),
      );
    }
  } catch {
    /* upstream missing */
  }

  return (
    <Card style={{ padding: 0 }}>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {alerts.map((a) => (
          <li
            key={a.id}
            style={{
              padding: '10px 14px',
              borderBottom: `1px solid ${BRAND.sky}`,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: BRAND.charcoal,
            }}
          >
            <span
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 8,
                color: severityColor[a.severity] ?? BRAND.charcoal,
                marginRight: 8,
                letterSpacing: '0.04em',
              }}
            >
              {a.severity.toUpperCase()}
            </span>
            <strong>{a.title}</strong>
            {a.body ? <span style={{ marginLeft: 8, opacity: 0.8 }}>{a.body}</span> : null}
          </li>
        ))}
        {alerts.length === 0 ? (
          <li
            style={{
              padding: 24,
              textAlign: 'center',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: BRAND.charcoal,
            }}
          >
            No active alerts.
          </li>
        ) : null}
      </ul>
    </Card>
  );
}
```

- [ ] **Step 4: Write `_health-tiles.tsx`**

```tsx
import { Card } from '@/components/ui/card';
import { BRAND } from '@/lib/brand';
import { adminClient } from '@/lib/supabase/admin';

type Tile = { label: string; value: string; tone: 'ok' | 'warn' | 'err' | 'na' };

async function tile(label: string, fn: () => Promise<Tile>): Promise<Tile> {
  try {
    return await fn();
  } catch {
    return { label, value: 'n/a', tone: 'na' };
  }
}

export async function HealthTiles() {
  const supabase = adminClient();

  const tiles: Tile[] = await Promise.all([
    tile('MOOOVY API', async () => {
      const { data } = await supabase
        .from('api_health_snapshots')
        .select('latency_p95_ms, error_rate')
        .order('captured_at', { ascending: false })
        .limit(1);
      const row = data?.[0] as { latency_p95_ms?: number; error_rate?: number } | undefined;
      if (!row) return { label: 'MOOOVY API', value: 'n/a', tone: 'na' };
      const tone =
        (row.error_rate ?? 0) > 0.05 ? 'err' : (row.latency_p95_ms ?? 0) > 1500 ? 'warn' : 'ok';
      return {
        label: 'MOOOVY API',
        value: `${row.latency_p95_ms ?? 0}ms p95 · ${((row.error_rate ?? 0) * 100).toFixed(1)}% err`,
        tone,
      };
    }),
    tile('AI SPEND TODAY', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from('ai_usage_events')
        .select('cost_usd')
        .gte('event_date', today);
      const sum = ((data ?? []) as Array<{ cost_usd: number | null }>).reduce(
        (a, r) => a + (Number(r.cost_usd) || 0),
        0,
      );
      return { label: 'AI SPEND TODAY', value: `$${sum.toFixed(2)}`, tone: 'ok' };
    }),
    tile('EDGE FN ERRORS', async () => {
      const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('edge_fn_error_log')
        .select('*', { count: 'exact', head: true })
        .gte('occurred_at', cutoff);
      return {
        label: 'EDGE FN ERRORS',
        value: `${count ?? 0} / 60min`,
        tone: (count ?? 0) > 10 ? 'warn' : 'ok',
      };
    }),
    tile('STRIPE WEBHOOKS', async () => {
      const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { count: total } = await supabase
        .from('stripe_webhook_log')
        .select('*', { count: 'exact', head: true })
        .gte('received_at', cutoff);
      const { count: failed } = await supabase
        .from('stripe_webhook_log')
        .select('*', { count: 'exact', head: true })
        .gte('received_at', cutoff)
        .eq('status', 'failed');
      return {
        label: 'STRIPE WEBHOOKS',
        value: `${(total ?? 0) - (failed ?? 0)}/${total ?? 0} ok`,
        tone: (failed ?? 0) > 0 ? 'warn' : 'ok',
      };
    }),
  ]);

  const tone = (t: Tile['tone']): string =>
    t === 'ok' ? BRAND.green : t === 'warn' ? BRAND.amber : t === 'err' ? BRAND.red : BRAND.charcoal;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
      }}
    >
      {tiles.map((t) => (
        <Card key={t.label} style={{ padding: 14 }}>
          <div
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 9,
              color: BRAND.blue,
              letterSpacing: '0.04em',
              marginBottom: 6,
            }}
          >
            {t.label}
          </div>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: tone(t.tone),
            }}
          >
            {t.value}
          </div>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Replace `app/admin/page.tsx`**

```tsx
import { Eyebrow } from '@/components/ui/eyebrow';
import { BRAND } from '@/lib/brand';
import {
  fetchActiveOrgs,
  fetchCalfToCowRate,
  fetchChurnRisk,
  fetchFailedPayments,
  fetchMrr,
  fetchMrrSeries,
  fetchSignups30d,
} from '@/lib/metrics';
import { KpiBar } from './_kpi-bar';
import { MrrChart } from './_mrr-chart';
import { AlertQueue } from './_alert-queue';
import { HealthTiles } from './_health-tiles';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [mrr, active, signups, conv, churn, failed, mrrSeries] = await Promise.all([
    fetchMrr(),
    fetchActiveOrgs(),
    fetchSignups30d(),
    fetchCalfToCowRate(),
    fetchChurnRisk(),
    fetchFailedPayments(),
    fetchMrrSeries(),
  ]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>{'// DASHBOARD'}</Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
          }}
        >
          Operations
        </h1>
      </div>
      <KpiBar kpis={[mrr, active, signups, conv, churn, failed]} />
      <MrrChart series={mrrSeries} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <Eyebrow>{'// ALERTS'}</Eyebrow>
          <AlertQueue />
        </div>
        <div>
          <Eyebrow>{'// PLATFORM HEALTH'}</Eyebrow>
          <HealthTiles />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Build + commit**

```bash
npm run typecheck && npm run build
git add app/admin/page.tsx app/admin/_kpi-bar.tsx app/admin/_mrr-chart.tsx app/admin/_alert-queue.tsx app/admin/_health-tiles.tsx
git commit -m "phase D: /admin dashboard with KPI bar, MRR chart, alerts, health tiles"
```

---

## Task D.5: `/admin/revenue` page

**Files:**
- Replace `app/admin/revenue/page.tsx`
- Create `app/admin/revenue/_funnel.tsx`
- Create `app/admin/revenue/_failed-queue.tsx`

- [ ] **Step 1: Write `_funnel.tsx`**

```tsx
import { Card } from '@/components/ui/card';
import { BRAND } from '@/lib/brand';
import type { FunnelStages } from '@/lib/metrics';

export function Funnel({ stages }: { stages: FunnelStages }) {
  const items = [
    { label: 'CALF SIGNUPS', value: stages.calf_signups, color: BRAND.blue },
    { label: 'FIRST UPLOAD', value: stages.first_uploads, color: BRAND.midBlue },
    { label: 'UPGRADED TO COW', value: stages.upgraded_to_cow, color: BRAND.green },
  ];
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <Card style={{ padding: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((it) => (
          <div key={it.label}>
            <div
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 9,
                color: BRAND.blue,
                letterSpacing: '0.04em',
                marginBottom: 4,
              }}
            >
              {it.label} — {it.value.toLocaleString()}
            </div>
            <div
              style={{
                width: `${Math.max(2, (it.value / max) * 100)}%`,
                background: it.color,
                color: BRAND.white,
                fontFamily: "'Black Han Sans', sans-serif",
                fontSize: 16,
                padding: '6px 10px',
                border: `3px solid ${BRAND.charcoal}`,
                boxShadow: `4px 4px 0 ${BRAND.charcoal}`,
                textTransform: 'uppercase',
              }}
            >
              {it.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      {stages.degraded ? (
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: BRAND.amber,
            marginTop: 12,
          }}
        >
          Funnel degraded — `subscription_events` table not present.
        </p>
      ) : null}
    </Card>
  );
}
```

- [ ] **Step 2: Write `_failed-queue.tsx`**

```tsx
import type { Route } from 'next';
import { BRAND } from '@/lib/brand';
import { Button } from '@/components/ui/button';
import type { FailedPaymentRow } from '@/lib/metrics';

export function FailedQueue({ rows }: { rows: FailedPaymentRow[] }) {
  return (
    <div
      style={{
        background: BRAND.white,
        border: `3px solid ${BRAND.charcoal}`,
        boxShadow: `4px 4px 0 ${BRAND.charcoal}`,
        overflow: 'auto',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: BRAND.pageBed, borderBottom: `3px solid ${BRAND.charcoal}` }}>
            {['ORG', 'MRR', 'STRIPE CUST', 'UPDATED', 'ACTIONS'].map((h) => (
              <th
                key={h}
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 9,
                  color: BRAND.blue,
                  padding: '10px 12px',
                  textAlign: 'left',
                  letterSpacing: '0.04em',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.org_id}
              style={{
                borderBottom: `1px solid ${BRAND.sky}`,
                background: i % 2 ? '#FAFBFF' : BRAND.white,
              }}
            >
              <td style={cell}>{r.org_name}</td>
              <td style={cell}>{r.mrr != null ? `$${r.mrr.toLocaleString()}` : '—'}</td>
              <td style={cell}>{r.stripe_customer_id ?? '—'}</td>
              <td style={cell}>{new Date(r.updated_at).toISOString().slice(0, 10)}</td>
              <td style={cell}>
                <form
                  action={`/api/admin/billing/retry` as Route}
                  method="post"
                  style={{ display: 'inline-flex', gap: 6 }}
                >
                  <input type="hidden" name="stripeCustomerId" value={r.stripe_customer_id ?? ''} />
                  <input type="hidden" name="orgId" value={r.org_id} />
                  <Button variant="ghost" size="sm">Retry</Button>
                </form>
                <form
                  action={`/api/admin/billing/cancel` as Route}
                  method="post"
                  style={{ display: 'inline-flex', gap: 6, marginLeft: 6 }}
                >
                  <input type="hidden" name="orgId" value={r.org_id} />
                  <Button variant="danger" size="sm">Cancel</Button>
                </form>
              </td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ ...cell, padding: 24, textAlign: 'center' }}>
                No failed payments.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

const cell: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  color: BRAND.charcoal,
  padding: '8px 12px',
};
```

- [ ] **Step 3: Replace `app/admin/revenue/page.tsx`**

```tsx
import { Eyebrow } from '@/components/ui/eyebrow';
import { BRAND } from '@/lib/brand';
import { fetchFailedPaymentQueue, fetchFunnel, fetchMrrSeries } from '@/lib/metrics';
import { Sparkline } from '@/components/ui/sparkline';
import { Funnel } from './_funnel';
import { FailedQueue } from './_failed-queue';

export const dynamic = 'force-dynamic';

export default async function RevenuePage() {
  const [funnel, queue, series] = await Promise.all([
    fetchFunnel(),
    fetchFailedPaymentQueue(),
    fetchMrrSeries(),
  ]);
  const points = series.map((s) => ({ x: s.month, y: s.new_mrr }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>{'// REVENUE'}</Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
          }}
        >
          Revenue
        </h1>
      </div>
      <Sparkline series={points} label="NEW MRR (12-MONTH TRAILING)" />
      <div>
        <Eyebrow>{'// CONVERSION FUNNEL (30D)'}</Eyebrow>
        <Funnel stages={funnel} />
      </div>
      <div>
        <Eyebrow>{'// FAILED PAYMENT QUEUE'}</Eyebrow>
        <FailedQueue rows={queue} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Build + commit**

```bash
npm run typecheck && npm run build
git add app/admin/revenue/
git commit -m "phase D: /admin/revenue with MRR sparkline, funnel, failed-payment queue"
```

---

## Task D.6: Stripe action route handlers (retry / refund / cancel / coupon)

**Files:** Create 4 routes under `app/api/admin/billing/{action}/route.ts`. All return 503 with a clear message until `STRIPE_SECRET_KEY` is set; all audit on success.

**File: `app/api/admin/billing/retry/route.ts`**

- [ ] **Step 1: Write the handler**

```ts
import { NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';
import { stripeClient, StripeNotConfiguredError } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await getAdminContext(req);
  } catch (resp) {
    if (resp instanceof Response) return resp;
    throw resp;
  }
  if (ctx.actorRole !== 'super-admin' && ctx.actorRole !== 'billing-admin') {
    return NextResponse.json({ error: 'role gate' }, { status: 403 });
  }
  const form = await req.formData().catch(() => new FormData());
  const stripeCustomerId = (form.get('stripeCustomerId') as string | null) ?? '';
  const orgId = (form.get('orgId') as string | null) ?? '';
  if (!stripeCustomerId) {
    return NextResponse.json({ error: 'stripeCustomerId required' }, { status: 400 });
  }

  try {
    const stripe = stripeClient();
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      status: 'open',
      limit: 1,
    });
    const inv = invoices.data[0];
    if (!inv) {
      return NextResponse.json({ error: 'no open invoice for customer' }, { status: 404 });
    }
    const result = await stripe.invoices.pay(inv.id);
    await logAudit({
      action: 'PAYMENT_RETRY',
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      orgId: orgId || undefined,
      resourceType: 'stripe_invoice',
      resourceId: result.id,
      after: { status: result.status },
      ip: ctx.ip ?? undefined,
    });
    return NextResponse.redirect(new URL('/admin/revenue', req.url), { status: 303 });
  } catch (ex) {
    if (ex instanceof StripeNotConfiguredError) {
      return NextResponse.json({ error: ex.message }, { status: 503 });
    }
    return NextResponse.json(
      { error: ex instanceof Error ? ex.message : 'stripe failure' },
      { status: 502 },
    );
  }
}
```

- [ ] **Step 2: Repeat per action** with these overrides:

- `refund/route.ts` — Reads `paymentIntentId`, optional `amount` (cents). Calls `stripe.refunds.create({ payment_intent, amount? })`. Action `'REFUND_INITIATED'`.
- `cancel/route.ts` — Reads `orgId`. Looks up the org's `stripe_subscription_id` from `subscriptions` table, calls `stripe.subscriptions.cancel(id)`. Action `'SUBSCRIPTION_CANCELLED'`.
- `coupon/route.ts` — Reads `stripeCustomerId`, `couponId`. Calls `stripe.customers.update(cust, { coupon })`. Action `'COUPON_APPLIED'`.

All four wrap in `try { stripeClient() … } catch (ex) { if (ex instanceof StripeNotConfiguredError) return 503 … }`.

- [ ] **Step 3: Build + commit**

```bash
npm run typecheck && npm run build
git add app/api/admin/billing/
git commit -m "phase D: stripe action handlers (retry/refund/cancel/coupon) — 503 until key set"
```

---

## Final verification

- [ ] **Run all gates**

```bash
npm run typecheck
npm run build
```

Both must pass. Build expects ~37 routes after Phase D.

- [ ] **Manual smoke test (deferred — see HANDOFF)**

---

## Phase D gate (per spec §11)

Gate: "Finance team can see real revenue metrics and process failed payments."

Status after this plan: AMBER. Read paths fully working as soon as upstream tables (`subscription_events`, `subscriptions.stripe_customer_id`, `alerts`, etc.) are populated. Mutating Stripe actions return 503 until `STRIPE_SECRET_KEY` is set. Setting that key flips gate GREEN with no further code changes.
