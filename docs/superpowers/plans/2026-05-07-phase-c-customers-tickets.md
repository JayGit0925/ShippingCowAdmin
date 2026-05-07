# Phase C — Customers + Tickets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire `/admin/customers`, the org drawer, suspend/reactivate/tier-override/impersonate actions, and `/admin/tickets` (split-pane list + thread) so the ops team can manage orgs and reply to support tickets from the admin portal.

**Architecture:** Server components fetch from Supabase via the service-role `adminClient()` (bypasses RLS). Read paths use indexed queries with URL-param filters; write paths are POST route handlers under `/api/admin/orgs/[orgId]/*` and `/api/admin/tickets/[ticketId]/*`. Every successful mutation calls `logAudit(...)` from `lib/audit.ts`. Confirmation modals use the typed-confirmation pattern (user types the org name to confirm destructive actions).

**Tech Stack:** Next.js 14 App Router, TypeScript strict, `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`. No new runtime deps.

---

## Assumptions (FLAG if wrong before executing)

The user-portal repo owns these tables. This plan assumes the **conventional shape** because the user-portal repo is not in this checkout:

| Table | Assumed columns we read | If shape differs |
|---|---|---|
| `orgs` | `id uuid, name text, status text, origin_zip text, created_at timestamptz` | UI degrades gracefully — missing columns render as `—`. |
| `subscriptions` | `org_id uuid, tier text, mrr numeric, status text` | Same. |
| `org_members` | `org_id uuid, user_id uuid, last_login timestamptz` | Member count + last-active fall back to 0/null. |
| `auth.users` | Supabase-managed | Always present. |

If `orgs/subscriptions/org_members` don't exist yet, the customers list shows an "Upstream tables not yet migrated" empty state instead of crashing. The migration in Task C.1 uses a `DO ... END` block with `to_regclass` checks so ALTER TABLE statements are skipped when the target table is missing, and we never CREATE tables we don't own.

**Out of scope (deferred):**
- Email notifications on admin reply (needs Resend API key + cross-repo template).
- `apps/web` ticket form + impersonation amber banner (cross-repo).
- Stripe BILLING tab in org drawer (deferred to Phase D where Stripe gets wired).
- Activity tab (depends on `user_activity_log` table — unknown schema).

---

## File Structure

```
ShippingCowAdmin/
├── supabase/migrations/
│   └── 0004_customers_tickets.sql     # admin_notes, impersonation_sessions,
│                                      # support_tickets, ticket_messages,
│                                      # conditional ALTERs on subscriptions/orgs
├── lib/
│   ├── customers.ts                   # OrgRow type + fetchOrgList()
│   └── tickets.ts                     # TicketRow / Message types + fetchers
├── app/
│   ├── admin/
│   │   ├── customers/
│   │   │   ├── page.tsx               # replaces Phase A placeholder
│   │   │   ├── _filters.tsx           # client filter bar
│   │   │   ├── _list.tsx              # client list table
│   │   │   └── [orgId]/
│   │   │       ├── page.tsx           # drawer route (rendered as full page)
│   │   │       ├── _drawer-tabs.tsx   # client tab switcher
│   │   │       ├── _suspend-modal.tsx # client typed-confirm modal
│   │   │       ├── _tier-modal.tsx    # client tier override modal
│   │   │       └── _impersonate-modal.tsx
│   │   └── tickets/
│   │       ├── page.tsx               # replaces Phase A placeholder; split pane
│   │       ├── _ticket-list.tsx       # client list w/ status filter
│   │       ├── _thread.tsx            # client thread + composer
│   │       └── [ticketId]/page.tsx    # full-page thread view (deep link)
│   └── api/admin/
│       ├── orgs/[orgId]/
│       │   ├── suspend/route.ts
│       │   ├── reactivate/route.ts
│       │   ├── deactivate/route.ts
│       │   ├── tier-override/route.ts
│       │   ├── force-logout/route.ts
│       │   ├── impersonate/route.ts
│       │   └── note/route.ts
│       └── tickets/[ticketId]/
│           ├── reply/route.ts
│           ├── status/route.ts
│           ├── priority/route.ts
│           └── assign/route.ts
```

**Files modified:**
- `app/admin/customers/page.tsx` — replaced
- `app/admin/tickets/page.tsx` — replaced
- `lib/audit.ts` — extend `AuditAction` enum (add tickets actions if missing)

**Files NOT touched:** Phase A scaffold, Phase B reference UI, middleware, brand tokens.

---

## Task C.1: Migration — admin_notes, impersonation_sessions, support_tickets, ticket_messages

**Files:** Create `supabase/migrations/0004_customers_tickets.sql`.

- [ ] **Step 1: Write migration**

