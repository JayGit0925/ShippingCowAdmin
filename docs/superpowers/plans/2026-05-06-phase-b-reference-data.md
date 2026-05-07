# Phase B — Reference Data (subset ii) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the ShippingCow Admin Portal to a real Supabase project, apply migrations for `platform_admins`, `audit_log`, the 6 reference tables (`zone_matrix`, `our_carrier_rates`, `carrier_retail_rates`, `our_warehousing_fees`, `our_logistics_fees`, `category_benchmarks`), `rate_card_drafts`, and `scheduled_publishes`, generate TypeScript types from the schema, build a read-only `/admin/reference` UI showing all 6 cards with row counts + last-updated timestamps, and a per-table paginated read-only data view at `/admin/reference/[table]`. Out of scope for this plan: the 4-step publish workflow (deferred to Phase B.2), `mv-refresh` Edge Function (B.2), inline editing (B.2), CSV upload UI (B.2).

**Architecture:** Migrations live in `supabase/migrations/` as numbered SQL files, applied via `supabase db push`. RLS policies are explicit per table — admin reads use the service role client (`adminClient()`) which bypasses RLS, but tables still get policies for defense-in-depth. TypeScript types live in `lib/supabase/types.ts` and are regenerated whenever migrations change. The `/admin/reference` page is a server component that runs 6 `count` queries in parallel against `adminClient()`. Per-table view at `/admin/reference/[table]` reads paginated rows and renders them in a generic table component that accepts column metadata.

**Tech Stack:** Supabase CLI (local migrations + type generation), `@supabase/supabase-js` (already installed), `supabase` JS types, `react-data-grid` deferred to B.2 (not needed for read-only). No new runtime deps.

---

## Prerequisites (must be done before Task 1)

- [ ] **Supabase project provisioned.** User confirms a Supabase project exists at `supabase.com/dashboard` with: project URL, `anon` key, `service_role` key.
- [ ] **`.env.local` populated** with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. (Use values from the Supabase dashboard → Project Settings → API.)
- [ ] **Supabase CLI installed.** Verify with `supabase --version`. Install via `scoop install supabase` (Windows) or `npm i -g supabase` if not present. CLI version ≥ 1.150.0.
- [ ] **Project linked.** Run `supabase link --project-ref <ref>` from repo root. Project ref is in the dashboard URL.
- [ ] **Seed CSV paths confirmed.** User provides absolute paths or repo-relative paths to:
  - Zone matrix CSV (~42k rows, columns: `origin_zip_prefix`, `dest_zip_prefix`, `zone`)
  - FedEx + UPS retail rates (or whichever carriers)
  - FedEx + UPS our negotiated rates
  - Warehousing fees, logistics fees, category benchmarks (synthetic if real data unavailable for dev)

---

## File Structure

**New files (created by this plan):**

```
ShippingCowAdmin/
├── supabase/
│   ├── config.toml                                # Supabase CLI config (auto-generated, then trimmed)
│   ├── migrations/
│   │   ├── 20260506000001_platform_admins.sql
│   │   ├── 20260506000002_audit_log.sql
│   │   ├── 20260506000003_reference_tables.sql
│   │   ├── 20260506000004_rate_card_drafts.sql
│   │   └── 20260506000005_seed_founder_admin.sql
│   └── seed/
│       ├── README.md                              # how to run seed scripts
│       └── ingest-csvs.ts                         # node script: CSV → SQL inserts
├── lib/
│   └── supabase/
│       └── types.ts                               # generated DB types
├── components/
│   └── ui/
│       └── data-table.tsx                         # generic paginated read-only table
├── app/
│   └── admin/
│       └── reference/
│           ├── page.tsx                           # 6 cards (replaces Phase A placeholder)
│           └── [table]/
│               └── page.tsx                       # per-table paginated view
├── lib/
│   └── reference.ts                               # table metadata + column configs
└── docs/
    └── superpowers/
        └── plans/2026-05-06-phase-b-reference-data.md  # this file
```

**Files modified by this plan:**
- `app/admin/reference/page.tsx` — replaced (Phase A placeholder → real implementation)
- `package.json` — add `supabase`, `csv-parse`, `tsx` to devDependencies; add `db:types`, `db:push`, `seed:ingest` scripts
- `.gitignore` — add `supabase/.branches`, `supabase/.temp/`

**Files NOT touched:**
- Existing Phase A code (middleware, admin client, audit, UI primitives, shell components, layout, login, 403, setup-mfa, _ping, dashboard, customers, revenue, platform, audit, security, tickets pages)

---

## Task 1: Install Supabase CLI tooling and verify project link

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add devDependencies + scripts to `package.json`**

In `devDependencies`, add:
```json
"csv-parse": "^5.5.6",
"tsx": "^4.19.2",
"supabase": "^1.226.4"
```

In `scripts`, add:
```json
"db:push": "supabase db push",
"db:reset": "supabase db reset",
"db:types": "supabase gen types typescript --linked --schema public > lib/supabase/types.ts",
"seed:ingest": "tsx supabase/seed/ingest-csvs.ts"
```

- [ ] **Step 2: Install**

Run: `npm install`
Expected: clean install, no peer-dep errors.

- [ ] **Step 3: Verify CLI works**

Run: `npx supabase --version`
Expected: prints version `1.226.4` or higher.

- [ ] **Step 4: Verify project is linked**

