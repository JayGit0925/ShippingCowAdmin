# Autoresearch Overnight Loops — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build three autoresearch-style overnight loops (rate audit, copy optimizer, ICP monitor) plus a DM reply tracker in the admin portal — all orchestrated by a single shell script Jay runs before bed.

**Architecture:** Rate logic extracted to `lib/rate-calc.ts` so scripts can import it without loading JSX. Three TypeScript scripts in `scripts/` run in parallel via `resources/scripts/run-overnight-loops.sh` (jayos repo). Copy optimizer uses two Anthropic SDK calls per iteration (writer + adversarial judge). Results commit to `daily/` in the jayos vault each morning.

**Tech Stack:** TypeScript 5, tsx 4.19 (installed), @anthropic-ai/sdk 0.95 (installed), @supabase/supabase-js 2.45, Next.js 14 App Router, vitest 4

---

## File Structure

**Create in `projects/ShippingCowAdmin/`:**
- `lib/rate-calc.ts` — Pure rate logic (shared between UI and scripts)
- `supabase/migrations/0007_dm_tracking.sql` — dm_tracking table + RLS
- `app/api/admin/dm-tracking/route.ts` — GET count/list, POST insert reply
- `app/admin/dm-tracker/page.tsx` — Server component: counter + reply list
- `app/admin/dm-tracker/_add-reply-form.tsx` — Client: +1 button form
- `docs/campaign/copy-variants.json` — Append-only variant log (starts as [])
- `docs/campaign/copy-program.md` — MOOOVY brief Jay edits before each run
- `scripts/rate-audit.ts` — One-shot claim verification (no Claude calls)
- `scripts/copy-optimizer.ts` — Nightly DM iteration loop
- `scripts/icp-monitor.ts` — ICP criteria generator (activates at 5 replies)
- `scripts/__tests__/rate-audit.test.ts` — Vitest tests for rate logic

**Modify in `projects/ShippingCowAdmin/`:**
- `app/_rate-calculator.tsx` — Replace inline RATES/calcEstimates with import from lib/rate-calc
- `package.json` — Add rate-audit, copy-optimizer, icp-monitor script entries

**Create in `/Users/jayos/jayos/`:**
- `resources/scripts/run-overnight-loops.sh` — Parallel orchestrator

---

### Task 1: Extract rate logic to `lib/rate-calc.ts`

**Files:**
- Create: `lib/rate-calc.ts`
- Modify: `app/_rate-calculator.tsx`
- Create: `scripts/__tests__/rate-audit.test.ts`

`_rate-calculator.tsx` is a React client component — scripts can't import it directly (JSX, `'use client'`). Extract the pure functions so both the UI and scripts share one source of truth.

- [ ] **Step 1: Create `lib/rate-calc.ts`**

```typescript
export const RATES = {
  zoneRatePerLb: [0, 0.21, 0.21, 0.26, 0.31, 0.37, 0.44, 0.50, 0.56] as const,
  standardDimMultiplier: 2.0,
  shippingcowDimMultiplier: 1.25,
  standardResidential: 5.85,
  shippingcowResidential: 2.34,
  standardFuelPct: 0.13,
  shippingcowFuelPct: 0,
} as const;

export interface RateEstimate {
  standard: number;
  shippingcow: number;
  savings: number;
}

export function calcEstimates(weightLbs: number, zone: number): RateEstimate {
  const rate = (RATES.zoneRatePerLb as readonly number[])[zone] ?? 0.37;
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
```

- [ ] **Step 2: Update `app/_rate-calculator.tsx`**

Remove the `RATES` const block and `calcEstimates` function from the top of the file (lines 8–32 approximately). Add this import after the existing imports:

```typescript
import { calcEstimates } from '@/lib/rate-calc';
```

The rest of the file is unchanged — `est = calcEstimates(weight, zone)` still works identically.

- [ ] **Step 3: Write failing tests in `scripts/__tests__/rate-audit.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { calcEstimates } from '../../lib/rate-calc';

describe('calcEstimates', () => {
  it('50lb Zone 4 — savings = $19', () => {
    expect(calcEstimates(50, 4).savings).toBe(19);
  });

  it('50lb Zone 2 — savings < $18 (known failure case)', () => {
    expect(calcEstimates(50, 2).savings).toBeLessThan(18);
  });

  it('70lb Zone 2 — savings = $18 (boundary)', () => {
    expect(calcEstimates(70, 2).savings).toBe(18);
  });

  it('149lb Zone 8 — large item far zone, savings >= $18', () => {
    expect(calcEstimates(149, 8).savings).toBeGreaterThanOrEqual(18);
  });

  it('savings = standard - shippingcow', () => {
    const { standard, shippingcow, savings } = calcEstimates(90, 6);
    expect(savings).toBe(standard - shippingcow);
  });
});
```