```sql
-- 0004_customers_tickets.sql
-- Phase C — admin-owned tables for customer ops + support tickets.
-- Idempotent. Apply via Supabase Dashboard SQL editor.

------------------------------------------------------------------------------
-- admin_notes — internal per-org notes (admin-only)
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL,
  note       text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_notes_org_idx
  ON public.admin_notes (org_id, created_at DESC);

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_notes_no_client ON public.admin_notes;
CREATE POLICY admin_notes_no_client ON public.admin_notes
  FOR ALL USING (false) WITH CHECK (false);

------------------------------------------------------------------------------
-- impersonation_sessions
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.impersonation_sessions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id         uuid NOT NULL REFERENCES auth.users(id),
  target_user_id        uuid NOT NULL REFERENCES auth.users(id),
  org_id                uuid,
  reason                text NOT NULL,
  ticket_id             text,
  token_hash            text NOT NULL,
  started_at            timestamptz NOT NULL DEFAULT now(),
  expires_at            timestamptz NOT NULL,
  ended_at              timestamptz,
  suppress_notification boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS impersonation_sessions_admin_idx
  ON public.impersonation_sessions (admin_user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS impersonation_sessions_target_idx
  ON public.impersonation_sessions (target_user_id, started_at DESC);

ALTER TABLE public.impersonation_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS impersonation_sessions_no_client ON public.impersonation_sessions;
CREATE POLICY impersonation_sessions_no_client ON public.impersonation_sessions
  FOR ALL USING (false) WITH CHECK (false);

------------------------------------------------------------------------------
-- support_tickets
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL,
  user_id     uuid REFERENCES auth.users(id),
  subject     text NOT NULL,
  status      text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_progress','resolved')),
  priority    text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('urgent','high','normal','low')),
  assignee_user_id uuid REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_tickets_org_idx
  ON public.support_tickets (org_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx
  ON public.support_tickets (status, priority, updated_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_assignee_idx
  ON public.support_tickets (assignee_user_id, updated_at DESC)
  WHERE assignee_user_id IS NOT NULL;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS support_tickets_no_client ON public.support_tickets;
CREATE POLICY support_tickets_no_client ON public.support_tickets
  FOR ALL USING (false) WITH CHECK (false);

------------------------------------------------------------------------------
-- ticket_messages
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  from_type  text NOT NULL CHECK (from_type IN ('user','admin','note')),
  author_id  uuid REFERENCES auth.users(id),
  body       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ticket_messages_ticket_idx
  ON public.ticket_messages (ticket_id, created_at);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ticket_messages_no_client ON public.ticket_messages;
CREATE POLICY ticket_messages_no_client ON public.ticket_messages
  FOR ALL USING (false) WITH CHECK (false);

------------------------------------------------------------------------------
-- Conditional ALTERs on user-portal-owned tables.
-- Skip silently if the target table does not yet exist in this Supabase
-- project (user-portal repo not yet migrated).
------------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.subscriptions') IS NOT NULL THEN
    BEGIN
      ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS quota_override jsonb;
      ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS ai_suspended boolean DEFAULT false;
      ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS tier_override jsonb;
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'subscriptions: insufficient privilege to alter, skipping';
    END;
  ELSE
    RAISE NOTICE 'subscriptions table not present, skipping ALTER';
  END IF;

  IF to_regclass('public.orgs') IS NOT NULL THEN
    BEGIN
      ALTER TABLE public.orgs ADD COLUMN IF NOT EXISTS assigned_am_user_id uuid;
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'orgs: insufficient privilege to alter, skipping';
    END;
  ELSE
    RAISE NOTICE 'orgs table not present, skipping ALTER';
  END IF;
END;
$$ LANGUAGE plpgsql;
```

- [ ] **Step 2: Apply via Dashboard**

Paste into Supabase SQL editor → Run. Verify Table Editor shows `admin_notes`, `impersonation_sessions`, `support_tickets`, `ticket_messages`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0004_customers_tickets.sql
git commit -m "phase C: admin_notes + impersonation + support_tickets schema"
```

---

## Task C.2: Extend AuditAction enum (idempotent — keep types in sync with new mutations)

**Files:** Modify `lib/audit.ts:5-18`.

- [ ] **Step 1: Verify current enum + add tickets actions**

`AuditAction` already includes `IMPERSONATE_USER`, `SUSPEND_ORG`, `REACTIVATE_ORG`, `DEACTIVATE_ORG`, `TIER_OVERRIDE`, `FORCE_LOGOUT_USER`, `CCPA_ERASURE`, `TICKET_CREATED`, `TICKET_REPLIED`, `TICKET_STATUS_CHANGED`, plus the rate-card set added in B.2. Add **`TICKET_PRIORITY_CHANGED`** and **`TICKET_ASSIGNED`** and **`ADMIN_NOTE_CREATED`** to the union.

```ts
// in the AuditAction union (alphabetic-by-section is fine)
| 'TICKET_CREATED' | 'TICKET_REPLIED' | 'TICKET_STATUS_CHANGED'
| 'TICKET_PRIORITY_CHANGED' | 'TICKET_ASSIGNED'
| 'ADMIN_NOTE_CREATED'
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add lib/audit.ts
git commit -m "phase C: extend AuditAction with ticket + admin-note actions"
```

---

## Task C.3: Library — fetchOrgList + types

**Files:** Create `lib/customers.ts`.

- [ ] **Step 1: Write `lib/customers.ts`**

```ts
import 'server-only';
import { adminClient } from '@/lib/supabase/admin';

export type OrgTier = 'calf' | 'cow' | 'bull';
export type OrgStatus = 'active' | 'suspended' | 'deactivated' | 'payment_failed';

export type OrgRow = {
  id: string;
  name: string;
  tier: OrgTier | null;
  mrr: number | null;
  members: number;
  shipments_30d: number;
  last_active: string | null;
  status: OrgStatus | null;
  origin_zip: string | null;
};

export type OrgListFilters = {
  q?: string;
  tier?: OrgTier;
  status?: OrgStatus;
  churnRisk?: boolean;
  limit?: number;
};

const DEFAULT_LIMIT = 100;

export async function fetchOrgList(
  filters: OrgListFilters = {},
): Promise<{ rows: OrgRow[]; total: number; upstreamMissing: boolean }> {
  const supabase = adminClient();

  // Probe orgs existence so we degrade gracefully if user-portal not migrated.
  const probe = await supabase.from('orgs').select('id', { count: 'exact', head: true });
  if (probe.error) {
    return { rows: [], total: 0, upstreamMissing: true };
  }

  // Fetch orgs first (always present in admin view), then enrich.
  let q = supabase
    .from('orgs')
    .select('id, name, status, origin_zip, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(filters.limit ?? DEFAULT_LIMIT);
  if (filters.q && filters.q.trim().length > 0) {
    q = q.ilike('name', `%${filters.q.trim()}%`);
  }
  if (filters.status) q = q.eq('status', filters.status);
  const { data: orgs, count, error } = await q;
  if (error) {
    return { rows: [], total: 0, upstreamMissing: true };
  }

  const orgList = (orgs ?? []) as Array<{
    id: string;
    name: string;
    status: OrgStatus | null;
    origin_zip: string | null;
  }>;
  const ids = orgList.map((o) => o.id);
  if (ids.length === 0) {
    return { rows: [], total: count ?? 0, upstreamMissing: false };
  }

  const [subsRes, membersRes] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('org_id, tier, mrr')
      .in('org_id', ids),
    supabase
      .from('org_members')
      .select('org_id, last_login')
      .in('org_id', ids),
  ]);
  const subs = (subsRes.data ?? []) as Array<{ org_id: string; tier: OrgTier; mrr: number }>;
  const members = (membersRes.data ?? []) as Array<{ org_id: string; last_login: string | null }>;

  const subBy = new Map(subs.map((s) => [s.org_id, s]));
  const memberCounts = new Map<string, number>();
  const lastActive = new Map<string, string | null>();
  for (const m of members) {
    memberCounts.set(m.org_id, (memberCounts.get(m.org_id) ?? 0) + 1);
    const prior = lastActive.get(m.org_id) ?? null;
    if (m.last_login && (!prior || m.last_login > prior)) {
      lastActive.set(m.org_id, m.last_login);
    }
  }

  const rows: OrgRow[] = orgList.map((o) => {
    const sub = subBy.get(o.id);
    return {
      id: o.id,
      name: o.name,
      tier: sub?.tier ?? null,
      mrr: sub?.mrr ?? null,
      members: memberCounts.get(o.id) ?? 0,
      shipments_30d: 0,
      last_active: lastActive.get(o.id) ?? null,
      status: o.status,
      origin_zip: o.origin_zip,
    };
  });

  let filtered = rows;
  if (filters.tier) filtered = filtered.filter((r) => r.tier === filters.tier);
  if (filters.churnRisk) filtered = filtered.filter((r) => r.shipments_30d === 0);

  return { rows: filtered, total: count ?? filtered.length, upstreamMissing: false };
}