Run: `npx supabase status`
Expected: shows linked project ref + API URL. If output says "no project linked", STOP and escalate — prerequisites not met.

- [ ] **Step 5: Add gitignore entries**

In `.gitignore`, append (preserving existing lines):
```
supabase/.branches
supabase/.temp/
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore(db): install supabase CLI + csv-parse + tsx, add db scripts"
```

---

## Task 2: Migration — `platform_admins` table

**Files:**
- Create: `supabase/migrations/20260506000001_platform_admins.sql`

- [ ] **Step 1: Write migration**

```sql
-- 20260506000001_platform_admins.sql
-- Admin user registry. Admins authenticate via Supabase Auth, then this
-- table determines whether they have admin access and at what role.

create table public.platform_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('super-admin','support-admin','billing-admin')),
  is_active  boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

comment on table public.platform_admins is
  'Admin role registry. Middleware reads this on every admin route. RLS denies all client access; service role only.';

alter table public.platform_admins enable row level security;

-- Defense in depth: even authenticated end-users cannot read this.
-- The admin portal uses adminClient() (service role) which bypasses RLS.
create policy platform_admins_no_client_select on public.platform_admins
  for select using (false);

create policy platform_admins_no_client_insert on public.platform_admins
  for insert with check (false);

create policy platform_admins_no_client_update on public.platform_admins
  for update using (false) with check (false);

create policy platform_admins_no_client_delete on public.platform_admins
  for delete using (false);
```

- [ ] **Step 2: Apply migration**

Run: `npm run db:push`
Expected: prompt confirms applying 1 new migration. Type `y`. Output: `Applying migration 20260506000001_platform_admins.sql...` then success.

- [ ] **Step 3: Verify in dashboard**

In Supabase dashboard → Table Editor → confirm `platform_admins` table exists with 5 columns. Check Authentication → Policies → confirm 4 deny policies attached.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260506000001_platform_admins.sql
git commit -m "feat(db): platform_admins table with deny-all RLS"
```

---

## Task 3: Migration — `audit_log` table (append-only)

**Files:**
- Create: `supabase/migrations/20260506000002_audit_log.sql`

- [ ] **Step 1: Write migration**

```sql
-- 20260506000002_audit_log.sql
-- Append-only audit log. Updates and deletes are blocked at the trigger
-- level so even the service role cannot tamper with history.

create table public.audit_log (
  id            uuid primary key default gen_random_uuid(),
  occurred_at   timestamptz not null default now(),
  actor_user_id uuid,
  actor_role    text,
  org_id        uuid,
  action        text not null,
  resource_type text not null,
  resource_id   text not null,
  before_value  jsonb,
  after_value   jsonb,
  reason        text,
  ticket_id     text,
  ip_address    inet
);

comment on table public.audit_log is
  'Append-only audit log. Updates/deletes blocked by trigger. 7-year retention.';

create index audit_log_occurred_at_idx on public.audit_log (occurred_at desc);
create index audit_log_org_id_idx on public.audit_log (org_id) where org_id is not null;
create index audit_log_actor_idx on public.audit_log (actor_user_id);
create index audit_log_action_idx on public.audit_log (action);

-- Block UPDATE and DELETE at the trigger level. Service role bypasses RLS
-- but cannot bypass triggers.
create or replace function public.audit_log_block_mutations()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_log is append-only — % rejected', tg_op;
end;
$$;

create trigger audit_log_no_update before update on public.audit_log
  for each row execute function public.audit_log_block_mutations();

create trigger audit_log_no_delete before delete on public.audit_log
  for each row execute function public.audit_log_block_mutations();

alter table public.audit_log enable row level security;

create policy audit_log_no_client_access on public.audit_log
  for all using (false) with check (false);
```

- [ ] **Step 2: Apply migration**

Run: `npm run db:push`
Expected: applies 1 new migration successfully.

- [ ] **Step 3: Verify trigger works**

In Supabase SQL editor:
```sql
insert into audit_log (action, resource_type, resource_id) values ('TEST', 'test', '1');
update audit_log set reason = 'tampered' where action = 'TEST';
```
Expected: insert succeeds; update fails with `audit_log is append-only — UPDATE rejected`. Then delete the test row via:
```sql
-- This should also fail:
delete from audit_log where action = 'TEST';
```
If delete fails with the same trigger error, the row is permanently in the table — that's fine, it's a test row. (For a cleaner test, run the SQL inside a `BEGIN;...ROLLBACK;` block.)

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260506000002_audit_log.sql
git commit -m "feat(db): audit_log table, append-only via trigger"
```

---

## Task 4: Migration — 6 reference tables

**Files:**
- Create: `supabase/migrations/20260506000003_reference_tables.sql`

- [ ] **Step 1: Write migration**