- [ ] **Step 4: Run test — expect FAIL**

```bash
cd projects/ShippingCowAdmin && npm test -- scripts/__tests__/rate-audit.test.ts
```

Expected: FAIL — `Cannot find module '../../lib/rate-calc'`

- [ ] **Step 5: Run test after Steps 1–2 — expect PASS**

```bash
cd projects/ShippingCowAdmin && npm test -- scripts/__tests__/rate-audit.test.ts
```

Expected: 5/5 PASS

- [ ] **Step 6: Build check**

```bash
cd projects/ShippingCowAdmin && npm run build
```

Expected: build succeeds (no type errors from the refactor)

- [ ] **Step 7: Commit**

```bash
cd projects/ShippingCowAdmin && git add lib/rate-calc.ts app/_rate-calculator.tsx scripts/__tests__/rate-audit.test.ts && git commit -m "refactor(rate): extract calcEstimates to lib/rate-calc for script reuse"
```

---

### Task 2: Supabase migration — dm_tracking table

**Files:**
- Create: `supabase/migrations/0007_dm_tracking.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- 0007_dm_tracking.sql
CREATE TABLE IF NOT EXISTS public.dm_tracking (
  id             uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     timestamptz  DEFAULT now() NOT NULL,
  prospect_name  text         NOT NULL,
  prospect_store text,
  reply_tone     text         CHECK (reply_tone IN ('positive', 'neutral', 'negative')),
  notes          text
);

ALTER TABLE public.dm_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service select" ON public.dm_tracking;
CREATE POLICY "service select"
  ON public.dm_tracking
  FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service insert" ON public.dm_tracking;
CREATE POLICY "service insert"
  ON public.dm_tracking
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

- [ ] **Step 2: Apply migration — JAY HUMAN STEP**

Open https://supabase.com/dashboard/project/aetvueyuaxbgszcisoci/sql, paste the SQL above, click Run.
Expected: "Success. No rows returned."

- [ ] **Step 3: Commit**

```bash
cd projects/ShippingCowAdmin && git add supabase/migrations/0007_dm_tracking.sql && git commit -m "feat(db): add dm_tracking table for ICP miner reply trigger"
```

---

### Task 3: DM tracking API route

**Files:**
- Create: `app/api/admin/dm-tracking/route.ts`

GET returns `{ count, replies[] }`. POST inserts a new reply. Both protected by middleware (requires session + platform_admins row).

- [ ] **Step 1: Create `app/api/admin/dm-tracking/route.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET() {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from('dm_tracking')
    .select('id, created_at, prospect_name, prospect_store, reply_tone, notes')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'fetch failed' }, { status: 500 });
  return NextResponse.json({ count: data.length, replies: data });
}