export async function fetchOrg(id: string): Promise<OrgRow | null> {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from('orgs')
    .select('id, name, status, origin_zip')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  const [subRes, memRes] = await Promise.all([
    supabase.from('subscriptions').select('tier, mrr').eq('org_id', id).single(),
    supabase.from('org_members').select('last_login').eq('org_id', id),
  ]);
  const sub = subRes.data as { tier: OrgTier; mrr: number } | null;
  const members = (memRes.data ?? []) as Array<{ last_login: string | null }>;
  let last: string | null = null;
  for (const m of members) {
    if (m.last_login && (!last || m.last_login > last)) last = m.last_login;
  }
  return {
    id: data.id,
    name: data.name,
    tier: sub?.tier ?? null,
    mrr: sub?.mrr ?? null,
    members: members.length,
    shipments_30d: 0,
    last_active: last,
    status: data.status,
    origin_zip: data.origin_zip,
  };
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npm run typecheck
git add lib/customers.ts
git commit -m "phase C: customers data layer (fetchOrgList + fetchOrg)"
```

---

## Task C.4: `/admin/customers` page + filters + list

**Files:**
- Replace `app/admin/customers/page.tsx`
- Create `app/admin/customers/_filters.tsx`
- Create `app/admin/customers/_list.tsx`

- [ ] **Step 1: Write `_filters.tsx`** (client)

```tsx
'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { BRAND } from '@/lib/brand';
import { Button } from '@/components/ui/button';

export function CustomerFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? '');
  const [tier, setTier] = useState(sp.get('tier') ?? '');
  const [status, setStatus] = useState(sp.get('status') ?? '');
  const [churn, setChurn] = useState(sp.get('churn') === '1');

  function apply(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (tier) params.set('tier', tier);
    if (status) params.set('status', status);
    if (churn) params.set('churn', '1');
    router.push(`/admin/customers?${params.toString()}`);
  }

  const inputStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    padding: '6px 10px',
    border: `3px solid ${BRAND.charcoal}`,
    background: BRAND.white,
    color: BRAND.charcoal,
    outline: 'none',
    borderRadius: 0,
  };

  return (
    <form
      onSubmit={apply}
      style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}
    >
      <input
        placeholder="Search org name…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ ...inputStyle, minWidth: 220, flex: 1 }}
      />
      <select value={tier} onChange={(e) => setTier(e.target.value)} style={inputStyle}>
        <option value="">All tiers</option>
        <option value="calf">Calf</option>
        <option value="cow">Cow</option>
        <option value="bull">Bull</option>
      </select>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        style={inputStyle}
      >
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
        <option value="deactivated">Deactivated</option>
        <option value="payment_failed">Payment failed</option>
      </select>
      <label
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 9,
          color: BRAND.charcoal,
          letterSpacing: '0.04em',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <input type="checkbox" checked={churn} onChange={(e) => setChurn(e.target.checked)} />
        CHURN RISK
      </label>
      <Button variant="blue" size="sm">
        Apply
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Write `_list.tsx`** (server-passed rows, link wrappers)

```tsx
import Link from 'next/link';
import type { Route } from 'next';
import { BRAND } from '@/lib/brand';
import type { OrgRow } from '@/lib/customers';

const cell: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  color: BRAND.charcoal,
  padding: '8px 12px',
};

const tierColor: Record<string, string> = {
  calf: BRAND.sky,
  cow: BRAND.midBlue,
  bull: BRAND.amber,
};

const statusColor: Record<string, string> = {
  active: BRAND.green,
  suspended: BRAND.amber,
  deactivated: BRAND.red,
  payment_failed: BRAND.red,
};

export function CustomerList({ rows }: { rows: OrgRow[] }) {
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
            {['ORG', 'TIER', 'MRR', 'MEMBERS', 'SHIP 30D', 'STATUS', 'ZIP'].map((h) => (
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
              key={r.id}
              style={{
                borderBottom: `1px solid ${BRAND.sky}`,
                background: i % 2 ? '#FAFBFF' : BRAND.white,
              }}
            >
              <td style={cell}>
                <Link
                  href={`/admin/customers/${r.id}` as Route}
                  style={{ color: BRAND.blue, textDecoration: 'none', fontWeight: 600 }}
                >
                  {r.name}
                </Link>
              </td>
              <td style={cell}>
                {r.tier ? (
                  <span
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: 9,
                      color: BRAND.charcoal,
                      background: tierColor[r.tier] ?? BRAND.sky,
                      padding: '2px 8px',
                      border: `2px solid ${BRAND.charcoal}`,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {r.tier.toUpperCase()}
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td style={cell}>{r.mrr != null ? `$${r.mrr.toLocaleString()}` : '—'}</td>
              <td style={cell}>{r.members}</td>
              <td style={cell}>{r.shipments_30d}</td>
              <td
                style={{
                  ...cell,
                  color: r.status ? statusColor[r.status] ?? BRAND.charcoal : BRAND.charcoal,
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 9,
                }}
              >
                {(r.status ?? '—').toUpperCase()}
              </td>
              <td style={cell}>{r.origin_zip ?? '—'}</td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                style={{
                  ...cell,
                  textAlign: 'center',
                  padding: 24,
                }}
              >
                No orgs match these filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Replace `app/admin/customers/page.tsx`**

```tsx
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { BRAND } from '@/lib/brand';
import { fetchOrgList, type OrgListFilters } from '@/lib/customers';
import { SUPABASE_CONFIGURED } from '@/lib/env';
import { CustomerFilters } from './_filters';
import { CustomerList } from './_list';