```sql
-- 20260506000003_reference_tables.sql
-- Six admin-managed reference tables. Each row carries effective-from /
-- effective-to dates for historical accuracy: shipments analyzed under the
-- rate card that was live when they happened, not whatever is current.

-- 1. Zone matrix (~42k rows expected after seed)
create table public.zone_matrix (
  id                 bigserial primary key,
  origin_zip_prefix  text not null,         -- 3-digit ZIP prefix
  dest_zip_prefix    text not null,         -- 3-digit ZIP prefix
  zone               smallint not null check (zone between 1 and 9),
  effective_from     date not null,
  effective_to       date,
  unique (origin_zip_prefix, dest_zip_prefix, effective_from)
);
create index zone_matrix_lookup_idx on public.zone_matrix (origin_zip_prefix, dest_zip_prefix);

-- 2. Our negotiated carrier rates
create table public.our_carrier_rates (
  id              bigserial primary key,
  carrier         text not null,            -- 'fedex' | 'ups' | 'usps' | etc
  service         text not null,            -- 'ground' | '2day' | 'priority' | etc
  zone            smallint not null check (zone between 1 and 9),
  weight_lb_min   numeric(10,2) not null,
  weight_lb_max   numeric(10,2) not null,
  rate_usd        numeric(10,4) not null,
  effective_from  date not null,
  effective_to    date,
  unique (carrier, service, zone, weight_lb_min, effective_from)
);
create index our_carrier_rates_lookup_idx on public.our_carrier_rates
  (carrier, service, zone, weight_lb_min);

-- 3. Public retail rates (benchmark)
create table public.carrier_retail_rates (
  id              bigserial primary key,
  carrier         text not null,
  service         text not null,
  zone            smallint not null check (zone between 1 and 9),
  weight_lb_min   numeric(10,2) not null,
  weight_lb_max   numeric(10,2) not null,
  rate_usd        numeric(10,4) not null,
  effective_from  date not null,
  effective_to    date,
  unique (carrier, service, zone, weight_lb_min, effective_from)
);

-- 4. Warehousing fees (receiving, putaway, storage)
create table public.our_warehousing_fees (
  id              bigserial primary key,
  fee_type        text not null,            -- 'receiving' | 'putaway' | 'storage_per_cuft'
  unit            text not null,            -- 'per_unit' | 'per_pallet' | 'per_cuft_month'
  rate_usd        numeric(10,4) not null,
  effective_from  date not null,
  effective_to    date,
  unique (fee_type, effective_from)
);

-- 5. Logistics fees (returns, refurb, disposal, special handling)
create table public.our_logistics_fees (
  id              bigserial primary key,
  fee_type        text not null,            -- 'return' | 'refurb' | 'disposal' | 'special_handling'
  unit            text not null,
  rate_usd        numeric(10,4) not null,
  effective_from  date not null,
  effective_to    date,
  unique (fee_type, effective_from)
);

-- 6. Category benchmarks (Bull-tier peer cohort comparison)
create table public.category_benchmarks (
  id                  bigserial primary key,
  category            text not null,        -- 'electronics' | 'apparel' | etc
  metric              text not null,        -- 'avg_cost_per_shipment' | 'avg_zone' | etc
  value               numeric(14,4) not null,
  cohort_size         integer not null,
  effective_from      date not null,
  effective_to        date,
  unique (category, metric, effective_from)
);

-- All six are admin-managed only.
alter table public.zone_matrix          enable row level security;
alter table public.our_carrier_rates    enable row level security;
alter table public.carrier_retail_rates enable row level security;
alter table public.our_warehousing_fees enable row level security;
alter table public.our_logistics_fees   enable row level security;
alter table public.category_benchmarks  enable row level security;

create policy zone_matrix_no_client          on public.zone_matrix          for all using (false) with check (false);
create policy our_carrier_rates_no_client    on public.our_carrier_rates    for all using (false) with check (false);
create policy carrier_retail_rates_no_client on public.carrier_retail_rates for all using (false) with check (false);
create policy our_warehousing_fees_no_client on public.our_warehousing_fees for all using (false) with check (false);
create policy our_logistics_fees_no_client   on public.our_logistics_fees   for all using (false) with check (false);
create policy category_benchmarks_no_client  on public.category_benchmarks  for all using (false) with check (false);
```

- [ ] **Step 2: Apply migration**

Run: `npm run db:push`
Expected: applies 1 new migration successfully.

- [ ] **Step 3: Verify**

Supabase dashboard → Table Editor → confirm all 6 tables present with the expected columns and indexes.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260506000003_reference_tables.sql
git commit -m "feat(db): 6 reference tables with effective-date semantics + deny-all RLS"
```

---

## Task 5: Migration — `rate_card_drafts` and `scheduled_publishes`

**Files:**
- Create: `supabase/migrations/20260506000004_rate_card_drafts.sql`

- [ ] **Step 1: Write migration**

```sql
-- 20260506000004_rate_card_drafts.sql
-- Drafts staged for the 4-step publish workflow (Phase B.2).
-- Created here in B.1 because the read-only UI shows draft counts.

create table public.rate_card_drafts (
  id                uuid primary key default gen_random_uuid(),
  table_name        text not null check (table_name in (
    'zone_matrix','our_carrier_rates','carrier_retail_rates',
    'our_warehousing_fees','our_logistics_fees','category_benchmarks'
  )),
  draft_payload     jsonb not null,
  validation_result jsonb,
  impact_preview    jsonb,
  status            text not null default 'draft' check (status in ('draft','published','discarded')),
  created_by        uuid references auth.users(id),
  created_at        timestamptz not null default now()
);
create index rate_card_drafts_table_status_idx on public.rate_card_drafts (table_name, status);