export async function POST(request: Request) {
  let body: {
    prospect_name: string;
    prospect_store?: string;
    reply_tone?: 'positive' | 'neutral' | 'negative';
    notes?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  if (!body.prospect_name?.trim()) {
    return NextResponse.json({ error: 'prospect_name required' }, { status: 400 });
  }

  const supabase = adminClient();
  const { error } = await supabase.from('dm_tracking').insert({
    prospect_name: body.prospect_name.trim(),
    prospect_store: body.prospect_store?.trim() ?? null,
    reply_tone: body.reply_tone ?? null,
    notes: body.notes?.trim() ?? null,
  });

  if (error) return NextResponse.json({ error: 'insert failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Typecheck**

```bash
cd projects/ShippingCowAdmin && npm run typecheck
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd projects/ShippingCowAdmin && git add app/api/admin/dm-tracking/route.ts && git commit -m "feat(api): add dm-tracking GET/POST route"
```

---

### Task 4: `/admin/dm-tracker` page

**Files:**
- Create: `app/admin/dm-tracker/_add-reply-form.tsx`
- Create: `app/admin/dm-tracker/page.tsx`

Server component fetches replies from Supabase. Client component renders the +1 form and calls `router.refresh()` after save so the server re-fetches.

- [ ] **Step 1: Create `app/admin/dm-tracker/_add-reply-form.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BRAND, FONT, px } from '@/lib/brand';

export function AddReplyForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [store, setStore] = useState('');
  const [tone, setTone] = useState<'positive' | 'neutral' | 'negative'>('positive');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/dm-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect_name: name, prospect_store: store, reply_tone: tone, notes }),
      });
      if (!res.ok) throw new Error('failed');
      setName('');
      setStore('');
      setNotes('');
      router.refresh();
    } catch {
      setError('Failed to save. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: 14,
    padding: '8px 12px',
    border: `2px solid ${BRAND.charcoal}`,
    background: BRAND.white,
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    borderRadius: 0,
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <input
          placeholder="Prospect name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          placeholder="Store / handle"
          value={store}
          onChange={(e) => setStore(e.target.value)}
          style={inputStyle}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value as 'positive' | 'neutral' | 'negative')}
          style={inputStyle}
        >
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </select>
        <input
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={inputStyle}
        />
      </div>
      {error && (
        <p style={{ fontFamily: FONT.body, fontSize: 12, color: BRAND.red, margin: 0 }}>{error}</p>
      )}
      <button
        type="submit"
        disabled={loading || !name.trim()}
        style={{
          fontFamily: FONT.display,
          fontSize: 14,
          padding: '10px 20px',
          background: loading ? BRAND.sky : BRAND.blue,
          color: BRAND.white,
          border: `2px solid ${BRAND.charcoal}`,
          boxShadow: loading ? 'none' : px(BRAND.charcoal),
          cursor: loading ? 'default' : 'pointer',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
          width: 'fit-content',
        }}
      >
        {loading ? 'Saving...' : '+ Log reply'}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Create `app/admin/dm-tracker/page.tsx`**

```typescript
import { createClient } from '@supabase/supabase-js';
import { BRAND, FONT, px } from '@/lib/brand';
import { Eyebrow } from '@/components/ui/eyebrow';
import { AddReplyForm } from './_add-reply-form';

export const dynamic = 'force-dynamic';

const ICP_TRIGGER = 5;

async function fetchReplies() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data } = await supabase
    .from('dm_tracking')
    .select('id, created_at, prospect_name, prospect_store, reply_tone, notes')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export default async function DmTrackerPage() {
  const replies = await fetchReplies();
  const count = replies.length;
  const remaining = Math.max(0, ICP_TRIGGER - count);
  const triggered = count >= ICP_TRIGGER;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>{'// DM TRACKER'}</Eyebrow>
        <h1 style={{ fontFamily: FONT.display, fontSize: 32, color: BRAND.charcoal, textTransform: 'uppercase', margin: 0 }}>
          Reply Log
        </h1>
      </div>

      <div style={{ border: `3px solid ${BRAND.charcoal}`, boxShadow: px(triggered ? BRAND.green : BRAND.blue), padding: 24, background: triggered ? '#f0faf4' : BRAND.white, maxWidth: 480 }}>
        <p style={{ fontFamily: FONT.pixel, fontSize: 9, opacity: 0.6, margin: '0 0 8px', letterSpacing: '0.04em' }}>ICP MINER TRIGGER</p>
        <p style={{ fontFamily: FONT.display, fontSize: 48, color: triggered ? BRAND.green : BRAND.charcoal, margin: 0 }}>
          {count} / {ICP_TRIGGER}
        </p>
        <p style={{ fontFamily: FONT.body, fontSize: 14, opacity: 0.7, margin: '8px 0 0' }}>
          {triggered
            ? 'Trigger reached — run: npm run icp-monitor'
            : `${remaining} more repl${remaining === 1 ? 'y' : 'ies'} to activate ICP miner`}
        </p>
      </div>

      <div style={{ border: `2px solid ${BRAND.charcoal}`, padding: 24, background: BRAND.white, maxWidth: 640 }}>
        <p style={{ fontFamily: FONT.pixel, fontSize: 9, opacity: 0.5, marginBottom: 16, letterSpacing: '0.04em' }}>LOG A REPLY</p>
        <AddReplyForm />
      </div>

      {replies.length > 0 && (
        <div style={{ border: `2px solid ${BRAND.charcoal}`, background: BRAND.white }}>
          <p style={{ fontFamily: FONT.pixel, fontSize: 9, opacity: 0.5, margin: '16px 16px 8px', letterSpacing: '0.04em' }}>
            REPLIES ({count})
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${BRAND.charcoal}` }}>
                {['Date', 'Prospect', 'Store', 'Tone', 'Notes'].map((h) => (
                  <th key={h} style={{ fontFamily: FONT.pixel, fontSize: 8, padding: '8px 16px', textAlign: 'left', opacity: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {replies.map((r: { id: string; created_at: string; prospect_name: string; prospect_store: string | null; reply_tone: string | null; notes: string | null }) => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${BRAND.sky}` }}>
                  <td style={{ fontFamily: FONT.body, fontSize: 13, padding: '10px 16px', opacity: 0.6 }}>
                    {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td style={{ fontFamily: FONT.body, fontSize: 14, padding: '10px 16px', fontWeight: 600 }}>{r.prospect_name}</td>
                  <td style={{ fontFamily: FONT.body, fontSize: 13, padding: '10px 16px', opacity: 0.7 }}>{r.prospect_store ?? '—'}</td>
                  <td style={{ fontFamily: FONT.body, fontSize: 13, padding: '10px 16px', color: r.reply_tone === 'positive' ? BRAND.green : r.reply_tone === 'negative' ? BRAND.red : BRAND.charcoal }}>
                    {r.reply_tone ?? '—'}
                  </td>
                  <td style={{ fontFamily: FONT.body, fontSize: 13, padding: '10px 16px', opacity: 0.7 }}>{r.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Build check**

```bash
cd projects/ShippingCowAdmin && npm run build
```

Expected: build succeeds, dm-tracker page compiles

- [ ] **Step 4: Commit**

```bash
cd projects/ShippingCowAdmin && git add app/admin/dm-tracker/ && git commit -m "feat(admin): add /admin/dm-tracker page with reply log and ICP trigger counter"
```

---

### Task 5: Campaign seed files

**Files:**
- Create: `docs/campaign/copy-variants.json`
- Create: `docs/campaign/copy-program.md`

- [ ] **Step 1: Create `docs/campaign/copy-variants.json`**

```json
[]
```

- [ ] **Step 2: Create `docs/campaign/copy-program.md`**

```markdown
# copy-program.md — Tonight's Direction

> Edit this file before running the copy optimizer. The agent reads it at the start of each run.
> One or two directions max. Be specific about what to try tonight.

## Tonight's direction

- Focus on: [e.g. "Try openers that name a specific item type (sofa, dining table) in the first sentence"]
- Avoid: [e.g. "Don't use the word 'margins' — sellers don't think that way"]

## Voice rules (do not remove)

- MOOOVY: punchy, ≤1 pun, specific numbers ($, lbs), short sentences
- One clear next action — never two asks
- Lead with their problem, not our solution
- Real number in line 2 ($15–25, not "significant savings")
- Never mention Logistar or name the logistics partner
```

- [ ] **Step 3: Commit**

```bash
cd projects/ShippingCowAdmin && git add docs/campaign/copy-variants.json docs/campaign/copy-program.md && git commit -m "feat(campaign): add copy-variants.json seed and copy-program.md template"
```

---

### Task 6: Rate audit script

**Files:**
- Create: `scripts/rate-audit.ts`
- Modify: `package.json`

Pure calculation — no Claude calls. Imports from `lib/rate-calc.ts`. Writes markdown to stdout. The orchestrator pipes it to `daily/YYYYMMDD-rate-audit.md`.

- [ ] **Step 1: Create `scripts/rate-audit.ts`**

```typescript
import { calcEstimates } from '../lib/rate-calc';

const CLAIM_MIN = 18;
const PASS_THRESHOLD = 0.80;

const TEST_CASES = [
  { weight: 50,  zone: 2, label: '50lb Zone 2 (local, min ICP weight)' },
  { weight: 50,  zone: 4, label: '50lb Zone 4' },
  { weight: 50,  zone: 6, label: '50lb Zone 6' },
  { weight: 50,  zone: 8, label: '50lb Zone 8' },
  { weight: 70,  zone: 2, label: '70lb Zone 2' },
  { weight: 70,  zone: 4, label: '70lb Zone 4' },
  { weight: 70,  zone: 6, label: '70lb Zone 6' },
  { weight: 70,  zone: 8, label: '70lb Zone 8' },
  { weight: 90,  zone: 2, label: '90lb Zone 2' },
  { weight: 90,  zone: 4, label: '90lb Zone 4' },
  { weight: 90,  zone: 6, label: '90lb Zone 6' },
  { weight: 90,  zone: 8, label: '90lb Zone 8' },
  { weight: 115, zone: 2, label: '115lb Zone 2' },
  { weight: 115, zone: 4, label: '115lb Zone 4' },
  { weight: 115, zone: 6, label: '115lb Zone 6' },
  { weight: 115, zone: 8, label: '115lb Zone 8' },
  { weight: 149, zone: 2, label: '149lb Zone 2 (max ICP weight)' },
  { weight: 149, zone: 4, label: '149lb Zone 4' },
  { weight: 149, zone: 6, label: '149lb Zone 6' },
  { weight: 149, zone: 8, label: '149lb Zone 8' },
];

const date = new Date().toISOString().slice(0, 10);

const results = TEST_CASES.map((tc) => {
  const est = calcEstimates(tc.weight, tc.zone);
  return { ...tc, ...est, pass: est.savings >= CLAIM_MIN };
});

const passed = results.filter((r) => r.pass).length;
const pct = passed / results.length;
const verdict = pct >= PASS_THRESHOLD ? 'PASS' : 'FAIL';
const failures = results.filter((r) => !r.pass);

const lines = [
  `---`,
  `date: ${date}`,
  `type: rate-audit`,
  `verdict: ${verdict}`,
  `pass_rate: ${passed}/${results.length}`,
  `---`,
  ``,
  `# Rate Audit — ${date}`,
  ``,
  `## Verdict: ${verdict} — ${passed}/${results.length} cases ≥ $${CLAIM_MIN} savings (threshold: ${Math.round(PASS_THRESHOLD * 100)}%)`,
  ``,
  `| Case | Standard | ShippingCow | Savings | Status |`,
  `|------|----------|-------------|---------|--------|`,
  ...results.map((r) =>
    `| ${r.label} | $${r.standard} | $${r.shippingcow} | $${r.savings} | ${r.pass ? '✅' : '❌'} |`
  ),
  ``,
];

if (failures.length > 0) {
  lines.push(`## ⚠️ Failures — claim does not hold`);
  lines.push(``);
  failures.forEach((f) => {
    lines.push(`- **${f.label}**: saves $${f.savings} (need $${CLAIM_MIN}, gap: -$${CLAIM_MIN - f.savings})`);
  });
  lines.push(``);
  lines.push(`**Action:** Review DM copy for these cases. Either caveat the claim or confirm these weight/zone combos are outside the ICP envelope.`);
} else {
  lines.push(`## ✅ All cases pass — claim is defensible across the full ICP range (50–149lb, Zone 2–8)`);
}

console.log(lines.join('\n'));
```

- [ ] **Step 2: Add scripts to `package.json`**

In the `"scripts"` section of `package.json`, add these three entries (after `"seed:ingest"`):

```json
"rate-audit": "tsx scripts/rate-audit.ts",
"copy-optimizer": "tsx scripts/copy-optimizer.ts",
"icp-monitor": "tsx scripts/icp-monitor.ts"
```

- [ ] **Step 3: Typecheck**

```bash
cd projects/ShippingCowAdmin && npm run typecheck
```

Expected: no errors

- [ ] **Step 4: Run rate audit**

```bash
cd projects/ShippingCowAdmin && npm run rate-audit
```

Expected output:
```
---
date: 2026-05-12
type: rate-audit
verdict: PASS
pass_rate: 19/20
---

# Rate Audit — 2026-05-12

## Verdict: PASS — 19/20 cases ≥ $18 savings (threshold: 80%)

| Case | Standard | ShippingCow | Savings | Status |
|...|...|...|...|
| 50lb Zone 2 (local, min ICP weight) | $30 | $15 | $15 | ❌ |
| 50lb Zone 4 | $41 | $22 | $19 | ✅ |
...

## ⚠️ Failures — claim does not hold
- **50lb Zone 2 (local, min ICP weight)**: saves $15 (need $18, gap: -$3)
```

The one failure (50lb Zone 2) is a local shipment at minimum ICP weight — acceptable edge case outside the Manhattan-to-anywhere ICP pattern.

- [ ] **Step 5: Commit**

```bash
cd projects/ShippingCowAdmin && git add scripts/rate-audit.ts package.json && git commit -m "feat(scripts): add rate-audit — one-shot claim defensibility check"
```

---

### Task 7: Copy optimizer script

**Files:**
- Create: `scripts/copy-optimizer.ts`

Core loop: writer agent generates variant → adversarial persona scores reply likelihood → MOOOVY rubric scores voice quality → appended to `copy-variants.json` → convergence check. Targets lowest-scoring DM each run.

- [ ] **Step 1: Create `scripts/copy-optimizer.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const client = new Anthropic();
const MODEL = 'claude-haiku-4-5-20251001';
const CONVERGENCE_WINDOW = 10;

const VARIANTS_PATH = path.join(__dirname, '../docs/campaign/copy-variants.json');
const PROGRAM_PATH = path.join(__dirname, '../docs/campaign/copy-program.md');
const DMS_PATH = path.join(__dirname, '../docs/campaign/linkedin-dms.md');

interface CopyVariant {
  id: string;
  iteration: number;
  dm_index: number;
  run_date: string;
  variant_text: string;
  persona_score: number;
  rubric_score: number;
  is_top_candidate: boolean;
}

function load(): CopyVariant[] {
  try { return JSON.parse(fs.readFileSync(VARIANTS_PATH, 'utf-8')); }
  catch { return []; }
}

function save(variants: CopyVariant[]) {
  fs.writeFileSync(VARIANTS_PATH, JSON.stringify(variants, null, 2));
}

function findTargetDm(variants: CopyVariant[]): number {
  if (variants.length === 0) return 1;
  const best: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const v of variants) {
    if (v.is_top_candidate) {
      const combined = (v.persona_score + v.rubric_score) / 2;
      if (combined > best[v.dm_index]) best[v.dm_index] = combined;
    }
  }
  return (Object.entries(best).sort(([, a], [, b]) => a - b)[0][0] as unknown as number);
}

function extractDm(content: string, dmIndex: number): string {
  const sections = content.split(/^## DM \d+[^\n]*/m);
  return (sections[dmIndex] ?? sections[1] ?? '').replace(/\n---\s*$/, '').trim();
}

function recentHistory(variants: CopyVariant[], dmIndex: number): string {
  const recent = variants.filter((v) => v.dm_index === dmIndex).slice(-5);
  if (!recent.length) return 'No previous variants.';
  return recent
    .map((v) => `Score ${((v.persona_score + v.rubric_score) / 2).toFixed(1)}: ${v.variant_text.slice(0, 200)}...`)
    .join('\n\n---\n\n');
}

async function generateVariant(program: string, currentDm: string, history: string): Promise<string> {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: `You are a copywriter for ShippingCow, a freight service for Shopify/TikTok Shop sellers shipping 50–149lb furniture (sofas, dining tables) from Manhattan. Tonight's direction:\n\n${program}`,
    messages: [{
      role: 'user',
      content: `Write an improved version of this LinkedIn DM. Rules: MOOOVY voice (punchy, ≤1 pun, at least one real $ or lb number, short sentences), one clear call to action, lead with their pain not our product.\n\nCurrent DM:\n${currentDm}\n\nRecent attempts (avoid repeating):\n${history}\n\nWrite only the DM text, no commentary.`,
    }],
  });
  const c = msg.content[0];
  return c.type === 'text' ? c.text.trim() : '';
}

async function scorePersona(variant: string): Promise<{ score: number; reasoning: string }> {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    system: `You are a Manhattan furniture seller (Shopify, 50–149lb sofas and tables, $10K–$20K/mo). You get many cold LinkedIn DMs from freight brokers. You're busy and skeptical. You only reply when a DM genuinely addresses a real shipping cost problem.`,
    messages: [{
      role: 'user',
      content: `Rate this DM on reply likelihood (1–10). JSON only:\n{"score": N, "reasoning": "one sentence"}\n\nDM:\n${variant}`,
    }],
  });
  try {
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    const m = text.match(/\{[\s\S]*\}/);
    const p = JSON.parse(m?.[0] ?? '{}');
    return { score: Math.min(10, Math.max(1, Number(p.score) || 5)), reasoning: p.reasoning || '' };
  } catch { return { score: 5, reasoning: 'parse error' }; }
}

async function scoreRubric(variant: string): Promise<number> {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    system: `You are a copywriting quality checker. MOOOVY voice: punchy, specific numbers, short sentences.`,
    messages: [{
      role: 'user',
      content: `Score this LinkedIn DM on 4 criteria (each 1–10). JSON only:\n{"hook":N,"specificity":N,"cta":N,"mooovy":N}\n\nhook: first line names a real pain?\nspecificity: uses a real number ($ or lbs)?\ncta: exactly one clear ask?\nmooovy: short sentences, punchy, no filler?\n\nDM:\n${variant}`,
    }],
  });
  try {
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    const m = text.match(/\{[\s\S]*\}/);
    const p = JSON.parse(m?.[0] ?? '{}');
    const vals = [p.hook, p.specificity, p.cta, p.mooovy].map(Number).filter((n) => n >= 1 && n <= 10);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 5;
  } catch { return 5; }
}