export const dynamic = 'force-dynamic';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters: OrgListFilters = {
    q: typeof searchParams.q === 'string' ? searchParams.q : undefined,
    tier: typeof searchParams.tier === 'string' ? (searchParams.tier as OrgListFilters['tier']) : undefined,
    status: typeof searchParams.status === 'string' ? (searchParams.status as OrgListFilters['status']) : undefined,
    churnRisk: searchParams.churn === '1',
  };

  if (!SUPABASE_CONFIGURED) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Eyebrow>{'// CUSTOMERS'}</Eyebrow>
        <Card style={{ padding: 24 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
            Supabase not configured.
          </p>
        </Card>
      </div>
    );
  }

  const { rows, total, upstreamMissing } = await fetchOrgList(filters);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>{'// CUSTOMERS'}</Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
          }}
        >
          Customers
        </h1>
      </div>
      {upstreamMissing ? (
        <Card style={{ padding: 24, border: `3px solid ${BRAND.amber}` }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.charcoal }}>
            <strong>Upstream tables missing.</strong> The user-portal repo&apos;s migrations
            (orgs/subscriptions/org_members) have not been applied to this Supabase project.
            The customers list will populate once the user portal is migrated.
          </p>
        </Card>
      ) : (
        <>
          <CustomerFilters />
          <p
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 9,
              color: BRAND.charcoal,
            }}
          >
            {`Showing ${rows.length.toLocaleString()} of ${total.toLocaleString()} orgs.`}
          </p>
          <CustomerList rows={rows} />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Build + commit**

```bash
npm run typecheck && npm run build
git add app/admin/customers/
git commit -m "phase C: /admin/customers list + URL-param filters + degraded state"
```

---

## Task C.5: Org drawer page + tabs (Overview / Members / Notes / Audit / Tickets)

**Files:**
- Create `app/admin/customers/[orgId]/page.tsx`
- Create `app/admin/customers/[orgId]/_drawer-tabs.tsx`

- [ ] **Step 1: Write `_drawer-tabs.tsx`** (client)

```tsx
'use client';
import { useState, type ReactNode } from 'react';
import { TabBar } from '@/components/ui/tab-bar';

const TABS = ['Overview', 'Members', 'Notes', 'Audit', 'Tickets'] as const;
type Tab = (typeof TABS)[number];

export function DrawerTabs({
  panels,
}: {
  panels: Record<Tab, ReactNode>;
}) {
  const [active, setActive] = useState<Tab>('Overview');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <TabBar
        tabs={TABS as unknown as string[]}
        active={active}
        onSelect={(t) => setActive(t as Tab)}
      />
      <div>{panels[active]}</div>
    </div>
  );
}
```

(`TabBar` (Phase A primitive) requires `onSelect: (tab: string) => void` — this matches.)

- [ ] **Step 2: Write `[orgId]/page.tsx`** (server with quick-actions)

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/lib/brand';
import { adminClient } from '@/lib/supabase/admin';
import { SUPABASE_CONFIGURED } from '@/lib/env';
import { fetchOrg } from '@/lib/customers';
import { DrawerTabs } from './_drawer-tabs';

export const dynamic = 'force-dynamic';

type Note = { id: string; note: string; created_at: string; created_by: string | null };
type Audit = {
  id: string;
  occurred_at: string;
  action: string;
  actor_user_id: string;
  reason: string | null;
};
type TicketRow = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  updated_at: string;
};
type MemberRow = {
  user_id: string;
  last_login: string | null;
};

export default async function OrgDrawerPage({
  params,
}: {
  params: { orgId: string };
}) {
  if (!SUPABASE_CONFIGURED) notFound();
  const org = await fetchOrg(params.orgId);
  if (!org) notFound();

  const supabase = adminClient();
  const [notesRes, auditRes, ticketsRes, membersRes] = await Promise.all([
    supabase
      .from('admin_notes')
      .select('id, note, created_at, created_by')
      .eq('org_id', params.orgId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('audit_log')
      .select('id, occurred_at, action, actor_user_id, reason')
      .eq('org_id', params.orgId)
      .order('occurred_at', { ascending: false })
      .limit(100),
    supabase
      .from('support_tickets')
      .select('id, subject, status, priority, updated_at')
      .eq('org_id', params.orgId)
      .order('updated_at', { ascending: false })
      .limit(50),
    supabase
      .from('org_members')
      .select('user_id, last_login')
      .eq('org_id', params.orgId),
  ]);

  const notes = (notesRes.data ?? []) as Note[];
  const audit = (auditRes.data ?? []) as Audit[];
  const tickets = (ticketsRes.data ?? []) as TicketRow[];
  const members = (membersRes.data ?? []) as MemberRow[];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Eyebrow>
          <Link href="/admin/customers" style={{ color: BRAND.blue, textDecoration: 'none' }}>
            {'« CUSTOMERS'}
          </Link>
          {' / '}
          {org.name.toUpperCase()}
        </Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
          }}
        >
          {org.name}
        </h1>
        <p
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9,
            color: BRAND.charcoal,
            marginTop: 6,
            letterSpacing: '0.04em',
          }}
        >
          {[
            org.tier ? `TIER ${org.tier.toUpperCase()}` : null,
            org.status ? `STATUS ${org.status.toUpperCase()}` : null,
            org.mrr != null ? `MRR $${org.mrr.toLocaleString()}` : null,
            org.origin_zip ? `ZIP ${org.origin_zip}` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <ActionForm action="suspend" orgId={org.id} label="Suspend" variant="danger" />
        <ActionForm action="reactivate" orgId={org.id} label="Reactivate" variant="primary" />
        <ActionForm action="tier-override" orgId={org.id} label="Tier override" variant="ghost" />
        <ActionForm action="impersonate" orgId={org.id} label="Impersonate owner" variant="dark" />
        <ActionForm action="force-logout" orgId={org.id} label="Force logout all" variant="ghost" />
      </div>

      <DrawerTabs
        panels={{
          Overview: (
            <Card style={{ padding: 18 }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.charcoal }}>
                {`${org.members} member${org.members === 1 ? '' : 's'}. Last active: ${
                  org.last_active ? new Date(org.last_active).toISOString().slice(0, 10) : '—'
                }.`}
              </p>
            </Card>
          ),
          Members: (
            <Card style={{ padding: 0 }}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {members.map((m) => (
                  <li
                    key={m.user_id}
                    style={{
                      padding: '10px 14px',
                      borderBottom: `1px solid ${BRAND.sky}`,
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      color: BRAND.charcoal,
                    }}
                  >
                    <code>{m.user_id}</code> · last login{' '}
                    {m.last_login ? new Date(m.last_login).toISOString().slice(0, 16) : '—'}
                  </li>
                ))}
                {members.length === 0 ? (
                  <li
                    style={{
                      padding: 24,
                      textAlign: 'center',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14,
                      color: BRAND.charcoal,
                    }}
                  >
                    No members.
                  </li>
                ) : null}
              </ul>
            </Card>
          ),
          Notes: <NotesPanel orgId={org.id} notes={notes} />,
          Audit: <AuditPanel rows={audit} />,
          Tickets: <TicketsPanel rows={tickets} />,
        }}
      />
    </div>
  );
}