create table public.scheduled_publishes (
  id             uuid primary key default gen_random_uuid(),
  table_name     text not null,
  draft_id       uuid not null references public.rate_card_drafts(id) on delete cascade,
  effective_from date not null,
  scheduled_by   uuid references auth.users(id),
  scheduled_at   timestamptz not null default now(),
  status         text not null default 'pending' check (status in ('pending','published','cancelled'))
);
create index scheduled_publishes_pending_idx on public.scheduled_publishes (effective_from)
  where status = 'pending';

alter table public.rate_card_drafts    enable row level security;
alter table public.scheduled_publishes enable row level security;

create policy rate_card_drafts_no_client    on public.rate_card_drafts    for all using (false) with check (false);
create policy scheduled_publishes_no_client on public.scheduled_publishes for all using (false) with check (false);
```

- [ ] **Step 2: Apply migration**

Run: `npm run db:push`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260506000004_rate_card_drafts.sql
git commit -m "feat(db): rate_card_drafts + scheduled_publishes (Phase B.2 prep)"
```

---

## Task 6: Seed founder admin

**Files:**
- Create: `supabase/migrations/20260506000005_seed_founder_admin.sql`

**BEFORE WRITING:** The founder must already exist in `auth.users`. This means the founder has signed up via the Supabase Auth UI at least once (sign-up email + magic link or password). Get the founder's `auth.users.id`:

In Supabase dashboard → Authentication → Users → find the founder's row → copy the UUID. If the founder has not signed up yet, STOP and escalate — sign-up must happen before this migration runs, otherwise the foreign key reference fails.

- [ ] **Step 1: Confirm founder UUID**

User provides the founder's `auth.users.id` UUID. Write it down — needed in Step 2.

- [ ] **Step 2: Write migration**

Replace `<FOUNDER_UUID>` with the actual UUID:

```sql
-- 20260506000005_seed_founder_admin.sql
-- One-time seed: insert the founder as the first super-admin.
-- After this migration, additional admins are created via the admin UI.

insert into public.platform_admins (user_id, role, is_active, created_by, created_at)
values (
  '<FOUNDER_UUID>'::uuid,
  'super-admin',
  true,
  '<FOUNDER_UUID>'::uuid,  -- self-created at bootstrap
  now()
)
on conflict (user_id) do nothing;
```

- [ ] **Step 3: Apply migration**

Run: `npm run db:push`

- [ ] **Step 4: Verify**

Supabase dashboard → Table Editor → `platform_admins` → confirm one row with `role = 'super-admin'` and `is_active = true`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260506000005_seed_founder_admin.sql
git commit -m "feat(db): seed founder as first super-admin"
```

---

## Task 7: Generate TypeScript types from schema

**Files:**
- Create: `lib/supabase/types.ts` (auto-generated)

- [ ] **Step 1: Generate types**

Run: `npm run db:types`
Expected: writes `lib/supabase/types.ts` with `Database` interface containing all 9 tables (`platform_admins`, `audit_log`, 6 reference tables, `rate_card_drafts`, `scheduled_publishes`). File is large — that's fine.

- [ ] **Step 2: Wire types into admin client**

Modify `lib/supabase/admin.ts`:

Replace:
```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
```

With:
```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
```

Replace:
```ts
let _client: SupabaseClient | null = null;

export function adminClient(): SupabaseClient {
```

With:
```ts
let _client: SupabaseClient<Database> | null = null;

export function adminClient(): SupabaseClient<Database> {
```

Replace:
```ts
  _client = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
```

With:
```ts
  _client = createClient<Database>(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: zero errors. If errors mention missing `Database` import elsewhere, that's expected — `lib/audit.ts` and routes that use `adminClient()` will inherit types automatically through the function signature.

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/types.ts lib/supabase/admin.ts
git commit -m "feat(types): generate DB types + wire into adminClient<Database>"
```

---

## Task 8: Generic data-table primitive

**Files:**
- Create: `components/ui/data-table.tsx`

This is the read-only, paginated table used by the per-table reference views.

- [ ] **Step 1: Write `components/ui/data-table.tsx`**

```tsx
'use client';
import { useMemo, useState } from 'react';
import { BRAND } from '@/lib/brand';

export type Column<T> = {
  key: keyof T & string;
  label: string;
  format?: (value: T[keyof T], row: T) => string;
  width?: number;
};

export function DataTable<T extends Record<string, unknown>>({
  rows,
  columns,
  pageSize = 50,
}: {
  rows: T[];
  columns: Column<T>[];
  pageSize?: number;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const visible = useMemo(
    () => rows.slice(page * pageSize, page * pageSize + pageSize),
    [rows, page, pageSize],
  );

  return (
    <div
      style={{
        background: BRAND.white,
        border: `3px solid ${BRAND.charcoal}`,
        boxShadow: `4px 4px 0 ${BRAND.charcoal}`,
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: BRAND.pageBed, borderBottom: `3px solid ${BRAND.charcoal}` }}>
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 9,
                    color: BRAND.blue,
                    letterSpacing: '0.04em',
                    padding: '10px 12px',
                    textAlign: 'left',
                    width: c.width,
                  }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr
                key={i}
                style={{ borderBottom: `1px solid ${BRAND.sky}`, background: i % 2 ? '#FAFBFF' : BRAND.white }}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      color: BRAND.charcoal,
                      padding: '8px 12px',
                    }}
                  >
                    {c.format ? c.format(row[c.key], row) : String(row[c.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    color: BRAND.charcoal,
                  }}
                >
                  No rows.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderTop: `3px solid ${BRAND.charcoal}`,
          background: BRAND.pageBed,
        }}
      >
        <span
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 8,
            color: BRAND.charcoal,
            letterSpacing: '0.03em',
          }}
        >
          PAGE {page + 1} / {totalPages} · {rows.length} ROWS
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 9,
              padding: '6px 10px',
              border: `2px solid ${BRAND.charcoal}`,
              background: page === 0 ? '#e5e7eb' : BRAND.yellow,
              color: BRAND.charcoal,
              cursor: page === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            « PREV
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 9,
              padding: '6px 10px',
              border: `2px solid ${BRAND.charcoal}`,
              background: page >= totalPages - 1 ? '#e5e7eb' : BRAND.yellow,
              color: BRAND.charcoal,
              cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
            }}
          >
            NEXT »
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add components/ui/data-table.tsx
git commit -m "feat(ui): generic paginated read-only DataTable"
```

---

## Task 9: Reference table metadata

**Files:**
- Create: `lib/reference.ts`

Centralizes the 6 tables' metadata so `/admin/reference/page.tsx` and `/admin/reference/[table]/page.tsx` agree on names, descriptions, slugs, and column configs.

- [ ] **Step 1: Write `lib/reference.ts`**

```ts
import type { Database } from '@/lib/supabase/types';