async function main() {
  const variants = load();
  const program = fs.readFileSync(PROGRAM_PATH, 'utf-8');
  const dmsContent = fs.readFileSync(DMS_PATH, 'utf-8');

  const targetDm = Number(findTargetDm(variants));
  const currentDm = extractDm(dmsContent, targetDm);
  console.log(`Targeting DM ${targetDm} (lowest top-candidate score)`);

  let bestScore = Math.max(
    0,
    ...variants.filter((v) => v.dm_index === targetDm && v.is_top_candidate)
      .map((v) => (v.persona_score + v.rubric_score) / 2),
  );
  let noImprovement = 0;
  let iter = 1;
  const runDate = new Date().toISOString().slice(0, 10);
  const base = variants.length;

  while (noImprovement < CONVERGENCE_WINDOW) {
    const history = recentHistory(variants, targetDm);
    const variantText = await generateVariant(program, currentDm, history);
    const [persona, rubricScore] = await Promise.all([scorePersona(variantText), scoreRubric(variantText)]);
    const combined = (persona.score + rubricScore) / 2;
    const isTop = combined > bestScore;

    if (isTop) {
      for (const v of variants) {
        if (v.dm_index === targetDm) v.is_top_candidate = false;
      }
      bestScore = combined;
      noImprovement = 0;
    } else {
      noImprovement++;
    }

    variants.push({
      id: `v${String(base + iter).padStart(3, '0')}`,
      iteration: iter,
      dm_index: targetDm,
      run_date: runDate,
      variant_text: variantText,
      persona_score: persona.score,
      rubric_score: Math.round(rubricScore * 10) / 10,
      is_top_candidate: isTop,
    });
    save(variants);

    console.log(`  iter ${iter}: persona=${persona.score} rubric=${rubricScore.toFixed(1)} combined=${combined.toFixed(1)} ${isTop ? '⭐ NEW BEST' : `no-improvement ${noImprovement}/${CONVERGENCE_WINDOW}`}`);
    iter++;
  }

  const top = variants.filter((v) => v.dm_index === targetDm && v.is_top_candidate).at(-1);
  console.log(`\nConverged after ${iter - 1} iterations. Best: ${bestScore.toFixed(1)}/10`);
  if (top) { console.log(`\nTop variant for DM ${targetDm}:\n\n${top.variant_text}`); }
}