function ActionForm({
  orgId,
  action,
  label,
  variant,
}: {
  orgId: string;
  action: string;
  label: string;
  variant: 'primary' | 'blue' | 'ghost' | 'danger' | 'dark';
}) {
  return (
    <form action={`/api/admin/orgs/${orgId}/${action}` as Route} method="post">
      <Button variant={variant} size="sm">
        {label}
      </Button>
    </form>
  );
}

function NotesPanel({ orgId, notes }: { orgId: string; notes: Note[] }) {
  return (
    <Card style={{ padding: 14 }}>
      <form
        action={`/api/admin/orgs/${orgId}/note` as Route}
        method="post"
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        <textarea
          name="note"
          required
          placeholder="Add internal note…"
          rows={3}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            padding: 10,
            border: `3px solid ${BRAND.charcoal}`,
            background: BRAND.white,
            outline: 'none',
            borderRadius: 0,
          }}
        />
        <div>
          <Button variant="primary" size="sm">
            Save note
          </Button>
        </div>
      </form>
      <ul
        style={{
          margin: '14px 0 0 0',
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {notes.map((n) => (
          <li
            key={n.id}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: BRAND.charcoal,
              borderTop: `1px solid ${BRAND.sky}`,
              paddingTop: 8,
            }}
          >
            <span
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 8,
                color: BRAND.charcoal,
                marginRight: 8,
              }}
            >
              {new Date(n.created_at).toISOString().slice(0, 10)}
            </span>
            {n.note}
          </li>
        ))}
        {notes.length === 0 ? (
          <li
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: BRAND.charcoal,
              opacity: 0.7,
            }}
          >
            No notes yet.
          </li>
        ) : null}
      </ul>
    </Card>
  );
}

function AuditPanel({ rows }: { rows: Audit[] }) {
  return (
    <Card style={{ padding: 0 }}>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {rows.map((r) => (
          <li
            key={r.id}
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
                color: BRAND.blue,
                marginRight: 8,
              }}
            >
              {new Date(r.occurred_at).toISOString().slice(0, 16).replace('T', ' ')}
            </span>
            <strong>{r.action}</strong>
            {r.reason ? ` — ${r.reason}` : ''}
          </li>
        ))}
        {rows.length === 0 ? (
          <li
            style={{
              padding: 24,
              textAlign: 'center',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: BRAND.charcoal,
            }}
          >
            No audit entries for this org.
          </li>
        ) : null}
      </ul>
    </Card>
  );
}

function TicketsPanel({ rows }: { rows: TicketRow[] }) {
  return (
    <Card style={{ padding: 0 }}>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {rows.map((t) => (
          <li
            key={t.id}
            style={{
              padding: '10px 14px',
              borderBottom: `1px solid ${BRAND.sky}`,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: BRAND.charcoal,
            }}
          >
            <Link
              href={`/admin/tickets/${t.id}` as Route}
              style={{ color: BRAND.blue, textDecoration: 'none', fontWeight: 600 }}
            >
              {t.subject}
            </Link>
            {' '}
            <span
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 8,
                color: BRAND.charcoal,
                marginLeft: 8,
              }}
            >
              {t.status.toUpperCase()} · {t.priority.toUpperCase()}
            </span>
          </li>
        ))}
        {rows.length === 0 ? (
          <li
            style={{
              padding: 24,
              textAlign: 'center',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: BRAND.charcoal,
            }}
          >
            No tickets for this org.
          </li>
        ) : null}
      </ul>
    </Card>
  );
}
```

- [ ] **Step 3: Build + commit**

```bash
npm run typecheck && npm run build
git add "app/admin/customers/[orgId]/"
git commit -m "phase C: org drawer with 5 tabs + quick-action forms"
```

---

## Task C.6: Org action route handlers (suspend, reactivate, deactivate, tier-override, force-logout, impersonate, note)

**Files:** Create 7 route handlers under `app/api/admin/orgs/[orgId]/{action}/route.ts`.

The pattern is identical for all of them. Each handler:
1. Calls `getAdminContext(req)` for actor + role.
2. Validates input (role gate, optional `reason` text).
3. Performs the DB write via `adminClient()`.
4. Calls `logAudit(...)`.
5. Redirects back to the drawer (HTML form posts) OR returns JSON (XHR).

**File: `app/api/admin/orgs/[orgId]/suspend/route.ts`**

- [ ] **Step 1: Write the handler**

```ts
import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: { orgId: string } },
) {
  let ctx;
  try {
    ctx = await getAdminContext(req);
  } catch (resp) {
    if (resp instanceof Response) return resp;
    throw resp;
  }
  if (ctx.actorRole !== 'super-admin' && ctx.actorRole !== 'support-admin') {
    return NextResponse.json({ error: 'role gate' }, { status: 403 });
  }

  const form = await safeReadForm(req);
  const reason = (form.get('reason') as string | null) ?? '';

  const supabase = adminClient();
  const probe = await supabase
    .from('subscriptions')
    .update({ status: 'suspended' })
    .eq('org_id', params.orgId)
    .select('org_id')
    .maybeSingle();
  if (probe.error) {
    return NextResponse.json({ error: probe.error.message }, { status: 500 });
  }

  await logAudit({
    action: 'SUSPEND_ORG',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    orgId: params.orgId,
    resourceType: 'org',
    resourceId: params.orgId,
    reason: reason || undefined,
    ip: ctx.ip ?? undefined,
  });

  return redirectBack(req, params.orgId);
}