type PublicTables = Database['public']['Tables'];

export type ReferenceTableSlug =
  | 'zone-matrix'
  | 'our-carrier-rates'
  | 'carrier-retail-rates'
  | 'our-warehousing-fees'
  | 'our-logistics-fees'
  | 'category-benchmarks';

export type ReferenceTableMeta = {
  slug: ReferenceTableSlug;
  table: keyof PublicTables;
  title: string;
  description: string;
  columns: { key: string; label: string }[];
};

export const REFERENCE_TABLES: ReferenceTableMeta[] = [
  {
    slug: 'zone-matrix',
    table: 'zone_matrix',
    title: 'Zone Matrix',
    description: 'Origin/destination zone lookup — ~42k rows.',
    columns: [
      { key: 'origin_zip_prefix', label: 'ORIGIN' },
      { key: 'dest_zip_prefix', label: 'DEST' },
      { key: 'zone', label: 'ZONE' },
      { key: 'effective_from', label: 'FROM' },
      { key: 'effective_to', label: 'TO' },
    ],
  },
  {
    slug: 'our-carrier-rates',
    table: 'our_carrier_rates',
    title: 'Our Carrier Rates',
    description: 'Negotiated rates by carrier/service/zone/weight band.',
    columns: [
      { key: 'carrier', label: 'CARRIER' },
      { key: 'service', label: 'SERVICE' },
      { key: 'zone', label: 'ZONE' },
      { key: 'weight_lb_min', label: 'WT MIN' },
      { key: 'weight_lb_max', label: 'WT MAX' },
      { key: 'rate_usd', label: 'RATE USD' },
      { key: 'effective_from', label: 'FROM' },
    ],
  },
  {
    slug: 'carrier-retail-rates',
    table: 'carrier_retail_rates',
    title: 'Carrier Retail Rates',
    description: 'Public retail rates as benchmark.',
    columns: [
      { key: 'carrier', label: 'CARRIER' },
      { key: 'service', label: 'SERVICE' },
      { key: 'zone', label: 'ZONE' },
      { key: 'weight_lb_min', label: 'WT MIN' },
      { key: 'weight_lb_max', label: 'WT MAX' },
      { key: 'rate_usd', label: 'RATE USD' },
      { key: 'effective_from', label: 'FROM' },
    ],
  },
  {
    slug: 'our-warehousing-fees',
    table: 'our_warehousing_fees',
    title: 'Warehousing Fees',
    description: 'Receiving, putaway, storage per cuft.',
    columns: [
      { key: 'fee_type', label: 'FEE' },
      { key: 'unit', label: 'UNIT' },
      { key: 'rate_usd', label: 'RATE USD' },
      { key: 'effective_from', label: 'FROM' },
    ],
  },
  {
    slug: 'our-logistics-fees',
    table: 'our_logistics_fees',
    title: 'Logistics Fees',
    description: 'Returns, refurb, disposal, special handling.',
    columns: [
      { key: 'fee_type', label: 'FEE' },
      { key: 'unit', label: 'UNIT' },
      { key: 'rate_usd', label: 'RATE USD' },
      { key: 'effective_from', label: 'FROM' },
    ],
  },
  {
    slug: 'category-benchmarks',
    table: 'category_benchmarks',
    title: 'Category Benchmarks',
    description: 'Bull-tier peer cohort comparison.',
    columns: [
      { key: 'category', label: 'CATEGORY' },
      { key: 'metric', label: 'METRIC' },
      { key: 'value', label: 'VALUE' },
      { key: 'cohort_size', label: 'N' },
      { key: 'effective_from', label: 'FROM' },
    ],
  },
];