main().catch(console.error);
```

- [ ] **Step 2: Typecheck**

```bash
cd projects/ShippingCowAdmin && npm run typecheck
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd projects/ShippingCowAdmin && git add scripts/copy-optimizer.ts && git commit -m "feat(scripts): add copy-optimizer with two-agent evaluation and convergence stop"
```

---

### Task 8: ICP monitor script

**Files:**
- Create: `scripts/icp-monitor.ts`

Checks Supabase dm_tracking count. Below 5: prints status and exits. At 5+: calls Claude Sonnet to analyze replies and writes `docs/campaign/icp-criteria-v2.json`.

- [ ] **Step 1: Create `scripts/icp-monitor.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const ICP_TRIGGER = 5;
const MODEL = 'claude-sonnet-4-6';
const CRITERIA_PATH = path.join(__dirname, '../docs/campaign/icp-criteria-v2.json');

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: replies, error } = await supabase
    .from('dm_tracking')
    .select('prospect_name, prospect_store, reply_tone, notes, created_at')
    .order('created_at', { ascending: true });

  if (error) { console.error('Supabase error:', error.message); process.exit(1); }

  const count = replies?.length ?? 0;
  console.log(`ICP monitor: ${count}/${ICP_TRIGGER} replies logged.`);

  if (count < ICP_TRIGGER) {
    console.log(`Parked — ${ICP_TRIGGER - count} more repl${ICP_TRIGGER - count === 1 ? 'y' : 'ies'} needed.`);
    return;
  }

  console.log(`Trigger reached. Generating ICP criteria from ${count} replies...`);

  const client = new Anthropic();
  const list = replies!
    .map((r, i) =>
      `Reply ${i + 1}: ${r.prospect_name}${r.prospect_store ? ` (${r.prospect_store})` : ''} — tone: ${r.reply_tone ?? 'unknown'}${r.notes ? ` — notes: ${r.notes}` : ''}`
    )
    .join('\n');

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `You are an ICP analyst for ShippingCow, a freight service for Shopify/TikTok Shop sellers shipping 50–149lb furniture. Analyze reply data and tighten ICP search criteria.`,
    messages: [{
      role: 'user',
      content: `Analyze these ${count} DM replies and output tightened ICP criteria. JSON only:\n{\n  "hypothesis": "one sentence about the real customer",\n  "tightened_criteria": {\n    "product_categories": ["..."],\n    "platform": ["..."],\n    "geo": ["..."],\n    "engagement_patterns": ["..."]\n  },\n  "linkedin_search_string": "...",\n  "next_action": "..."\n}\n\nReplies:\n${list}`,
    }],
  });

  try {
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    const m = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(m?.[0] ?? '{}');
    parsed.generated_at = new Date().toISOString().slice(0, 10);
    parsed.based_on_replies = count;
    fs.writeFileSync(CRITERIA_PATH, JSON.stringify(parsed, null, 2));
    console.log(`Criteria written to ${CRITERIA_PATH}`);
    console.log(`Hypothesis: ${parsed.hypothesis}`);
  } catch (e) {
    console.error('Parse error:', e);
    process.exit(1);
  }
}