async function safeReadForm(req: Request): Promise<FormData> {
  try {
    return await req.formData();
  } catch {
    return new FormData();
  }
}

function redirectBack(req: Request, orgId: string): Response {
  const accept = req.headers.get('accept') ?? '';
  if (accept.includes('application/json')) {
    return NextResponse.json({ ok: true });
  }
  const back = new URL(`/admin/customers/${orgId}`, req.url);
  return NextResponse.redirect(back, { status: 303 });
}
```

- [ ] **Step 2: Repeat for the other actions** with these per-action overrides:

- `reactivate/route.ts` — same shape, role gate `super-admin OR support-admin`, action `'REACTIVATE_ORG'`, sets `status='active'`.
- `deactivate/route.ts` — role gate `super-admin` only, action `'DEACTIVATE_ORG'`, sets `status='deactivated'`. **Required reason** — return 400 if `reason` is empty.
- `tier-override/route.ts` — role gate `super-admin`, action `'TIER_OVERRIDE'`. Reads `tier` form field; updates `subscriptions.tier_override = jsonb_build_object('tier', <tier>, 'set_by', actorId, 'set_at', now())`. Validate tier ∈ `{'calf','cow','bull'}` else 400. Capture `before_value`/`after_value`.
- `force-logout/route.ts` — role gate `super-admin OR support-admin`, action `'FORCE_LOGOUT_USER'`. Iterates members and calls `supabase.auth.admin.signOut(user_id)` per member (admin-only API). Audit log entry per user is fine; one summary entry is also fine. Use one summary entry with `after_value: { count: <n> }`.
- `impersonate/route.ts` — role gate `super-admin OR support-admin`. Reads first member of org as target; generates a 60-min one-time token via `supabase.auth.admin.generateLink({ type: 'magiclink', email })` (or simpler: insert a row in `impersonation_sessions` with a random UUID `token_hash` and a 60-min `expires_at`, then redirect to `${USER_PORTAL_URL}/impersonate?session=<id>`). Action `'IMPERSONATE_USER'`. Cross-repo banner is upstream — note this in commit msg.
- `note/route.ts` — role gate `super-admin OR support-admin`. Inserts into `admin_notes`. Action `'ADMIN_NOTE_CREATED'`. No reason required.

**File: `app/api/admin/orgs/[orgId]/tier-override/route.ts`** (full code, since branching differs)

```ts
import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_TIERS = new Set(['calf', 'cow', 'bull']);

export async function POST(
  req: Request,
  { params }: { params: { orgId: string } },
) {
  let ctx;
  try {
    ctx = await getAdminContext(req);
  } catch (resp) {
    if (resp instanceof Response) return resp;
    throw resp;
  }
  if (ctx.actorRole !== 'super-admin') {
    return NextResponse.json({ error: 'super-admin required' }, { status: 403 });
  }

  const form = await req.formData().catch(() => new FormData());
  const tier = (form.get('tier') as string | null) ?? '';
  const reason = (form.get('reason') as string | null) ?? '';
  if (!VALID_TIERS.has(tier)) {
    return NextResponse.json({ error: 'invalid tier' }, { status: 400 });
  }

  const supabase = adminClient();
  const { data: before } = await supabase
    .from('subscriptions')
    .select('tier_override')
    .eq('org_id', params.orgId)
    .single();
  const after = { tier, set_by: ctx.actorId, set_at: new Date().toISOString() };
  const { error } = await supabase
    .from('subscriptions')
    .update({ tier_override: after })
    .eq('org_id', params.orgId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit({
    action: 'TIER_OVERRIDE',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    orgId: params.orgId,
    resourceType: 'subscription',
    resourceId: params.orgId,
    before: { tier_override: before?.tier_override ?? null },
    after: { tier_override: after },
    reason: reason || undefined,
    ip: ctx.ip ?? undefined,
  });

  return NextResponse.redirect(new URL(`/admin/customers/${params.orgId}`, req.url), {
    status: 303,
  });
}
```

- [ ] **Step 3: Typecheck + build + commit**

```bash
npm run typecheck && npm run build
git add "app/api/admin/orgs/[orgId]/"
git commit -m "phase C: org action handlers (suspend/reactivate/deactivate/tier/force-logout/impersonate/note)"
```

---

## Task C.7: `/admin/tickets` split-pane + thread

**Files:**
- Replace `app/admin/tickets/page.tsx`
- Create `app/admin/tickets/_ticket-list.tsx`
- Create `app/admin/tickets/_thread.tsx`
- Create `app/admin/tickets/[ticketId]/page.tsx`

- [ ] **Step 1: Write `_ticket-list.tsx`** (server-passed rows, link wrappers — read-only, no client state)

```tsx
import Link from 'next/link';
import type { Route } from 'next';
import { BRAND } from '@/lib/brand';

export type TicketListItem = {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  org_id: string;
  updated_at: string;
};

const priorityColor: Record<string, string> = {
  urgent: BRAND.red,
  high: BRAND.amber,
  normal: BRAND.charcoal,
  low: BRAND.sky,
};

export function TicketList({
  rows,
  activeId,
}: {
  rows: TicketListItem[];
  activeId: string | null;
}) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {rows.map((t) => (
        <li
          key={t.id}
          style={{
            borderBottom: `1px solid ${BRAND.sky}`,
            background: t.id === activeId ? BRAND.pageBed : BRAND.white,
          }}
        >
          <Link
            href={`/admin/tickets/${t.id}` as Route}
            style={{
              display: 'block',
              padding: '12px 14px',
              textDecoration: 'none',
              color: BRAND.charcoal,
            }}
          >
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              {t.subject}
            </div>
            <div
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 8,
                letterSpacing: '0.04em',
                color: priorityColor[t.priority] ?? BRAND.charcoal,
              }}
            >
              {t.status.toUpperCase()} · {t.priority.toUpperCase()} ·{' '}
              {new Date(t.updated_at).toISOString().slice(0, 10)}
            </div>
          </Link>
        </li>
      ))}
      {rows.length === 0 ? (
        <li
          style={{
            padding: 24,
            textAlign: 'center',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: BRAND.charcoal,
          }}
        >
          No tickets.
        </li>
      ) : null}
    </ul>
  );
}
```

- [ ] **Step 2: Write `_thread.tsx`** (server-rendered thread + client composer)

```tsx
import type { Route } from 'next';
import { BRAND } from '@/lib/brand';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/eyebrow';