export function findReferenceTable(slug: string): ReferenceTableMeta | undefined {
  return REFERENCE_TABLES.find((t) => t.slug === slug);
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: zero errors. (The `keyof PublicTables` constraint catches any table-name typos.)

- [ ] **Step 3: Commit**

```bash
git add lib/reference.ts
git commit -m "feat(reference): table metadata module (slugs, titles, columns)"
```

---

## Task 10: `/admin/reference` page — 6 cards with row counts

**Files:**
- Replace: `app/admin/reference/page.tsx` (currently a Phase A placeholder)

- [ ] **Step 1: Replace `app/admin/reference/page.tsx`**

```tsx
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { adminClient } from '@/lib/supabase/admin';
import { SUPABASE_CONFIGURED } from '@/lib/env';
import { REFERENCE_TABLES, type ReferenceTableMeta } from '@/lib/reference';
import { BRAND } from '@/lib/brand';

type RowStat = { count: number; lastUpdated: string | null };

async function fetchStats(meta: ReferenceTableMeta): Promise<RowStat> {
  const supabase = adminClient();
  const [{ count }, { data: latest }] = await Promise.all([
    supabase.from(meta.table).select('*', { count: 'exact', head: true }),
    supabase
      .from(meta.table)
      .select('effective_from')
      .order('effective_from', { ascending: false })
      .limit(1),
  ]);
  return {
    count: count ?? 0,
    lastUpdated: (latest?.[0] as { effective_from?: string } | undefined)?.effective_from ?? null,
  };
}

export default async function ReferencePage() {
  if (!SUPABASE_CONFIGURED) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <Eyebrow>{'// REFERENCE DATA'}</Eyebrow>
          <h1
            style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 32,
              color: BRAND.charcoal,
              textTransform: 'uppercase',
            }}
          >
            Rate Cards
          </h1>
        </div>
        <Card style={{ padding: 24 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
            Supabase not configured. Set env vars to view live data. See <code>.env.example</code>.
          </p>
        </Card>
      </div>
    );
  }

  const stats = await Promise.all(REFERENCE_TABLES.map(fetchStats));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>{'// REFERENCE DATA'}</Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
          }}
        >
          Rate Cards
        </h1>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {REFERENCE_TABLES.map((meta, i) => {
          const s = stats[i];
          return (
            <Link key={meta.slug} href={`/admin/reference/${meta.slug}`} style={{ textDecoration: 'none' }}>
              <Card onClick={() => {}} style={{ padding: 18 }}>
                <Eyebrow style={{ marginBottom: 4 }}>{meta.slug.toUpperCase()}</Eyebrow>
                <h2
                  style={{
                    fontFamily: "'Black Han Sans', sans-serif",
                    fontSize: 18,
                    color: BRAND.charcoal,
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  {meta.title}
                </h2>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    color: BRAND.charcoal,
                    marginBottom: 12,
                    minHeight: 32,
                  }}
                >
                  {meta.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: 14,
                      color: BRAND.blue,
                    }}
                  >
                    {s.count.toLocaleString()}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: 8,
                      color: BRAND.charcoal,
                      letterSpacing: '0.03em',
                    }}
                  >
                    {s.lastUpdated ? `EFF ${s.lastUpdated}` : 'NO DATA'}
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: zero errors.

- [ ] **Step 3: Smoke test**

Run: `npm run dev`. In browser navigate to `http://localhost:3001/admin/reference`. Expected: 6 cards, each showing the table title, description, row count (probably 0 since seed not run yet), and EFF date or "NO DATA". Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add app/admin/reference/page.tsx
git commit -m "feat(reference): /admin/reference page — 6 cards with row counts + last-updated"
```

---

## Task 11: `/admin/reference/[table]` per-table read-only view

**Files:**
- Create: `app/admin/reference/[table]/page.tsx`

- [ ] **Step 1: Write `app/admin/reference/[table]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { DataTable, type Column } from '@/components/ui/data-table';
import { adminClient } from '@/lib/supabase/admin';
import { SUPABASE_CONFIGURED } from '@/lib/env';
import { findReferenceTable } from '@/lib/reference';
import { BRAND } from '@/lib/brand';

const PAGE_SIZE = 200;

export default async function ReferenceTablePage({
  params,
}: {
  params: { table: string };
}) {
  const meta = findReferenceTable(params.table);
  if (!meta) notFound();

  let rows: Record<string, unknown>[] = [];
  let total = 0;
  let errorMessage: string | null = null;

  if (SUPABASE_CONFIGURED) {
    const supabase = adminClient();
    const [{ count }, { data, error }] = await Promise.all([
      supabase.from(meta.table).select('*', { count: 'exact', head: true }),
      supabase.from(meta.table).select('*').limit(PAGE_SIZE),
    ]);
    total = count ?? 0;
    rows = (data as Record<string, unknown>[] | null) ?? [];
    if (error) errorMessage = error.message;
  } else {
    errorMessage = 'Supabase not configured.';
  }

  const columns: Column<Record<string, unknown>>[] = meta.columns.map((c) => ({
    key: c.key,
    label: c.label,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>
          <Link href="/admin/reference" style={{ color: BRAND.blue, textDecoration: 'none' }}>
            {'« BACK'}
          </Link>
          {' / '}
          {meta.slug.toUpperCase()}
        </Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
          }}
        >
          {meta.title}
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.charcoal, marginTop: 6 }}>
          {meta.description}
        </p>
      </div>
      {errorMessage ? (
        <Card style={{ padding: 24, border: `3px solid ${BRAND.red}`, boxShadow: `4px 4px 0 ${BRAND.red}` }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.red }}>
            {errorMessage}
          </p>
        </Card>
      ) : (
        <>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: BRAND.charcoal }}>
            {`Showing ${rows.length.toLocaleString()} of ${total.toLocaleString()} rows. Editing arrives in Phase B.2.`}
          </p>
          <DataTable rows={rows} columns={columns} pageSize={50} />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: zero errors.