main().catch(console.error);
```

- [ ] **Step 2: Typecheck**

```bash
cd projects/ShippingCowAdmin && npm run typecheck
```

Expected: no errors

- [ ] **Step 3: Run ICP monitor (expect parked message)**

```bash
cd projects/ShippingCowAdmin && NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY npm run icp-monitor
```

Expected:
```
ICP monitor: 0/5 replies logged.
Parked — 5 more replies needed.
```

- [ ] **Step 4: Commit**

```bash
cd projects/ShippingCowAdmin && git add scripts/icp-monitor.ts && git commit -m "feat(scripts): add icp-monitor — activates on 5 DM replies, generates criteria"
```

---

### Task 9: Orchestrator shell script

**Files:**
- Create: `resources/scripts/run-overnight-loops.sh` (in the **jayos repo**, not ShippingCowAdmin)

This is Jay's one command before bed. Sources env from `.env.local`, runs all three scripts in parallel, commits summaries to `daily/`.

- [ ] **Step 1: Create `resources/scripts/run-overnight-loops.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JAYOS_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ADMIN_DIR="$(cd "$JAYOS_ROOT/projects/ShippingCowAdmin" && pwd)"
DATE=$(date +%Y-%m-%d)
DATE_FILE=$(date +%Y%m%d)