export type ThreadMessage = {
  id: string;
  from_type: 'user' | 'admin' | 'note';
  body: string;
  created_at: string;
  author_id: string | null;
};

export type ThreadHeader = {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  org_id: string;
  assignee_user_id: string | null;
};

const fromTypeColor: Record<string, string> = {
  user: BRAND.blue,
  admin: BRAND.green,
  note: BRAND.amber,
};

export function Thread({
  header,
  messages,
}: {
  header: ThreadHeader;
  messages: ThreadMessage[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Eyebrow>{`#${header.id.slice(0, 8).toUpperCase()}`}</Eyebrow>
        <form
          action={`/api/admin/tickets/${header.id}/status` as Route}
          method="post"
          style={{ display: 'flex', gap: 6, alignItems: 'center' }}
        >
          <select
            name="status"
            defaultValue={header.status}
            style={selectStyle}
          >
            <option value="open">open</option>
            <option value="in_progress">in_progress</option>
            <option value="resolved">resolved</option>
          </select>
          <Button variant="ghost" size="sm">Set</Button>
        </form>
        <form
          action={`/api/admin/tickets/${header.id}/priority` as Route}
          method="post"
          style={{ display: 'flex', gap: 6, alignItems: 'center' }}
        >
          <select
            name="priority"
            defaultValue={header.priority}
            style={selectStyle}
          >
            <option value="urgent">urgent</option>
            <option value="high">high</option>
            <option value="normal">normal</option>
            <option value="low">low</option>
          </select>
          <Button variant="ghost" size="sm">Set</Button>
        </form>
      </div>

      <h2
        style={{
          fontFamily: "'Black Han Sans', sans-serif",
          fontSize: 22,
          color: BRAND.charcoal,
          textTransform: 'uppercase',
          marginTop: 0,
        }}
      >
        {header.subject}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m) => (
          <Card key={m.id} style={{ padding: 14 }}>
            <div
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 8,
                color: fromTypeColor[m.from_type] ?? BRAND.charcoal,
                letterSpacing: '0.04em',
                marginBottom: 6,
              }}
            >
              {m.from_type.toUpperCase()} ·{' '}
              {new Date(m.created_at).toISOString().slice(0, 16).replace('T', ' ')}
            </div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: BRAND.charcoal,
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.body}
            </div>
          </Card>
        ))}
        {messages.length === 0 ? (
          <Card style={{ padding: 14 }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.charcoal }}>
              No messages yet.
            </p>
          </Card>
        ) : null}
      </div>

      <Card style={{ padding: 14 }}>
        <form
          action={`/api/admin/tickets/${header.id}/reply` as Route}
          method="post"
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <textarea
            name="body"
            required
            placeholder="Reply or internal note…"
            rows={4}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              padding: 10,
              border: `3px solid ${BRAND.charcoal}`,
              background: BRAND.white,
              outline: 'none',
              borderRadius: 0,
            }}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select name="from_type" defaultValue="admin" style={selectStyle}>
              <option value="admin">Public reply</option>
              <option value="note">Internal note</option>
            </select>
            <Button variant="primary" size="sm">Send</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  padding: '4px 8px',
  border: `2px solid ${BRAND.charcoal}`,
  background: BRAND.white,
  color: BRAND.charcoal,
  outline: 'none',
  borderRadius: 0,
};
```

- [ ] **Step 3: Replace `app/admin/tickets/page.tsx`** (split-pane: list left, empty state right)

```tsx
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { BRAND } from '@/lib/brand';
import { adminClient } from '@/lib/supabase/admin';
import { SUPABASE_CONFIGURED } from '@/lib/env';
import { TicketList, type TicketListItem } from './_ticket-list';

export const dynamic = 'force-dynamic';

export default async function TicketsIndexPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (!SUPABASE_CONFIGURED) {
    return (
      <Card style={{ padding: 24 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
          Supabase not configured.
        </p>
      </Card>
    );
  }
  const supabase = adminClient();
  const status = typeof searchParams.status === 'string' ? searchParams.status : null;
  let q = supabase
    .from('support_tickets')
    .select('id, subject, status, priority, org_id, updated_at')
    .order('updated_at', { ascending: false })
    .limit(100);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  const rows = ((error ? [] : data) ?? []) as TicketListItem[];

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 140px)' }}>
      <aside
        style={{
          width: 360,
          flexShrink: 0,
          background: BRAND.white,
          border: `3px solid ${BRAND.charcoal}`,
          boxShadow: `4px 4px 0 ${BRAND.charcoal}`,
          overflow: 'auto',
        }}
      >
        <div
          style={{
            padding: '10px 14px',
            borderBottom: `3px solid ${BRAND.charcoal}`,
            background: BRAND.pageBed,
          }}
        >
          <Eyebrow style={{ marginBottom: 0 }}>{'// TICKETS'}</Eyebrow>
        </div>
        <TicketList rows={rows} activeId={null} />
      </aside>
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Card style={{ padding: 24 }}>
          <p
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.charcoal }}
          >
            Select a ticket on the left.
          </p>
        </Card>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Write `[ticketId]/page.tsx`** (split-pane with active thread)