- [ ] **Step 3: Smoke test**

Run: `npm run dev`. Navigate to `http://localhost:3001/admin/reference/zone-matrix` and any other slug. Expected: heading, description, "Showing 0 of 0 rows" (or similar if seed has not run), DataTable with no rows. Try a bogus slug like `/admin/reference/nonsense` — expect Next.js 404 page. Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add app/admin/reference/[table]/page.tsx
git commit -m "feat(reference): /admin/reference/[table] read-only paginated view"
```

---

## Task 12: Seed ingestion script

**Files:**
- Create: `supabase/seed/README.md`
- Create: `supabase/seed/ingest-csvs.ts`

The seed script takes CSV paths via env vars or CLI args, parses them, and inserts into the appropriate tables. It is intentionally **not a migration** — seeds should be re-runnable and not block schema changes.

- [ ] **Step 1: Write `supabase/seed/README.md`**

```md
# Seed scripts

Run after migrations apply.

## Inputs

Set these env vars (or pass equivalent CLI args — see ingest-csvs.ts) before running:

- `SEED_ZONE_MATRIX_CSV` — path to zone matrix CSV. Headers: `origin_zip_prefix,dest_zip_prefix,zone`.
- `SEED_OUR_CARRIER_RATES_CSV` — headers: `carrier,service,zone,weight_lb_min,weight_lb_max,rate_usd`.
- `SEED_CARRIER_RETAIL_RATES_CSV` — same headers as above.
- `SEED_WAREHOUSING_FEES_CSV` — headers: `fee_type,unit,rate_usd`.
- `SEED_LOGISTICS_FEES_CSV` — same as above.
- `SEED_CATEGORY_BENCHMARKS_CSV` — headers: `category,metric,value,cohort_size`.
- `SEED_EFFECTIVE_FROM` — date string `YYYY-MM-DD` to assign to every seeded row's `effective_from`. Default: today.

Any unset env var is skipped — the corresponding table is not seeded. Re-running the script with the same inputs is a no-op (the unique constraints on `(business_key, effective_from)` deduplicate).

## Run

```bash
npm run seed:ingest
```

## Removal

To wipe all seeded data and re-run, drop and recreate the schema:

```bash
npm run db:reset
npm run db:push
npm run seed:ingest
```
```

- [ ] **Step 2: Write `supabase/seed/ingest-csvs.ts`**

```ts
import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL required.');
  process.exit(1);
}

const effectiveFrom = process.env.SEED_EFFECTIVE_FROM ?? new Date().toISOString().slice(0, 10);
const supabase = createClient(url, key, { auth: { persistSession: false } });

type Row = Record<string, string>;

function read(path: string | undefined): Row[] | null {
  if (!path) return null;
  const text = readFileSync(path, 'utf8');
  return parse(text, { columns: true, skip_empty_lines: true, trim: true }) as Row[];
}

async function ingest(table: string, rows: Row[] | null, mapper: (r: Row) => Record<string, unknown>) {
  if (!rows || rows.length === 0) {
    console.log(`[skip] ${table} — no input`);
    return;
  }
  const mapped = rows.map(mapper);
  const chunkSize = 1000;
  let inserted = 0;
  for (let i = 0; i < mapped.length; i += chunkSize) {
    const chunk = mapped.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: getConflictKey(table) });
    if (error) {
      console.error(`[error] ${table} chunk ${i}: ${error.message}`);
      process.exit(1);
    }
    inserted += chunk.length;
  }
  console.log(`[ok] ${table} — ${inserted} rows`);
}

function getConflictKey(table: string): string {
  switch (table) {
    case 'zone_matrix': return 'origin_zip_prefix,dest_zip_prefix,effective_from';
    case 'our_carrier_rates':
    case 'carrier_retail_rates': return 'carrier,service,zone,weight_lb_min,effective_from';
    case 'our_warehousing_fees':
    case 'our_logistics_fees': return 'fee_type,effective_from';
    case 'category_benchmarks': return 'category,metric,effective_from';
    default: throw new Error(`unknown table ${table}`);
  }
}

