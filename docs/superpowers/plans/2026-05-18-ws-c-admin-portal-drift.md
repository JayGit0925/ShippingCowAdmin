# WS C — Admin Portal Drift Audit & Fix Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring every `app/admin/*` section into exact visual and functional parity with `Admin Portal.html` (the 953-line Babel-standalone React design source of truth).

**Architecture:** Section-by-section audit: read the prototype section, read the Next.js implementation, identify specific gaps, fix inline. Each task covers one admin section and commits on completion. No new routes — only fixing existing ones. The micro-components in `components/ui/` are already correct (badge, button, card, eyebrow, sparkline, tab-bar, trend-arrow); this plan uses them as-is.

**Tech Stack:** Next.js 14 App Router · TypeScript strict · `components/ui/*` · `lib/brand.ts` · `lib/audit.ts` · Supabase admin client · Playwright (e2e from `2026-05-18-e2e-testing.md` validates each fix)

---

## Prototype section map

Read these sections in `Admin Portal.html` before each corresponding task:

| Section | Prototype function | Next.js location |
|---|---|---|
| Dashboard | `DashboardSection()` | `app/admin/page.tsx` + `_kpi-bar.tsx` + `_mrr-chart.tsx` + `_alert-queue.tsx` + `_health-tiles.tsx` |
| Customers | `CustomersSection()` + `OrgDrawer()` | `app/admin/customers/` + `app/admin/customers/[orgId]/` |
| Revenue | `RevenueSection()` | `app/admin/revenue/` |
| Reference | `ReferenceSection()` + `EditorModal()` | `app/admin/reference/` + `app/admin/reference/[table]/` |
| Platform | `PlatformSection()` | `app/admin/platform/` |
| Audit | `AuditSection()` | `app/admin/audit/` |
| Security | `SecuritySection()` | `app/admin/security/` |
| Tickets | `TicketsSection()` + `TicketThread()` | `app/admin/tickets/` + `app/admin/tickets/[ticketId]/` |

---

## How to read Admin Portal.html

`Admin Portal.html` is a single-file Babel-standalone React app. Each section is a function component. To read a section:

```bash
# grep for section start, read ~80 lines
grep -n "function DashboardSection" "Admin Portal.html"
# then read from that line number
```

Open it in a browser (double-click) → click nav items → inspect the rendered UI with DevTools. This is faster than reading raw JSX for visual fidelity checks.

---

## Task 1: Dashboard — KPI bar, MRR chart, alert queue, health tiles

**Files:**
- Read: `Admin Portal.html` lines from `function DashboardSection` (~80 lines)
- Modify: `app/admin/_kpi-bar.tsx` (current: 48 lines)
- Modify: `app/admin/_mrr-chart.tsx` (current: 10 lines — thin, likely missing period tabs)
- Modify: `app/admin/_alert-queue.tsx`
- Modify: `app/admin/_health-tiles.tsx`

- [ ] **Step 1: Open Admin Portal.html in browser, click Dashboard, note exact layout**

Verify these specific elements exist:

1. **KPI bar**: 6 tiles in one horizontal row. Labels: `MRR`, `ACTIVE ORGS`, `30D SIGNUPS`, `CALF→COW`, `CHURN RISK`, `FAILED PMTS`. Each tile shows: value (large number/currency), label (eyebrow style), and a trend arrow or percentage subtext.
2. **MRR chart**: SVG sparkline labeled `NET NEW MRR (12-MONTH TRAILING)` with **period selector tabs** (3MO / 6MO / 12MO). The current `_mrr-chart.tsx` uses `<Sparkline>` but has **no period tabs**.
3. **Alert queue**: Cards per alert, severity-colored left border, dismiss button.
4. **Health tiles**: 2-column grid of status indicators (DB latency, API uptime, Stripe webhook, etc.).

- [ ] **Step 2: Fix `_mrr-chart.tsx` — add period selector tabs**

Replace the entire file content with:

```typescript
'use client';
import { useState } from 'react';
import { Sparkline } from '@/components/ui/sparkline';
import { BRAND } from '@/lib/brand';
import type { MrrSeriesPoint } from '@/lib/metrics';

type Period = '3MO' | '6MO' | '12MO';
const PERIODS: Period[] = ['3MO', '6MO', '12MO'];
const MONTHS: Record<Period, number> = { '3MO': 3, '6MO': 6, '12MO': 12 };

export function MrrChart({ series }: { series: MrrSeriesPoint[] }) {
  const [period, setPeriod] = useState<Period>('12MO');
  const slice = series.slice(-MONTHS[period]);
  const points = slice.map((s) => ({
    x: s.month,
    y: s.new_mrr + s.expansion_mrr - s.churned_mrr,
  }));
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 9,
              padding: '4px 10px',
              border: `2px solid ${BRAND.charcoal}`,
              background: period === p ? BRAND.charcoal : 'transparent',
              color: period === p ? BRAND.white : BRAND.charcoal,
              cursor: 'pointer',
              letterSpacing: '0.03em',
            }}
          >
            {p}
          </button>
        ))}
      </div>
      <Sparkline series={points} label="NET NEW MRR (12-MONTH TRAILING)" />
    </div>
  );
}
```

- [ ] **Step 3: Verify KPI bar renders 6 tiles**

Read `app/admin/_kpi-bar.tsx`. Confirm it renders exactly 6 KPI slots. The metrics fetched in `page.tsx` are `[mrr, active, signups, conv, churn, failed]` — that's 6. If the component renders fewer, add the missing slots.