```tsx
import { notFound } from 'next/navigation';
import { Eyebrow } from '@/components/ui/eyebrow';
import { BRAND } from '@/lib/brand';
import { adminClient } from '@/lib/supabase/admin';
import { SUPABASE_CONFIGURED } from '@/lib/env';
import { TicketList, type TicketListItem } from '../_ticket-list';
import { Thread, type ThreadHeader, type ThreadMessage } from '../_thread';

export const dynamic = 'force-dynamic';

export default async function TicketThreadPage({
  params,
}: {
  params: { ticketId: string };
}) {
  if (!SUPABASE_CONFIGURED) notFound();
  const supabase = adminClient();
  const [headerRes, messagesRes, listRes] = await Promise.all([
    supabase
      .from('support_tickets')
      .select('id, subject, status, priority, org_id, assignee_user_id')
      .eq('id', params.ticketId)
      .single(),
    supabase
      .from('ticket_messages')
      .select('id, from_type, body, created_at, author_id')
      .eq('ticket_id', params.ticketId)
      .order('created_at', { ascending: true }),
    supabase
      .from('support_tickets')
      .select('id, subject, status, priority, org_id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(100),
  ]);
  if (headerRes.error || !headerRes.data) notFound();
  const header = headerRes.data as ThreadHeader;
  const messages = (messagesRes.data ?? []) as ThreadMessage[];
  const list = (listRes.data ?? []) as TicketListItem[];

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 140px)' }}>
      <aside
        style={{
          width: 360,
          flexShrink: 0,
          background: BRAND.white,
          border: `3px solid ${BRAND.charcoal}`,
          boxShadow: `4px 4px 0 ${BRAND.charcoal}`,
          overflow: 'auto',
        }}
      >
        <div
          style={{
            padding: '10px 14px',
            borderBottom: `3px solid ${BRAND.charcoal}`,
            background: BRAND.pageBed,
          }}
        >
          <Eyebrow style={{ marginBottom: 0 }}>{'// TICKETS'}</Eyebrow>
        </div>
        <TicketList rows={list} activeId={header.id} />
      </aside>
      <main style={{ flex: 1, overflow: 'auto', padding: '0 4px' }}>
        <Thread header={header} messages={messages} />
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Build + commit**

```bash
npm run typecheck && npm run build
git add app/admin/tickets/
git commit -m "phase C: /admin/tickets split-pane list + thread + composer"
```

---

## Task C.8: Ticket action route handlers (reply, status, priority, assign)

**Files:** Create 4 route handlers under `app/api/admin/tickets/[ticketId]/{reply,status,priority,assign}/route.ts`.

Pattern is the same as Task C.6. Each writes to `support_tickets` or `ticket_messages` and audits.

**File: `app/api/admin/tickets/[ticketId]/reply/route.ts`**

- [ ] **Step 1: Write the handler**

```ts
import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_FROM = new Set(['admin', 'note']);

export async function POST(
  req: Request,
  { params }: { params: { ticketId: string } },
) {
  let ctx;
  try {
    ctx = await getAdminContext(req);
  } catch (resp) {
    if (resp instanceof Response) return resp;
    throw resp;
  }
  const form = await req.formData().catch(() => new FormData());
  const body = ((form.get('body') as string | null) ?? '').trim();
  const fromType = ((form.get('from_type') as string | null) ?? 'admin').trim();
  if (!body) return NextResponse.json({ error: 'body required' }, { status: 400 });
  if (!ALLOWED_FROM.has(fromType)) {
    return NextResponse.json({ error: 'invalid from_type' }, { status: 400 });
  }

  const supabase = adminClient();
  const { data, error } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: params.ticketId,
      from_type: fromType,
      author_id: ctx.actorId,
      body,
    })
    .select('id')
    .single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'insert failed' }, { status: 500 });
  }
  await supabase
    .from('support_tickets')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', params.ticketId);
  await logAudit({
    action: 'TICKET_REPLIED',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    resourceType: 'ticket',
    resourceId: params.ticketId,
    after: { from_type: fromType, message_id: data.id },
    ip: ctx.ip ?? undefined,
  });
  return NextResponse.redirect(new URL(`/admin/tickets/${params.ticketId}`, req.url), {
    status: 303,
  });
}
```

- [ ] **Step 2: Repeat per action** with these overrides:

- `status/route.ts` — Reads `status` ∈ `{open, in_progress, resolved}`. Updates `support_tickets.status`. Action `'TICKET_STATUS_CHANGED'`. Captures `before` / `after`. Returns 400 if invalid.
- `priority/route.ts` — Reads `priority` ∈ `{urgent, high, normal, low}`. Updates `support_tickets.priority`. Action `'TICKET_PRIORITY_CHANGED'`.
- `assign/route.ts` — Reads `assignee_user_id` (uuid string or empty to unassign). Updates `support_tickets.assignee_user_id`. Action `'TICKET_ASSIGNED'`.

Each uses the identical `getAdminContext` → role-gate (super or support admin) → update → audit → 303 redirect pattern shown above.

- [ ] **Step 3: Build + commit**

```bash
npm run typecheck && npm run build
git add "app/api/admin/tickets/[ticketId]/"
git commit -m "phase C: ticket action handlers (reply/status/priority/assign)"
```

---

## Final verification

- [ ] **Run all gates**

```bash
npm run typecheck
npm run build
```

Both must pass. Build expects ~32 routes (Phase A 14 + Phase B 7 routes/3 pages + Phase C 7 org actions + 4 ticket actions + customers + drawer + tickets index + thread).

- [ ] **Manual smoke test (deferred — see HANDOFF)**

Listed in HANDOFF.md after all phases land.

---

## Phase C gate (per spec §11)

Gate: "Ops team can manage orgs, impersonate users, and respond to support tickets."

Status after this plan: GREEN for the admin-portal half. Cross-repo half (apps/web banner + ticket form + email notifications) deferred — those land in their own work item and do not block admin-portal merge.