async function main() {
  await ingest('zone_matrix', read(process.env.SEED_ZONE_MATRIX_CSV), (r) => ({
    origin_zip_prefix: r.origin_zip_prefix,
    dest_zip_prefix: r.dest_zip_prefix,
    zone: parseInt(r.zone, 10),
    effective_from: effectiveFrom,
  }));

  await ingest('our_carrier_rates', read(process.env.SEED_OUR_CARRIER_RATES_CSV), (r) => ({
    carrier: r.carrier,
    service: r.service,
    zone: parseInt(r.zone, 10),
    weight_lb_min: Number(r.weight_lb_min),
    weight_lb_max: Number(r.weight_lb_max),
    rate_usd: Number(r.rate_usd),
    effective_from: effectiveFrom,
  }));

  await ingest('carrier_retail_rates', read(process.env.SEED_CARRIER_RETAIL_RATES_CSV), (r) => ({
    carrier: r.carrier,
    service: r.service,
    zone: parseInt(r.zone, 10),
    weight_lb_min: Number(r.weight_lb_min),
    weight_lb_max: Number(r.weight_lb_max),
    rate_usd: Number(r.rate_usd),
    effective_from: effectiveFrom,
  }));

  await ingest('our_warehousing_fees', read(process.env.SEED_WAREHOUSING_FEES_CSV), (r) => ({
    fee_type: r.fee_type,
    unit: r.unit,
    rate_usd: Number(r.rate_usd),
    effective_from: effectiveFrom,
  }));

  await ingest('our_logistics_fees', read(process.env.SEED_LOGISTICS_FEES_CSV), (r) => ({
    fee_type: r.fee_type,
    unit: r.unit,
    rate_usd: Number(r.rate_usd),
    effective_from: effectiveFrom,
  }));

  await ingest('category_benchmarks', read(process.env.SEED_CATEGORY_BENCHMARKS_CSV), (r) => ({
    category: r.category,
    metric: r.metric,
    value: Number(r.value),
    cohort_size: parseInt(r.cohort_size, 10),
    effective_from: effectiveFrom,
  }));

  console.log('done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 3: Run seed script** (only if user has provided CSV paths)

If user has CSVs, set env vars (in `.env.local` or shell) and run:
```bash
npm run seed:ingest
```
Expected output: `[ok]` line per table with row counts.

If user does not have CSVs yet, skip the run — script can be invoked later.

- [ ] **Step 4: Verify in `/admin/reference`**

Run `npm run dev` → `http://localhost:3001/admin/reference`. Expected: cards now show non-zero row counts for the seeded tables.

- [ ] **Step 5: Commit**

```bash
git add supabase/seed/README.md supabase/seed/ingest-csvs.ts
git commit -m "feat(seed): CSV ingest script for 6 reference tables"
```

---

## Task 13: Update CLAUDE.md with Phase B notes

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Append to `CLAUDE.md`** (do not replace existing content; add a new section at the end before the "Companion documents" section)

Insert immediately before the `## Companion documents` heading:

```markdown
## Database

The Supabase project is the single source of truth for all data. Migrations live in `supabase/migrations/` as numbered SQL files. Apply them with:

```bash
npm run db:push      # apply pending migrations
npm run db:reset     # nuke and rebuild schema (destroys data — local/dev only)
npm run db:types     # regenerate lib/supabase/types.ts after a migration
```

After every migration that adds or changes a table, regenerate types and commit `lib/supabase/types.ts` alongside the migration. The `Database` interface flows through `adminClient()` so route handlers get column-name typo protection automatically.

**RLS posture:** every table has explicit policies. Most have `using (false) with check (false)` — meaning end-users cannot read or write directly; only the service role (admin portal) can. The `audit_log` table additionally uses BEFORE UPDATE/DELETE triggers to physically reject mutations even from the service role.

**Reference tables** (`zone_matrix`, `our_carrier_rates`, `carrier_retail_rates`, `our_warehousing_fees`, `our_logistics_fees`, `category_benchmarks`) carry `effective_from` / `effective_to` dates so historical analytics keep their original rates. Never UPDATE a published row to change a rate — instead insert a new row with a new `effective_from`, and set the old row's `effective_to` to the day before. The Phase B.2 publish workflow automates this.

**Seed data** is not in migrations. Run `npm run seed:ingest` with the `SEED_*_CSV` env vars set (see `supabase/seed/README.md`).
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md — add Database section (migrations, RLS, types, seeds)"
```

---

## Final Verification

- [ ] **Run all gates**

```bash
npm run lint
npm run typecheck
npm run build
```

All three must pass. The build will compile 16 routes (Phase A's 14 + the new `[table]` dynamic route + the updated reference page).

- [ ] **Manual smoke test**

```bash
npm run dev
```

In browser:
- `http://localhost:3001/admin` → Dashboard placeholder (unchanged from Phase A)
- `http://localhost:3001/admin/reference` → 6 cards with real row counts
- `http://localhost:3001/admin/reference/zone-matrix` → DataTable rendered
- `http://localhost:3001/admin/reference/nonsense` → Next.js 404
- All other admin sections → unchanged Phase A placeholders

Stop dev server.

- [ ] **Phase B subset ii gate**

Phase B subset ii is achieved when:
1. All 9 tables exist in Supabase: `platform_admins`, `audit_log`, the 6 reference tables, `rate_card_drafts`, `scheduled_publishes`.
2. `lib/supabase/types.ts` is generated and `adminClient()` is parameterized with `Database`.
3. `/admin/reference` shows 6 cards reading live counts.
4. `/admin/reference/[table]` reads paginated rows.
5. Seed script can ingest CSVs (run optional).
6. Founder is in `platform_admins` as `super-admin`.

The full Phase B gate from handoff §11 (publish workflow with mv-refresh) is **NOT** achieved by this plan. That is Phase B.2.

---

## Out of scope (deferred to Phase B.2)

- 4-step publish workflow (Edit → Validate → Preview Impact → Publish)
- Inline spreadsheet editor (`react-data-grid`)
- Validation Edge Function (`POST /api/admin/reference/[table]/validate`)
- Impact preview function (`POST /api/admin/reference/[table]/preview-impact`)
- Publish function with `mv-refresh` trigger
- `mv_org_cost_summary` materialized view (lives in user portal repo, not admin)
- Version history tab + diff view + roll back
- CSV import UI (CSV ingestion is currently a script, not a UI)
- Scheduled publish auto-trigger (cron Edge Function)