Expected tile labels (check against prototype's DashboardSection): MRR · Active Orgs · 30D Signups · Calf→Cow Rate · Churn Risk · Failed Pmts.

If any label or layout differs from the prototype, update `_kpi-bar.tsx` to match.

- [ ] **Step 4: Run admin smoke test to confirm no crash**

```bash
npx playwright test tests/e2e/admin-smoke.spec.ts --grep="/admin renders KPI" --reporter=list
```

Expected: PASS.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add app/admin/_mrr-chart.tsx app/admin/_kpi-bar.tsx
git commit -m "fix(admin/dashboard): add MRR period selector tabs, verify KPI bar parity"
```

---

## Task 2: Customers — org table + OrgDrawer 5 tabs + 5 quick actions

**Files:**
- Read: `Admin Portal.html` `function CustomersSection` + `function OrgDrawer`
- Modify: `app/admin/customers/_list.tsx` (current: 126 lines)
- Modify: `app/admin/customers/[orgId]/page.tsx` (current: 374 lines)
- Modify: `app/admin/customers/[orgId]/_drawer-tabs.tsx` (current: 24 lines)

- [ ] **Step 1: Open Admin Portal.html, click Customers, note exact elements**

Verify:
1. **Org table**: columns = ORG NAME · TIER · STATUS · MRR · CHURN RISK · MEMBERS · JOINED · ACTIONS. Tier badge color-coded (Calf=sky, Cow=blue, Bull=charcoal). Churn risk red if high. Click row → opens OrgDrawer.
2. **OrgDrawer**: right-side panel or modal. Header: org name + tier badge + status. 5 tabs: **Overview · Activity · Usage · Subscriptions · Notes**. Quick actions bar (5 buttons): **Suspend · Reactivate · Override Tier · Add Note · Impersonate**.
3. Suspend/Reactivate need a confirmation modal (typed confirmation per CLAUDE.md hard rules for destructive actions).

- [ ] **Step 2: Confirm `_drawer-tabs.tsx` has all 5 tabs**

Read `app/admin/customers/[orgId]/_drawer-tabs.tsx`. If it only has a subset of the 5 tabs (Overview, Activity, Usage, Subscriptions, Notes), expand it to include all 5. Each tab panel can be a simple `<div>` stub if the data hasn't been wired, but all 5 tab buttons must render.

Expected full `_drawer-tabs.tsx`:

```typescript
'use client';
import { useState } from 'react';
import { TabBar } from '@/components/ui/tab-bar';
import { BRAND } from '@/lib/brand';

type Tab = 'Overview' | 'Activity' | 'Usage' | 'Subscriptions' | 'Notes';
const TABS: Tab[] = ['Overview', 'Activity', 'Usage', 'Subscriptions', 'Notes'];

export function DrawerTabs({
  overview,
  activity,
  usage,
  subscriptions,
  notes,
}: {
  overview: React.ReactNode;
  activity: React.ReactNode;
  usage: React.ReactNode;
  subscriptions: React.ReactNode;
  notes: React.ReactNode;
}) {
  const [active, setActive] = useState<Tab>('Overview');
  const panels: Record<Tab, React.ReactNode> = {
    Overview: overview,
    Activity: activity,
    Usage: usage,
    Subscriptions: subscriptions,
    Notes: notes,
  };
  return (
    <div>
      <TabBar
        tabs={TABS}
        active={active}
        onSelect={(t) => setActive(t as Tab)}
        style={{ borderBottom: `3px solid ${BRAND.charcoal}` }}
      />
      <div style={{ padding: 20 }}>{panels[active]}</div>
    </div>
  );
}
```

- [ ] **Step 3: Confirm [orgId]/page.tsx passes all 5 panels to DrawerTabs**

Read `app/admin/customers/[orgId]/page.tsx`. Verify it renders `<DrawerTabs overview={...} activity={...} usage={...} subscriptions={...} notes={...} />`. If any panel prop is missing, add a `<p>No data yet.</p>` stub for that slot. Fix any prop-name mismatches.

- [ ] **Step 4: Confirm 5 quick action buttons exist on [orgId]/page.tsx**

The prototype OrgDrawer has: Suspend · Reactivate · Override Tier · Add Note · Impersonate. Check that `[orgId]/page.tsx` renders form/button elements for all 5. Suspend and Override Tier must show a confirmation step (typed modal or inline confirmation) per CLAUDE.md hard rule.

If any action button is missing, add a `<Button variant="ghost" size="sm">Action Name</Button>` stub that links to the appropriate `/api/admin/orgs/[orgId]/[action]` route.

- [ ] **Step 5: Run customer smoke test**

```bash
npx playwright test tests/e2e/admin-smoke.spec.ts --grep="customers" --reporter=list
```

Expected: PASS.

- [ ] **Step 6: Typecheck + commit**

```bash
npm run typecheck
git add app/admin/customers/
git commit -m "fix(admin/customers): ensure all 5 drawer tabs and 5 quick actions present"
```

---

## Task 3: Revenue — sparkline, conversion funnel, failed payment queue

**Files:**
- Read: `Admin Portal.html` `function RevenueSection`
- Read: `app/admin/revenue/page.tsx` (43 lines) + subcomponents `_funnel.tsx` + `_failed-queue.tsx`

- [ ] **Step 1: Open Admin Portal.html, click Revenue, note exact layout**

Verify:
1. **Sparkline at top**: new MRR trailing 12 months.
2. **Conversion funnel**: Visits → Quotes → Trials → Paid → Expanded. Horizontal bar chart or step diagram with counts + conversion rates between steps.
3. **Failed payment queue**: table with columns ORG · AMOUNT · ATTEMPTS · LAST ATTEMPT · ACTIONS (Retry / Waive).

- [ ] **Step 2: Read `_funnel.tsx` and `_failed-queue.tsx`**

```bash
cat app/admin/revenue/_funnel.tsx
cat app/admin/revenue/_failed-queue.tsx
```

For each file, compare its rendered output to the prototype. Common gaps:
- Funnel may be missing step labels or conversion-rate percentages between steps.
- Failed queue may be missing the Retry / Waive action buttons.

Fix any visual gaps so the layout matches the prototype exactly. Use `BRAND` tokens and the existing `Button` component for action buttons.

- [ ] **Step 3: Run revenue smoke test**

```bash
npx playwright test tests/e2e/admin-smoke.spec.ts --grep="/admin/revenue" --reporter=list
```

Expected: PASS.

- [ ] **Step 4: Typecheck + commit**

```bash
npm run typecheck
git add app/admin/revenue/
git commit -m "fix(admin/revenue): align funnel and failed-queue with prototype"
```

---

## Task 4: Reference data — 6-card overview + 4-step publish workflow

**Files:**
- Read: `Admin Portal.html` `function ReferenceSection` + `function EditorModal`
- Read: `app/admin/reference/page.tsx` (207 lines)
- Read: `app/admin/reference/[table]/` directory

- [ ] **Step 1: Open Admin Portal.html, click Rate Cards / Reference, note exact layout**

Verify:
1. **Overview**: 6 cards (zone_matrix · our_carrier_rates · carrier_retail_rates · our_warehousing_fees · our_logistics_fees · category_benchmarks). Each card shows: table name · live row count · draft count · last updated. Clicking opens `EditorModal`.
2. **EditorModal** (4-step publish workflow):
   - Step 1 **Edit**: spreadsheet-style row editor with add/edit/delete. Validate button.
   - Step 2 **Validate**: shows validation results (errors/warnings per row). Fix or proceed.
   - Step 3 **Review**: diff view — new rows vs superseded rows (with effective_from/effective_to dates).
   - Step 4 **Publish**: confirm button → calls `/api/admin/reference/[table]/publish`.

- [ ] **Step 2: Check `app/admin/reference/[table]/`**

```bash
ls app/admin/reference/[table]/
cat app/admin/reference/[table]/page.tsx
```

If the `[table]` route only renders a stub (< 50 lines), it needs the 4-step editor UI. Implement it using the following structure:

```typescript
// app/admin/reference/[table]/page.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/eyebrow';
import { BRAND } from '@/lib/brand';

type Step = 'edit' | 'validate' | 'review' | 'publish';
const STEPS: Step[] = ['edit', 'validate', 'review', 'publish'];

export default function ReferenceTableEditorPage({
  params,
}: {
  params: { table: string };
}) {
  const [step, setStep] = useState<Step>('edit');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Eyebrow>{`// REFERENCE · ${params.table.toUpperCase()}`}</Eyebrow>
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8 }}>
        {STEPS.map((s, i) => (
          <div
            key={s}
            style={{
              padding: '6px 14px',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 9,
              border: `2px solid ${BRAND.charcoal}`,
              background: step === s ? BRAND.charcoal : 'transparent',
              color: step === s ? BRAND.white : BRAND.charcoal,
              letterSpacing: '0.03em',
            }}
          >
            {`${i + 1}. ${s.toUpperCase()}`}
          </div>
        ))}
      </div>
      {/* Step panels — implement each below */}
      {step === 'edit'     && <EditPanel table={params.table} onNext={() => setStep('validate')} />}
      {step === 'validate' && <ValidatePanel table={params.table} onBack={() => setStep('edit')} onNext={() => setStep('review')} />}
      {step === 'review'   && <ReviewPanel table={params.table} onBack={() => setStep('validate')} onNext={() => setStep('publish')} />}
      {step === 'publish'  && <PublishPanel table={params.table} onBack={() => setStep('review')} />}
    </div>
  );
}
```

Then implement `EditPanel`, `ValidatePanel`, `ReviewPanel`, `PublishPanel` as sub-components in the same file or in `app/admin/reference/[table]/_panels.tsx`. Each panel connects to the existing API routes under `app/api/admin/reference/[table]/*`.

- [ ] **Step 3: Verify 6 reference table cards render on the overview page**

Read `app/admin/reference/page.tsx`. Confirm it renders 6 cards (one per `REFERENCE_TABLES` entry). Each card must show: name, live count, draft count, last updated, and a link/button to `/admin/reference/[table]`.

- [ ] **Step 4: Run reference smoke test**

```bash
npx playwright test tests/e2e/admin-smoke.spec.ts --grep="/admin/reference" --reporter=list
```

Expected: PASS.

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add app/admin/reference/
git commit -m "fix(admin/reference): 4-step publish editor in [table] route"
```

---

## Task 5: Platform — 5-tab layout fidelity

**Files:**
- Read: `Admin Portal.html` `function PlatformSection`
- Read: `app/admin/platform/page.tsx` + `_flag-list.tsx` + `_kill-switch.tsx` + `_model-pins.tsx` + `_news-queue.tsx` + `_quota-panel.tsx` + `_tabs.tsx`

- [ ] **Step 1: Open Admin Portal.html, click Platform, note the 5-tab layout**

Verify each tab's content matches:
1. **Flags**: table of feature flags (key · value · enabled toggle · created). Toggle should call `/api/admin/platform/flags/[key]`.
2. **Kill switch**: `mooovy_enabled` flag with large toggle + reason textarea. Confirm destructive action before disabling.
3. **Model pins**: table of pinned Claude model versions (surface · model · pinned_at · unpin button).
4. **News queue**: table of pending news_items (headline · created · approve/reject buttons).
5. **Quotas**: table of per-org or global rate limits (if applicable to current schema).

- [ ] **Step 2: For each of the 5 panels, read the existing file and fix gaps**

For each panel file (`_flag-list.tsx`, `_kill-switch.tsx`, `_model-pins.tsx`, `_news-queue.tsx`, `_quota-panel.tsx`):
- Does it render a table or appropriate UI?
- Do action buttons call the correct API routes?
- Are destructive actions gated by confirmation?

Fix any missing elements to match the prototype exactly.

- [ ] **Step 3: Confirm URL-based tab switching works**

The platform page uses `searchParams.tab` to set the active tab. Verify that navigating to `/admin/platform?tab=Kill+switch` renders the Kill switch panel. Check `_tabs.tsx` to confirm it emits `?tab=X` query params on click.

- [ ] **Step 4: Run platform smoke test**

```bash
npx playwright test tests/e2e/admin-smoke.spec.ts --grep="platform" --reporter=list
```

Expected: PASS.

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add app/admin/platform/
git commit -m "fix(admin/platform): align all 5 tab panels with prototype"
```

---

## Task 6: Audit Log — filter UI, expandable diff, CSV export link

**Files:**
- Read: `Admin Portal.html` `function AuditSection`
- Read: `app/admin/audit/page.tsx` (144 lines) + `_filters.tsx` + `_entry-detail.tsx`

- [ ] **Step 1: Open Admin Portal.html, click Audit Log, note layout**

Verify:
1. **Filter row**: action dropdown · actor ID input · from/to date pickers · Apply button.
2. **Table**: columns WHEN · ACTION · ACTOR · ORG · RESOURCE · REASON · (expand button).
3. **Expanded diff**: clicking the expand button on a row shows before/after JSON diff inline.
4. **Export CSV link**: `EXPORT CSV` text link above or below the table.

The current `app/admin/audit/page.tsx` already renders the table with all 7 columns including the expand detail. Read `_filters.tsx` and `_entry-detail.tsx` to confirm filters and diff rendering match the prototype.

- [ ] **Step 2: Read `_filters.tsx` — confirm all filter fields exist**

```bash
cat app/admin/audit/_filters.tsx
```

Confirm fields: action (text or select), actorId (text), orgId (text), from (date), to (date), Apply button that updates `?action=&actorId=&orgId=&from=&to=` query params.

If any filter field is missing, add it.

- [ ] **Step 3: Read `_entry-detail.tsx` — confirm diff rendering**

```bash
cat app/admin/audit/_entry-detail.tsx
```

The detail should render `before_value` and `after_value` as formatted JSON (or a key-by-key diff). If it's a stub, implement:

```typescript
// app/admin/audit/_entry-detail.tsx
'use client';
import { useState } from 'react';
import { BRAND } from '@/lib/brand';

export function AuditEntryDetail({
  beforeValue,
  afterValue,
}: {
  beforeValue: unknown;
  afterValue: unknown;
}) {
  const [open, setOpen] = useState(false);
  if (beforeValue == null && afterValue == null) return null;
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8,
          padding: '3px 8px',
          border: `2px solid ${BRAND.charcoal}`,
          background: 'transparent',
          cursor: 'pointer',
          letterSpacing: '0.03em',
        }}
      >
        {open ? 'HIDE' : 'DIFF'}
      </button>
      {open && (
        <div
          style={{
            marginTop: 8,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            fontFamily: 'monospace',
            fontSize: 11,
          }}
        >
          <pre
            style={{
              background: '#FFF0F0',
              padding: 8,
              border: `1px solid ${BRAND.red}`,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {beforeValue != null ? JSON.stringify(beforeValue, null, 2) : '—'}
          </pre>
          <pre
            style={{
              background: '#F0FFF4',
              padding: 8,
              border: `1px solid ${BRAND.green}`,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {afterValue != null ? JSON.stringify(afterValue, null, 2) : '—'}
          </pre>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Typecheck + commit**

```bash
npm run typecheck
git add app/admin/audit/
git commit -m "fix(admin/audit): diff viewer + filter field completeness"
```

---

## Task 7: Security — admin list, suspicious sessions, CCPA form

**Files:**
- Read: `Admin Portal.html` `function SecuritySection`
- Read: `app/admin/security/page.tsx` (48 lines) + `_admin-list.tsx` + `_suspicious-sessions.tsx` + `_ccpa-form.tsx`

- [ ] **Step 1: Open Admin Portal.html, click Security, note layout**

Verify:
1. **Admin list**: table of platform_admins (user_id · role · is_active · created_at). Actions: deactivate (with confirmation).
2. **Suspicious sessions** (if user_sessions table exists): list of anomalous login sessions (multiple geos, rapid changes).
3. **CCPA/GDPR erasure form**: org ID input + confirm button → calls `/api/admin/security/ccpa`.

- [ ] **Step 2: Read each file and fix gaps vs prototype**

```bash
cat app/admin/security/_admin-list.tsx
cat app/admin/security/_suspicious-sessions.tsx
cat app/admin/security/_ccpa-form.tsx
```

For `_admin-list.tsx`: ensure deactivate action has confirmation.
For `_suspicious-sessions.tsx`: if `user_sessions` table is missing (expected — user portal hasn't been migrated), render an amber notice card: "Suspicious session detection requires the user portal migration to be applied."
For `_ccpa-form.tsx`: ensure the form has org ID input, email input, reason selector, and submit calls `/api/admin/security/ccpa`.

- [ ] **Step 3: Typecheck + commit**

```bash
npm run typecheck
git add app/admin/security/
git commit -m "fix(admin/security): deactivate confirmation, sessions notice, ccpa form"
```

---

## Task 8: Tickets — list panel + thread view + dual-mode reply

**Files:**
- Read: `Admin Portal.html` `function TicketsSection` + `function TicketThread`
- Read: `app/admin/tickets/page.tsx` (69 lines) + `_ticket-list.tsx` (86 lines) + `_thread.tsx` (167 lines)
- Read: `app/admin/tickets/[ticketId]/` directory

- [ ] **Step 1: Open Admin Portal.html, click Tickets, note layout**

Verify:
1. **Split-pane layout**: left sidebar (360px) = ticket list with status badges, priority dots. Right panel = selected ticket thread.
2. **Ticket list**: each item shows subject · status badge · priority dot · updated_at. Filter by status.
3. **TicketThread**: header = subject + status + priority selector. Message thread (alternating user/admin). Reply box at bottom.
4. **Dual-mode reply**: toggle between PUBLIC (customer sees it) and INTERNAL NOTE (admin only). Different background color per mode (public = white, internal = amber tint).

- [ ] **Step 2: Check `[ticketId]/` route exists and renders thread**

```bash
ls app/admin/tickets/[ticketId]/
cat app/admin/tickets/[ticketId]/page.tsx
```

The `[ticketId]` page should render the `TicketThread` component. If it's a stub, implement:

```typescript
// app/admin/tickets/[ticketId]/page.tsx
import { adminClient } from '@/lib/supabase/admin';
import { getAdminContext } from '@/lib/admin-context';
import { TicketThread } from '../_thread';

export const dynamic = 'force-dynamic';

export default async function TicketDetailPage({
  params,
}: {
  params: { ticketId: string };
}) {
  const supabase = adminClient();
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('id, subject, status, priority, org_id, updated_at')
    .eq('id', params.ticketId)
    .single();
  const { data: messages } = await supabase
    .from('ticket_messages')
    .select('id, body, is_internal, sender_type, created_at')
    .eq('ticket_id', params.ticketId)
    .order('created_at', { ascending: true });

  if (!ticket) return <p>Ticket not found.</p>;

  return (
    <TicketThread
      ticket={ticket as Parameters<typeof TicketThread>[0]['ticket']}
      messages={(messages ?? []) as Parameters<typeof TicketThread>[0]['messages']}
    />
  );
}
```

- [ ] **Step 3: Confirm `_thread.tsx` has dual-mode reply toggle**

Read `app/admin/tickets/_thread.tsx`. Verify it has:
- A toggle button switching between `'public'` and `'internal'` mode.
- Textarea background: white when public, `#FFFBEA` (amber tint) when internal.
- Submit calls `POST /api/admin/tickets/[ticketId]/reply` with `{ body, is_internal }`.

If the toggle is missing, add it:

```typescript
// Inside the reply form section of _thread.tsx:
const [mode, setMode] = useState<'public' | 'internal'>('public');

// Toggle button pair:
<div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
  {(['public', 'internal'] as const).map((m) => (
    <button
      key={m}
      onClick={() => setMode(m)}
      style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 8,
        padding: '4px 10px',
        border: `2px solid ${BRAND.charcoal}`,
        background: mode === m ? BRAND.charcoal : 'transparent',
        color: mode === m ? BRAND.white : BRAND.charcoal,
        cursor: 'pointer',
        letterSpacing: '0.03em',
      }}
    >
      {m.toUpperCase()}
    </button>
  ))}
</div>
// Textarea:
<textarea
  style={{
    background: mode === 'internal' ? '#FFFBEA' : BRAND.white,
    border: `3px solid ${BRAND.charcoal}`,
    padding: 10,
    width: '100%',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
  }}
/>
```

- [ ] **Step 4: Run tickets smoke test**

```bash
npx playwright test tests/e2e/admin-smoke.spec.ts --grep="tickets" --reporter=list
```

Expected: PASS.

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add app/admin/tickets/
git commit -m "fix(admin/tickets): ticket detail route + dual-mode reply toggle"
```

---

## Task 9: Full admin e2e pass

- [ ] **Step 1: Run complete admin smoke suite**

```bash
npx playwright test tests/e2e/admin-smoke.spec.ts --reporter=list
```

Expected: all 12 tests PASS.

- [ ] **Step 2: Run full build**

```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 3: Commit if any fixes were made**

```bash
git add -p
git commit -m "fix(admin): final parity fixes from full e2e pass"
```

---

## Self-Review

**Spec coverage:**
- Dashboard KPI bar (6 tiles) + MRR period tabs → Task 1 ✓
- Customers 5-tab drawer + 5 quick actions → Task 2 ✓
- Revenue funnel + failed queue actions → Task 3 ✓
- Reference 4-step publish workflow → Task 4 ✓
- Platform 5 tabs all wired → Task 5 ✓
- Audit diff viewer + filter fields → Task 6 ✓
- Security deactivate confirmation + CCPA form → Task 7 ✓
- Tickets thread route + dual-mode reply → Task 8 ✓
- Full e2e suite passes → Task 9 ✓

**Placeholder scan:**
- Every "read X file and fix" step specifies exactly what to look for and provides the replacement code where the gap is known.
- `_funnel.tsx` and `_failed-queue.tsx` in Task 3 are read-then-fix (can't know exact gaps without reading). Acceptable — instruction to fix is specific.

**Type consistency:**
- `DrawerTabs` props in Task 2 match what `[orgId]/page.tsx` must pass.
- `TicketThread` props in Task 8 match the `ticket` + `messages` shape from Supabase query.
- `AuditEntryDetail` props in Task 6 match existing `page.tsx` call: `beforeValue={r.before_value} afterValue={r.after_value}`.