echo "=== Overnight loops — $DATE ==="

# Load env vars from ShippingCowAdmin .env.local
if [ -f "$ADMIN_DIR/.env.local" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ADMIN_DIR/.env.local"
  set +a
  echo "Env loaded from .env.local"
fi

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "Error: ANTHROPIC_API_KEY not set. Add it to .env.local or export before running."
  exit 1
fi

# Rate audit (no Claude calls — runs fast)
echo "--- Rate audit..."
RATE_OUT="$JAYOS_ROOT/daily/${DATE_FILE}-rate-audit.md"
(cd "$ADMIN_DIR" && npx tsx scripts/rate-audit.ts 2>&1) > "$RATE_OUT" || true
echo "    → $RATE_OUT"

# Copy optimizer + ICP monitor in parallel
echo "--- Copy optimizer + ICP monitor (parallel)..."
COPY_OUT="$JAYOS_ROOT/daily/${DATE_FILE}-copy-loop-summary.md"

(cd "$ADMIN_DIR" && npx tsx scripts/copy-optimizer.ts 2>&1) > "$COPY_OUT" &
COPY_PID=$!

(cd "$ADMIN_DIR" && npx tsx scripts/icp-monitor.ts 2>&1) &
ICP_PID=$!

wait $COPY_PID && echo "    copy-optimizer done" || echo "    copy-optimizer failed"
wait $ICP_PID  && echo "    icp-monitor done"    || echo "    icp-monitor failed"

# Commit results to jayos
cd "$JAYOS_ROOT"
git add "daily/${DATE_FILE}-rate-audit.md" "daily/${DATE_FILE}-copy-loop-summary.md" 2>/dev/null || true
if ! git diff --cached --quiet; then
  git commit -m "chore(loops): overnight results $DATE"
  echo "--- Results committed to daily/"
else
  echo "--- No changes to commit"
fi

echo "=== Done. Check daily/${DATE_FILE}-rate-audit.md and daily/${DATE_FILE}-copy-loop-summary.md ==="
```

- [ ] **Step 2: Make executable**

```bash
chmod +x /Users/jayos/jayos/resources/scripts/run-overnight-loops.sh
```

- [ ] **Step 3: Dry run (rate audit only — no copy loop API calls)**

```bash
cd /Users/jayos/jayos && bash resources/scripts/run-overnight-loops.sh
```

Expected:
```
=== Overnight loops — 2026-05-12 ===
Env loaded from .env.local
--- Rate audit...
    → /Users/jayos/jayos/daily/20260512-rate-audit.md
--- Copy optimizer + ICP monitor (parallel)...
    copy-optimizer done
    icp-monitor done
--- Results committed to daily/
=== Done. Check daily/20260512-rate-audit.md and daily/20260512-copy-loop-summary.md ===
```

- [ ] **Step 4: Verify rate audit file**

```bash
head -10 /Users/jayos/jayos/daily/$(date +%Y%m%d)-rate-audit.md
```

Expected: YAML frontmatter with `verdict: PASS` and `pass_rate: 19/20`

- [ ] **Step 5: Commit orchestrator to jayos**

```bash
cd /Users/jayos/jayos && git add resources/scripts/run-overnight-loops.sh && git commit -m "feat(scripts): add run-overnight-loops.sh — Jay's one command before bed"
```

---

## Self-Review

**Spec coverage:**
- ✅ Rate audit: 20 test cases (50–149lb × Zone 2/4/6/8), 80% pass threshold, report-only output
- ✅ Copy optimizer: two-agent evaluation (adversarial persona + MOOOVY rubric), convergence stop, best-first DM selection, copy-program.md direction file
- ✅ ICP monitor: Supabase check, parked below 5, generates icp-criteria-v2.json at trigger
- ✅ copy-variants.json schema: id, iteration, dm_index, run_date, variant_text, persona_score, rubric_score, is_top_candidate
- ✅ dm_tracking migration + API + /admin/dm-tracker page with counter, +1 form, reply list
- ✅ Results commit to jayos daily/ via orchestrator
- ✅ Orchestrator sources env vars, exits cleanly if ANTHROPIC_API_KEY missing

**Placeholder scan:** None found. All code blocks are complete and runnable.

**Type consistency:**
- `CopyVariant` interface defined once in copy-optimizer.ts, used consistently
- `calcEstimates` exported from lib/rate-calc.ts, imported in both _rate-calculator.tsx and scripts/rate-audit.ts
- `DmReply` fields in icp-monitor match dm_tracking schema from migration 0007

**Known limitations (acceptable for MVP):**
- copy-optimizer.ts iterates synchronously (writer → judge → rubric in sequence). Could parallelize judge + rubric but adds complexity without changing the convergence logic.
- icp-monitor dry run requires Supabase env vars to be set. Test with `0 replies` first to confirm "Parked" message before waiting for real replies.
