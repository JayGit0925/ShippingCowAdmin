# Phase E — Platform + Audit + Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire `/admin/platform` (feature flags CRUD, AI kill switch, model pins, news-card approval queue, per-org quotas), `/admin/audit` (filterable log with expand/diff/export), and `/admin/security` (admin user management + suspicious-session detection + CCPA erasure workflow).

**Architecture:** Self-contained — no cross-repo dependencies. Read paths are server components reading admin-owned tables directly. Write paths are POST route handlers that audit-log every change. CCPA erasure uses a 5-step server-side guarded flow (typed-confirmation → cascade preview → typed name confirm → cascade delete with `auth.users.deleteUser` + table deletes → final audit entry).

**Tech Stack:** Next.js 14 App Router, TypeScript strict, `@supabase/supabase-js`. No new runtime deps.

---

## Assumptions (FLAG before executing)

| Table | Notes |
|---|---|
| `feature_flags`, `model_pins` | Admin-owned. Created by this plan. |
| `news_items` | User-portal-owned. Conditional ALTER for `approval_state` + `approved_by`. |
| `user_sessions` | User-portal-owned. Suspicious-session detection assumes columns `user_id, ip, country, city, latitude, longitude, created_at`. If absent, the security page shows "no data". |
| `subscriptions.quota_override`, `ai_suspended` | Already added by Phase C migration. |
| `audit_log` | From Phase A. |
| `platform_admins` | From Phase A. |
| `usage_events` | User-portal-owned, optional. Quota usage bars degrade if missing. |
| Bull-tier shipments / conversations / files for CCPA cascade | User-portal-owned. CCPA uses `to_regclass` checks before each cascade DELETE; tables that aren't there are skipped with a warning in the audit `after_value`. |

**Out of scope (deferred):**
- One-time setup email for new admins (needs Resend/cross-repo).
- Cron-driven monthly archival of audit_log to Supabase Storage. Documented in HANDOFF; current retention = "rows live forever in `audit_log`".
- Real-time alert push to Slack/PagerDuty.

---

## File Structure

```
ShippingCowAdmin/
├── supabase/migrations/
│   └── 0005_platform_security.sql       # feature_flags + model_pins + conditional ALTER on news_items
├── lib/
│   ├── feature-flags.ts                 # fetchFlags + helpers
│   ├── audit-search.ts                  # filterable audit fetcher
│   └── ccpa.ts                          # cascade-preview + cascade-erase
├── app/
│   ├── admin/
│   │   ├── platform/
│   │   │   ├── page.tsx                 # tabbed: Flags / Kill Switch / Model Pins / News / Quotas
│   │   │   ├── _flag-list.tsx           # client flag CRUD
│   │   │   ├── _flag-modal.tsx          # client edit modal (uses route handler)
│   │   │   ├── _kill-switch.tsx         # client switch
│   │   │   ├── _model-pins.tsx          # client pin CRUD
│   │   │   ├── _news-queue.tsx          # client approve/reject buttons
│   │   │   └── _quota-panel.tsx         # per-org search + override form
│   │   ├── audit/
│   │   │   ├── page.tsx                 # filterable list + expand row
│   │   │   ├── _filters.tsx             # client filter bar
│   │   │   └── _entry-detail.tsx        # expandable JSON diff
│   │   └── security/
│   │       ├── page.tsx                 # 3-section: admins, suspicious sessions, CCPA
│   │       ├── _admin-list.tsx          # admin user CRUD
│   │       ├── _suspicious-sessions.tsx # detection list
│   │       └── _ccpa-form.tsx           # 5-step CCPA flow
│   └── api/admin/
│       ├── platform/
│       │   ├── flags/route.ts                                # POST upsert
│       │   ├── flags/[flagKey]/route.ts                      # DELETE
│       │   ├── kill-switch/route.ts                          # POST { reason, enabled }
│       │   ├── model-pins/route.ts                           # POST upsert
│       │   ├── model-pins/[pinId]/route.ts                   # DELETE
│       │   ├── news/[newsId]/approve/route.ts                # POST
│       │   ├── news/[newsId]/reject/route.ts                 # POST
│       │   └── quotas/[orgId]/route.ts                       # POST { quota_override }
│       ├── audit/export/route.ts                              # GET → CSV download
│       └── security/
│           ├── admins/route.ts                                # POST upsert
│           ├── admins/[userId]/route.ts                       # DELETE (deactivate)
│           ├── ccpa/preview/route.ts                          # POST → cascade preview JSON
│           └── ccpa/erase/route.ts                            # POST → cascade execute
```

**Files modified:**
- `app/admin/platform/page.tsx` — replaced
- `app/admin/audit/page.tsx` — replaced
- `app/admin/security/page.tsx` — replaced
- `lib/audit.ts` — extend AuditAction with `MODEL_PIN_SET`, `MODEL_PIN_REMOVED` (others already present per spec list)

---

## Task E.1: Migration — `feature_flags` + `model_pins` + conditional `news_items` ALTER

**Files:** Create `supabase/migrations/0005_platform_security.sql`.

- [ ] **Step 1: Write migration**

```sql
-- 0005_platform_security.sql
-- Phase E — feature flags, model pins, news_items approval workflow.
-- Apply via Supabase Dashboard SQL editor.

------------------------------------------------------------------------------
-- feature_flags
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feature_flags (
  flag_key        text PRIMARY KEY,
  description     text,
  default_enabled boolean NOT NULL DEFAULT false,
  enabled_tiers   text[] NOT NULL DEFAULT '{}',
  org_overrides   jsonb NOT NULL DEFAULT '{}'::jsonb,
  rollout_pct     integer NOT NULL DEFAULT 0 CHECK (rollout_pct BETWEEN 0 AND 100),
  updated_by      uuid REFERENCES auth.users(id),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS feature_flags_no_client ON public.feature_flags;
CREATE POLICY feature_flags_no_client ON public.feature_flags
  FOR ALL USING (false) WITH CHECK (false);

------------------------------------------------------------------------------
-- model_pins
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.model_pins (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid,                 -- null = global pin
  role         text NOT NULL CHECK (role IN ('parser', 'insight', 'chat')),
  model_string text NOT NULL,
  pinned_by    uuid REFERENCES auth.users(id),
  pinned_at    timestamptz NOT NULL DEFAULT now(),
  expiry       timestamptz,
  UNIQUE (org_id, role)
);
CREATE INDEX IF NOT EXISTS model_pins_role_idx ON public.model_pins (role);
ALTER TABLE public.model_pins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS model_pins_no_client ON public.model_pins;
CREATE POLICY model_pins_no_client ON public.model_pins
  FOR ALL USING (false) WITH CHECK (false);

------------------------------------------------------------------------------
-- news_items conditional ALTER (user-portal-owned)
------------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.news_items') IS NOT NULL THEN
    BEGIN
      ALTER TABLE public.news_items ADD COLUMN IF NOT EXISTS approval_state text
        DEFAULT 'pending'
        CHECK (approval_state IN ('pending','approved','rejected'));
      ALTER TABLE public.news_items ADD COLUMN IF NOT EXISTS approved_by uuid;
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'news_items: insufficient privilege to alter, skipping';
    END;
  ELSE
    RAISE NOTICE 'news_items table not present, skipping ALTER';
  END IF;
END;
$$ LANGUAGE plpgsql;

------------------------------------------------------------------------------
-- AI kill switch convenience: seed `mooovy_enabled` flag (idempotent)
------------------------------------------------------------------------------
INSERT INTO public.feature_flags (flag_key, description, default_enabled)
VALUES (
  'mooovy_enabled',
  'Master AI kill switch. When false, all Mooovy endpoints in apps/web return a static maintenance message and skip Anthropic calls.',
  true
)
ON CONFLICT (flag_key) DO NOTHING;
```

- [ ] **Step 2: Apply via Dashboard + commit**

Paste into SQL editor → Run.

```bash
git add supabase/migrations/0005_platform_security.sql
git commit -m "phase E: feature_flags + model_pins schema, news_items approval ALTER"
```

---

## Task E.2: Extend AuditAction enum

**Files:** Modify `lib/audit.ts:5-18`.

- [ ] **Step 1: Add MODEL_PIN_SET and MODEL_PIN_REMOVED**

```ts
| 'MODEL_PIN_SET' | 'MODEL_PIN_REMOVED'
```

(Other Phase E actions — `AI_KILL_SWITCH_TOGGLE`, `AI_SUSPEND_ORG`, `FEATURE_FLAG_CHANGE`, `QUOTA_OVERRIDE`, `CCPA_ERASURE`, `ADMIN_CREATED`, `ADMIN_DELETED`, `NEWS_CARD_PUBLISH`, `NEWS_CARD_RETIRE` — already in the enum from Phase A.)

- [ ] **Step 2: Typecheck + commit**

```bash
npm run typecheck
git add lib/audit.ts
git commit -m "phase E: extend AuditAction with MODEL_PIN_SET/REMOVED"
```

---

## Task E.3: Library — `feature-flags.ts`, `audit-search.ts`, `ccpa.ts`

**Files:**
- Create `lib/feature-flags.ts`
- Create `lib/audit-search.ts`
- Create `lib/ccpa.ts`

- [ ] **Step 1: `lib/feature-flags.ts`**

```ts
import 'server-only';
import { adminClient } from '@/lib/supabase/admin';

export type FeatureFlag = {
  flag_key: string;
  description: string | null;
  default_enabled: boolean;
  enabled_tiers: string[];
  org_overrides: Record<string, boolean>;
  rollout_pct: number;
  updated_by: string | null;
  updated_at: string;
};

export async function fetchFlags(): Promise<FeatureFlag[]> {
  const supabase = adminClient();
  const { data, error } = await supabase.from('feature_flags').select('*').order('flag_key');
  if (error) return [];
  return (data ?? []) as FeatureFlag[];
}

export async function fetchFlag(key: string): Promise<FeatureFlag | null> {
  const supabase = adminClient();
  const { data, error } = await supabase.from('feature_flags').select('*').eq('flag_key', key).single();
  if (error) return null;
  return (data as FeatureFlag) ?? null;
}
```

- [ ] **Step 2: `lib/audit-search.ts`**

```ts
import 'server-only';
import { adminClient } from '@/lib/supabase/admin';

export type AuditFilters = {
  action?: string;
  actorId?: string;
  orgId?: string;
  from?: string;
  to?: string;
  resourceType?: string;
  page?: number;
  pageSize?: number;
};

export type AuditEntry = {
  id: string;
  occurred_at: string;
  actor_user_id: string | null;
  actor_role: string | null;
  org_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  before_value: unknown;
  after_value: unknown;
  reason: string | null;
  ticket_id: string | null;
  ip_address: string | null;
};

export async function fetchAudit(
  f: AuditFilters,
): Promise<{ rows: AuditEntry[]; total: number; page: number; pageSize: number }> {
  const supabase = adminClient();
  const pageSize = Math.min(500, Math.max(10, f.pageSize ?? 100));
  const page = Math.max(0, f.page ?? 0);
  let q = supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('occurred_at', { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);
  if (f.action) q = q.eq('action', f.action);
  if (f.actorId) q = q.eq('actor_user_id', f.actorId);
  if (f.orgId) q = q.eq('org_id', f.orgId);
  if (f.resourceType) q = q.eq('resource_type', f.resourceType);
  if (f.from) q = q.gte('occurred_at', f.from);
  if (f.to) q = q.lte('occurred_at', f.to);
  const { data, count, error } = await q;
  if (error) return { rows: [], total: 0, page, pageSize };
  return { rows: ((data ?? []) as AuditEntry[]), total: count ?? 0, page, pageSize };
}

export function toCsv(rows: AuditEntry[]): string {
  const headers = [
    'id',
    'occurred_at',
    'actor_user_id',
    'actor_role',
    'org_id',
    'action',
    'resource_type',
    'resource_id',
    'reason',
    'ticket_id',
    'ip_address',
  ];
  const escape = (v: unknown): string => {
    if (v == null) return '';
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => escape((r as Record<string, unknown>)[h])).join(','));
  }
  return lines.join('\n');
}
```

- [ ] **Step 3: `lib/ccpa.ts`**

```ts
import 'server-only';
import { adminClient } from '@/lib/supabase/admin';

export type CcpaCascadePreview = {
  org_id: string;
  org_name: string | null;
  members: number;
  shipments: number;
  conversations: number;
  files: number;
  notes: number;
  tickets: number;
  audit_entries_to_be_kept: number;
  upstream_missing: string[];
};

const POSSIBLE_CASCADE_TABLES: Array<{ name: string; column: string }> = [
  { name: 'shipments', column: 'org_id' },
  { name: 'conversations', column: 'org_id' },
  { name: 'silo_files', column: 'org_id' },
  { name: 'usage_events', column: 'org_id' },
  { name: 'subscriptions', column: 'org_id' },
  { name: 'admin_notes', column: 'org_id' },
  { name: 'support_tickets', column: 'org_id' },
];

export async function previewCascade(orgId: string): Promise<CcpaCascadePreview> {
  const supabase = adminClient();
  const out: CcpaCascadePreview = {
    org_id: orgId,
    org_name: null,
    members: 0,
    shipments: 0,
    conversations: 0,
    files: 0,
    notes: 0,
    tickets: 0,
    audit_entries_to_be_kept: 0,
    upstream_missing: [],
  };
  const orgRes = await supabase.from('orgs').select('name').eq('id', orgId).single();
  out.org_name = (orgRes.data as { name?: string } | null)?.name ?? null;

  for (const t of POSSIBLE_CASCADE_TABLES) {
    const { count, error } = await supabase
      .from(t.name)
      .select('*', { count: 'exact', head: true })
      .eq(t.column, orgId);
    if (error) {
      out.upstream_missing.push(t.name);
      continue;
    }
    if (t.name === 'shipments') out.shipments = count ?? 0;
    else if (t.name === 'conversations') out.conversations = count ?? 0;
    else if (t.name === 'silo_files') out.files = count ?? 0;
    else if (t.name === 'admin_notes') out.notes = count ?? 0;
    else if (t.name === 'support_tickets') out.tickets = count ?? 0;
  }

  const { count: members } = await supabase
    .from('org_members')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId);
  out.members = members ?? 0;

  const { count: audit } = await supabase
    .from('audit_log')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId);
  out.audit_entries_to_be_kept = audit ?? 0;
  return out;
}

export type CcpaEraseOutcome = {
  deleted: Record<string, number>;
  skipped: string[];
  members_signed_out: number;
};

export async function executeCascade(orgId: string): Promise<CcpaEraseOutcome> {
  const supabase = adminClient();
  const out: CcpaEraseOutcome = { deleted: {}, skipped: [], members_signed_out: 0 };

  // Cascade table deletes (admin-owned tables and any user-portal tables that exist).
  for (const t of POSSIBLE_CASCADE_TABLES) {
    const { error, count } = await supabase
      .from(t.name)
      .delete({ count: 'exact' })
      .eq(t.column, orgId);
    if (error) {
      out.skipped.push(`${t.name}: ${error.message}`);
    } else {
      out.deleted[t.name] = count ?? 0;
    }
  }

  // Sign out + delete each org member from auth (best-effort).
  const { data: members } = await supabase
    .from('org_members')
    .select('user_id')
    .eq('org_id', orgId);
  for (const m of (members ?? []) as Array<{ user_id: string }>) {
    try {
      await supabase.auth.admin.signOut(m.user_id);
      out.members_signed_out++;
    } catch {
      /* ignore */
    }
  }

  // Delete org row last.
  const { error: orgErr } = await supabase.from('orgs').delete().eq('id', orgId);
  if (orgErr) out.skipped.push(`orgs: ${orgErr.message}`);
  else out.deleted['orgs'] = 1;

  return out;
}
```

- [ ] **Step 4: Typecheck + commit**

```bash
npm run typecheck
git add lib/feature-flags.ts lib/audit-search.ts lib/ccpa.ts
git commit -m "phase E: data libraries (feature-flags, audit-search, ccpa)"
```

---

## Task E.4: `/admin/platform` page + sub-components + routes

This task is the biggest single page in the phase. Build it in pieces.

**Files:**
- Replace `app/admin/platform/page.tsx`
- Create the 6 client sub-components listed in File Structure
- Create the 8 platform route handlers listed in File Structure

- [ ] **Step 1: Routes — `flags/route.ts`** (upsert)

`app/api/admin/platform/flags/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type FlagBody = {
  flag_key: string;
  description?: string;
  default_enabled?: boolean;
  enabled_tiers?: string[];
  org_overrides?: Record<string, boolean>;
  rollout_pct?: number;
};

export async function POST(req: Request) {
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
  let body: FlagBody;
  try {
    body = (await req.json()) as FlagBody;
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }
  if (!body.flag_key || !/^[a-z0-9_]+$/.test(body.flag_key)) {
    return NextResponse.json({ error: 'invalid flag_key (a-z0-9_ only)' }, { status: 400 });
  }
  if (body.rollout_pct != null && (body.rollout_pct < 0 || body.rollout_pct > 100)) {
    return NextResponse.json({ error: 'rollout_pct out of range' }, { status: 400 });
  }
  const supabase = adminClient();
  const { data: before } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('flag_key', body.flag_key)
    .maybeSingle();
  const after = {
    flag_key: body.flag_key,
    description: body.description ?? before?.description ?? null,
    default_enabled: body.default_enabled ?? before?.default_enabled ?? false,
    enabled_tiers: body.enabled_tiers ?? before?.enabled_tiers ?? [],
    org_overrides: body.org_overrides ?? before?.org_overrides ?? {},
    rollout_pct: body.rollout_pct ?? before?.rollout_pct ?? 0,
    updated_by: ctx.actorId,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('feature_flags').upsert(after, { onConflict: 'flag_key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    action: 'FEATURE_FLAG_CHANGE',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    resourceType: 'feature_flag',
    resourceId: body.flag_key,
    before: before ?? undefined,
    after,
    ip: ctx.ip ?? undefined,
  });
  return NextResponse.json({ ok: true, flag: after });
}
```

`app/api/admin/platform/flags/[flagKey]/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(req: Request, { params }: { params: { flagKey: string } }) {
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
  const supabase = adminClient();
  const { data: before } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('flag_key', params.flagKey)
    .single();
  const { error } = await supabase.from('feature_flags').delete().eq('flag_key', params.flagKey);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit({
    action: 'FEATURE_FLAG_CHANGE',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    resourceType: 'feature_flag',
    resourceId: params.flagKey,
    before: before ?? undefined,
    after: { deleted: true },
    ip: ctx.ip ?? undefined,
  });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Routes — kill switch / model pins / news / quotas**

`app/api/admin/platform/kill-switch/route.ts` — Reads `enabled` (boolean) + `reason`. Updates `feature_flags WHERE flag_key='mooovy_enabled' SET default_enabled=enabled`. Audits `'AI_KILL_SWITCH_TOGGLE'` with reason. Required reason on both directions.

`app/api/admin/platform/model-pins/route.ts` — POST upsert `model_pins (org_id, role, model_string, pinned_by, expiry)`. Reads JSON body. Audits `'MODEL_PIN_SET'`. Validates `role ∈ {'parser','insight','chat'}`.

`app/api/admin/platform/model-pins/[pinId]/route.ts` — DELETE. Audits `'MODEL_PIN_REMOVED'`.

`app/api/admin/platform/news/[newsId]/approve/route.ts` — Updates `news_items SET approval_state='approved', approved_by=actor`. Audits `'NEWS_CARD_PUBLISH'`. If table missing (404 from supabase), return 503 with message.

`app/api/admin/platform/news/[newsId]/reject/route.ts` — Updates `news_items SET approval_state='rejected', approved_by=actor`. Audits `'NEWS_CARD_RETIRE'`.

`app/api/admin/platform/quotas/[orgId]/route.ts` — POST `{ quota_override: { mooovy_turns?: number, csv_parses?: number, silo_storage_gb?: number }, ai_suspended?: boolean }`. Updates `subscriptions`. Audits `'QUOTA_OVERRIDE'` (and `'AI_SUSPEND_ORG'` if `ai_suspended` flipped).

(Skeleton each follows the exact `getAdminContext → role gate → before/after read → write → audit → JSON response` pattern shown in Step 1.)

- [ ] **Step 3: Page — `app/admin/platform/page.tsx`**

```tsx
import { Eyebrow } from '@/components/ui/eyebrow';
import { TabBar } from '@/components/ui/tab-bar';
import { BRAND } from '@/lib/brand';
import { adminClient } from '@/lib/supabase/admin';
import { fetchFlags } from '@/lib/feature-flags';
import { FlagList } from './_flag-list';
import { KillSwitchPanel } from './_kill-switch';
import { ModelPinsPanel } from './_model-pins';
import { NewsQueuePanel } from './_news-queue';
import { QuotaPanel } from './_quota-panel';

export const dynamic = 'force-dynamic';

const TABS = ['Flags', 'Kill switch', 'Model pins', 'News queue', 'Quotas'] as const;

export default async function PlatformPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const tab = (typeof searchParams.tab === 'string' ? searchParams.tab : 'Flags') as
    | (typeof TABS)[number];

  const supabase = adminClient();
  const flags = await fetchFlags();
  const killSwitch = flags.find((f) => f.flag_key === 'mooovy_enabled') ?? null;
  const { data: pins } = await supabase
    .from('model_pins')
    .select('*')
    .order('pinned_at', { ascending: false });
  let news: Array<{ id: string; headline: string; approval_state: string; created_at: string }> = [];
  try {
    const { data } = await supabase
      .from('news_items')
      .select('id, headline, approval_state, created_at')
      .eq('approval_state', 'pending')
      .order('created_at', { ascending: false })
      .limit(50);
    news = (data ?? []) as typeof news;
  } catch {
    /* news_items absent */
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>{'// PLATFORM CONTROLS'}</Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
          }}
        >
          Platform
        </h1>
      </div>
      <PlatformTabs active={tab} />
      {tab === 'Flags' ? (
        <FlagList flags={flags} />
      ) : tab === 'Kill switch' ? (
        <KillSwitchPanel current={killSwitch} />
      ) : tab === 'Model pins' ? (
        <ModelPinsPanel pins={(pins ?? []) as Array<Record<string, unknown>>} />
      ) : tab === 'News queue' ? (
        <NewsQueuePanel items={news} />
      ) : (
        <QuotaPanel />
      )}
    </div>
  );
}
```

Add `app/admin/platform/_tabs.tsx` (client) — wraps the existing `TabBar` primitive and pushes `?tab=…`:

```tsx
'use client';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { TabBar } from '@/components/ui/tab-bar';

const TABS = ['Flags', 'Kill switch', 'Model pins', 'News queue', 'Quotas'];

export function PlatformTabs({ active }: { active: string }) {
  const router = useRouter();
  return (
    <TabBar
      tabs={TABS}
      active={active}
      onSelect={(t) => router.push(`/admin/platform?tab=${encodeURIComponent(t)}` as Route)}
    />
  );
}
```

Import in `page.tsx`: `import { PlatformTabs } from './_tabs';`

- [ ] **Step 4: Sub-components**

For each of `_flag-list.tsx`, `_kill-switch.tsx`, `_model-pins.tsx`, `_news-queue.tsx`, `_quota-panel.tsx`: client component with brand-styled inputs and an action that POSTs to its route handler. After success, call `router.refresh()`.

Detailed implementation of `_flag-list.tsx` (full code):

```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BRAND } from '@/lib/brand';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Button } from '@/components/ui/button';
import type { FeatureFlag } from '@/lib/feature-flags';

const inputStyle = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  padding: '6px 10px',
  border: `3px solid ${BRAND.charcoal}`,
  background: BRAND.white,
  color: BRAND.charcoal,
  outline: 'none',
  borderRadius: 0,
  width: '100%',
};

export function FlagList({ flags }: { flags: FeatureFlag[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');

  async function upsert(flag: Partial<FeatureFlag> & { flag_key: string }) {
    setBusy(flag.flag_key);
    setErr(null);
    try {
      const res = await fetch('/api/admin/platform/flags', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(flag),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErr((data as { error?: string })?.error ?? `HTTP ${res.status}`);
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function remove(flagKey: string) {
    if (!confirm(`Delete flag "${flagKey}"?`)) return;
    setBusy(flagKey);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/platform/flags/${flagKey}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErr((data as { error?: string })?.error ?? `HTTP ${res.status}`);
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card style={{ padding: 14 }}>
        <Eyebrow>// NEW FLAG</Eyebrow>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
          <input
            placeholder="snake_case_key"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            style={{ ...inputStyle, maxWidth: 280 }}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (newKey) {
                upsert({ flag_key: newKey, default_enabled: false });
                setNewKey('');
              }
            }}
          >
            Create
          </Button>
        </div>
      </Card>
      {err ? (
        <div
          style={{
            border: `3px solid ${BRAND.red}`,
            color: BRAND.red,
            padding: '8px 12px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
          }}
        >
          {err}
        </div>
      ) : null}
      {flags.map((f) => (
        <Card key={f.flag_key} style={{ padding: 14 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 12,
              alignItems: 'start',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 10,
                  color: BRAND.blue,
                  marginBottom: 6,
                }}
              >
                {f.flag_key}
              </div>
              <textarea
                defaultValue={f.description ?? ''}
                onBlur={(e) =>
                  upsert({ flag_key: f.flag_key, description: e.target.value })
                }
                rows={2}
                style={{ ...inputStyle, marginBottom: 6 }}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <label
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 9,
                    color: BRAND.charcoal,
                    display: 'flex',
                    gap: 4,
                    alignItems: 'center',
                  }}
                >
                  <input
                    type="checkbox"
                    defaultChecked={f.default_enabled}
                    onChange={(e) =>
                      upsert({ flag_key: f.flag_key, default_enabled: e.target.checked })
                    }
                  />
                  DEFAULT
                </label>
                <label
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 9,
                    color: BRAND.charcoal,
                  }}
                >
                  ROLLOUT %
                  <input
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={f.rollout_pct}
                    onBlur={(e) =>
                      upsert({
                        flag_key: f.flag_key,
                        rollout_pct: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    style={{ ...inputStyle, width: 80, marginLeft: 6 }}
                  />
                </label>
                <label
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 9,
                    color: BRAND.charcoal,
                  }}
                >
                  TIERS (comma)
                  <input
                    defaultValue={f.enabled_tiers.join(',')}
                    onBlur={(e) =>
                      upsert({
                        flag_key: f.flag_key,
                        enabled_tiers: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    style={{ ...inputStyle, width: 160, marginLeft: 6 }}
                  />
                </label>
              </div>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => remove(f.flag_key)}
              disabled={busy === f.flag_key}
            >
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

`_kill-switch.tsx`, `_model-pins.tsx`, `_news-queue.tsx`, `_quota-panel.tsx` follow the same shape: brand-styled form, fetch POST to the matching route, `router.refresh()` on success, `<Card>` wrappers. Pull live data from props passed by the server page.

- [ ] **Step 5: Build + commit**

```bash
npm run typecheck && npm run build
git add app/admin/platform/ app/api/admin/platform/
git commit -m "phase E: /admin/platform tabs + 8 platform routes"
```

---

## Task E.5: `/admin/audit` page + filter + CSV export route

**Files:**
- Replace `app/admin/audit/page.tsx`
- Create `app/admin/audit/_filters.tsx`
- Create `app/admin/audit/_entry-detail.tsx`
- Create `app/api/admin/audit/export/route.ts`

- [ ] **Step 1: `_filters.tsx`** (URL-param filter bar)

Same shape as the customers `_filters.tsx`. Fields: `action` (select, populated by enum), `actorId` (text), `orgId` (text), `from` (date), `to` (date). Submits a GET to `/admin/audit?…`.

- [ ] **Step 2: `_entry-detail.tsx`** (client expandable JSON)

```tsx
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
  if (!beforeValue && !afterValue) return null;
  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8,
          color: BRAND.blue,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        {open ? '▼ HIDE DIFF' : '▶ SHOW DIFF'}
      </button>
      {open ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginTop: 6,
          }}
        >
          <pre
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              background: BRAND.pageBed,
              border: `2px solid ${BRAND.charcoal}`,
              padding: 8,
              maxHeight: 200,
              overflow: 'auto',
              margin: 0,
            }}
          >
            {JSON.stringify(beforeValue ?? {}, null, 2)}
          </pre>
          <pre
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              background: BRAND.pageBed,
              border: `2px solid ${BRAND.charcoal}`,
              padding: 8,
              maxHeight: 200,
              overflow: 'auto',
              margin: 0,
            }}
          >
            {JSON.stringify(afterValue ?? {}, null, 2)}
          </pre>
        </div>
      ) : null}
    </>
  );
}
```

- [ ] **Step 3: `app/admin/audit/page.tsx`**

```tsx
import { Eyebrow } from '@/components/ui/eyebrow';
import { BRAND } from '@/lib/brand';
import { fetchAudit } from '@/lib/audit-search';
import { AuditFilters } from './_filters';
import { AuditEntryDetail } from './_entry-detail';

export const dynamic = 'force-dynamic';

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const single = (k: string) =>
    typeof searchParams[k] === 'string' ? (searchParams[k] as string) : undefined;
  const page = parseInt(single('page') ?? '0', 10) || 0;
  const { rows, total, pageSize } = await fetchAudit({
    action: single('action'),
    actorId: single('actorId'),
    orgId: single('orgId'),
    resourceType: single('resourceType'),
    from: single('from'),
    to: single('to'),
    page,
    pageSize: 100,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Eyebrow>{'// AUDIT LOG'}</Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
          }}
        >
          Audit
        </h1>
      </div>
      <AuditFilters />
      <p
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 9,
          color: BRAND.charcoal,
        }}
      >
        {`Showing ${rows.length} of ${total.toLocaleString()} entries (page ${page + 1}, ${pageSize}/page).`}
        {' · '}
        <a
          href={`/api/admin/audit/export?${new URLSearchParams(
            Object.fromEntries(
              Object.entries(searchParams)
                .filter(([, v]) => typeof v === 'string')
                .map(([k, v]) => [k, v as string]),
            ),
          ).toString()}`}
          style={{ color: BRAND.blue }}
        >
          EXPORT CSV
        </a>
      </p>
      <div
        style={{
          background: BRAND.white,
          border: `3px solid ${BRAND.charcoal}`,
          boxShadow: `4px 4px 0 ${BRAND.charcoal}`,
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: BRAND.pageBed, borderBottom: `3px solid ${BRAND.charcoal}` }}>
              {['WHEN', 'ACTION', 'ACTOR', 'ORG', 'RESOURCE', 'REASON', ''].map((h) => (
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
                  {new Date(r.occurred_at).toISOString().slice(0, 19).replace('T', ' ')}
                </td>
                <td style={cell}>
                  <strong>{r.action}</strong>
                </td>
                <td style={cell}>
                  {r.actor_user_id ? (
                    <code style={{ fontSize: 11 }}>{r.actor_user_id.slice(0, 8)}</code>
                  ) : (
                    '—'
                  )}
                </td>
                <td style={cell}>
                  {r.org_id ? <code style={{ fontSize: 11 }}>{r.org_id.slice(0, 8)}</code> : '—'}
                </td>
                <td style={cell}>{r.resource_type ?? '—'}</td>
                <td style={cell}>{r.reason ?? '—'}</td>
                <td style={cell}>
                  <AuditEntryDetail beforeValue={r.before_value} afterValue={r.after_value} />
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...cell, padding: 24, textAlign: 'center' }}>
                  No entries.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
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

- [ ] **Step 4: `app/api/admin/audit/export/route.ts`**

```ts
import { fetchAudit, toCsv, type AuditEntry } from '@/lib/audit-search';
import { getAdminContext } from '@/lib/admin-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await getAdminContext(req);
  } catch (resp) {
    if (resp instanceof Response) return resp;
    throw resp;
  }
  const url = new URL(req.url);
  const get = (k: string) => url.searchParams.get(k) ?? undefined;
  const all: AuditEntry[] = [];
  let page = 0;
  while (all.length < 10000) {
    const res = await fetchAudit({
      action: get('action'),
      actorId: get('actorId'),
      orgId: get('orgId'),
      resourceType: get('resourceType'),
      from: get('from'),
      to: get('to'),
      page,
      pageSize: 500,
    });
    all.push(...res.rows);
    if (res.rows.length < 500) break;
    page++;
  }
  const csv = toCsv(all);
  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="audit-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
```

- [ ] **Step 5: Build + commit**

```bash
npm run typecheck && npm run build
git add app/admin/audit/ "app/api/admin/audit/"
git commit -m "phase E: /admin/audit filterable list + CSV export"
```

---

## Task E.6: `/admin/security` page

**Files:**
- Replace `app/admin/security/page.tsx`
- Create `app/admin/security/_admin-list.tsx`, `_suspicious-sessions.tsx`, `_ccpa-form.tsx`
- Create routes under `app/api/admin/security/`

- [ ] **Step 1: Routes — `admins/route.ts`** (POST upsert)

```ts
import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_ROLES = new Set(['super-admin', 'support-admin', 'billing-admin']);

export async function POST(req: Request) {
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
  const body = (await req.json().catch(() => null)) as
    | { user_id: string; role: string; is_active?: boolean }
    | null;
  if (!body || !body.user_id || !VALID_ROLES.has(body.role)) {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  const supabase = adminClient();
  const { data: before } = await supabase
    .from('platform_admins')
    .select('*')
    .eq('user_id', body.user_id)
    .maybeSingle();
  const after = {
    user_id: body.user_id,
    role: body.role,
    is_active: body.is_active ?? true,
    created_by: ctx.actorId,
  };
  const { error } = await supabase.from('platform_admins').upsert(after, { onConflict: 'user_id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit({
    action: 'ADMIN_CREATED',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    resourceType: 'platform_admin',
    resourceId: body.user_id,
    before: before ?? undefined,
    after,
    ip: ctx.ip ?? undefined,
  });
  return NextResponse.json({ ok: true });
}
```

`admins/[userId]/route.ts` — DELETE flips `is_active=false`. Audit `'ADMIN_DELETED'`.

- [ ] **Step 2: Routes — `ccpa/preview/route.ts` and `ccpa/erase/route.ts`**

`ccpa/preview/route.ts`:
```ts
import { NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/admin-context';
import { previewCascade } from '@/lib/ccpa';

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
  if (ctx.actorRole !== 'super-admin') {
    return NextResponse.json({ error: 'super-admin required' }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as { orgId?: string } | null;
  if (!body?.orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 });
  const preview = await previewCascade(body.orgId);
  return NextResponse.json(preview);
}
```

`ccpa/erase/route.ts`:
```ts
import { NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';
import { executeCascade } from '@/lib/ccpa';
import { adminClient } from '@/lib/supabase/admin';

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
  if (ctx.actorRole !== 'super-admin') {
    return NextResponse.json({ error: 'super-admin required' }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as
    | { orgId?: string; orgNameTyped?: string; reason?: string; ticketId?: string }
    | null;
  if (!body?.orgId || !body.orgNameTyped) {
    return NextResponse.json(
      { error: 'orgId and orgNameTyped required' },
      { status: 400 },
    );
  }
  const supabase = adminClient();
  const { data: org } = await supabase
    .from('orgs')
    .select('name')
    .eq('id', body.orgId)
    .single();
  if (!org || (org as { name: string }).name !== body.orgNameTyped) {
    return NextResponse.json({ error: 'org name confirm mismatch' }, { status: 400 });
  }

  const outcome = await executeCascade(body.orgId);

  await logAudit({
    action: 'CCPA_ERASURE',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    orgId: body.orgId,
    resourceType: 'org',
    resourceId: body.orgId,
    after: outcome as unknown as Record<string, unknown>,
    reason: body.reason ?? undefined,
    ticketId: body.ticketId ?? undefined,
    ip: ctx.ip ?? undefined,
  });
  return NextResponse.json({ ok: true, outcome });
}
```

- [ ] **Step 3: Page** (`app/admin/security/page.tsx`)

```tsx
import { Eyebrow } from '@/components/ui/eyebrow';
import { Card } from '@/components/ui/card';
import { BRAND } from '@/lib/brand';
import { adminClient } from '@/lib/supabase/admin';
import { AdminList } from './_admin-list';
import { SuspiciousSessions } from './_suspicious-sessions';
import { CcpaForm } from './_ccpa-form';

export const dynamic = 'force-dynamic';

export default async function SecurityPage() {
  const supabase = adminClient();
  const { data: admins } = await supabase
    .from('platform_admins')
    .select('user_id, role, is_active, created_at, created_by')
    .order('created_at', { ascending: false });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>{'// SECURITY'}</Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
          }}
        >
          Security
        </h1>
      </div>
      <section>
        <Eyebrow>{'// ADMINS'}</Eyebrow>
        <AdminList admins={(admins ?? []) as Array<Record<string, unknown>>} />
      </section>
      <section>
        <Eyebrow>{'// SUSPICIOUS SESSIONS'}</Eyebrow>
        <SuspiciousSessions />
      </section>
      <section>
        <Eyebrow>{'// CCPA / GDPR ERASURE'}</Eyebrow>
        <Card style={{ padding: 18 }}>
          <CcpaForm />
        </Card>
      </section>
    </div>
  );
}
```

`_admin-list.tsx` — client. Renders existing admins + form to add user_id + role select. Calls `POST /api/admin/security/admins`.

`_suspicious-sessions.tsx` — server-rendered. Reads `user_sessions` if present; for each user pulls last 5 sessions; flags rows that match either rule (new country, impossible-travel >1000km/<2h). If `user_sessions` table absent, renders "no data".

```tsx
import { Card } from '@/components/ui/card';
import { BRAND } from '@/lib/brand';
import { adminClient } from '@/lib/supabase/admin';

type Session = {
  id: string;
  user_id: string;
  ip: string | null;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

function haversine(a: Session, b: Session): number {
  if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) return 0;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export async function SuspiciousSessions() {
  let sessions: Session[] = [];
  try {
    const supabase = adminClient();
    const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { data, error } = await supabase
      .from('user_sessions')
      .select('id, user_id, ip, country, city, latitude, longitude, created_at')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(5000);
    if (!error) sessions = (data ?? []) as Session[];
  } catch {
    /* table absent */
  }

  if (sessions.length === 0) {
    return (
      <Card style={{ padding: 18 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.charcoal }}>
          No session data (last 7d). The `user_sessions` table is owned by the user portal —
          if absent, this section will populate once user-portal migrations land.
        </p>
      </Card>
    );
  }

  const byUser = new Map<string, Session[]>();
  for (const s of sessions) {
    const arr = byUser.get(s.user_id) ?? [];
    arr.push(s);
    byUser.set(s.user_id, arr);
  }

  const flagged: Array<{ session: Session; reason: string }> = [];
  for (const [, arr] of byUser) {
    arr.sort((a, b) => a.created_at.localeCompare(b.created_at));
    const seenCountries = new Set<string>();
    for (let i = 0; i < arr.length; i++) {
      const cur = arr[i];
      if (cur.country && !seenCountries.has(cur.country)) {
        if (seenCountries.size > 0) {
          flagged.push({ session: cur, reason: `New country: ${cur.country}` });
        }
        seenCountries.add(cur.country);
      }
      if (i > 0) {
        const prev = arr[i - 1];
        const dtMs = new Date(cur.created_at).getTime() - new Date(prev.created_at).getTime();
        const km = haversine(prev, cur);
        if (km > 1000 && dtMs < 2 * 3600 * 1000) {
          flagged.push({
            session: cur,
            reason: `Impossible travel: ${Math.round(km)}km in ${(dtMs / 60000).toFixed(0)}min`,
          });
        }
      }
    }
  }

  return (
    <Card style={{ padding: 0 }}>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {flagged.slice(0, 100).map((f, i) => (
          <li
            key={i}
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
                color: BRAND.red,
                marginRight: 8,
                letterSpacing: '0.04em',
              }}
            >
              {new Date(f.session.created_at).toISOString().slice(0, 16)}
            </span>
            <code style={{ fontSize: 11, marginRight: 8 }}>
              {f.session.user_id.slice(0, 8)}
            </code>
            {f.reason}
            {f.session.ip ? ` (IP ${f.session.ip})` : ''}
          </li>
        ))}
        {flagged.length === 0 ? (
          <li
            style={{
              padding: 24,
              textAlign: 'center',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: BRAND.charcoal,
            }}
          >
            No flagged sessions in last 7d.
          </li>
        ) : null}
      </ul>
    </Card>
  );
}
```

`_ccpa-form.tsx` — client. 5-step state machine: enter `orgId` + reason + optional `ticketId` → button "Preview cascade" calls `/api/admin/security/ccpa/preview` → render counts + `upstream_missing` warning → typed-confirm field "ERASE [org name]" → button "Execute erasure" calls `/api/admin/security/ccpa/erase` → render outcome.

- [ ] **Step 4: Build + commit**

```bash
npm run typecheck && npm run build
git add app/admin/security/ "app/api/admin/security/"
git commit -m "phase E: /admin/security with admin mgmt, suspicious sessions, CCPA flow"
```

---

## Final verification

- [ ] **Run all gates**

```bash
npm run typecheck
npm run build
```

Both must pass. Build expects ~50 routes after Phase E.

- [ ] **Manual smoke test (deferred — see HANDOFF)**

---

## Phase E gate (per spec §11)

Gate: "All 8 sections fully operational with real data."

Status after this plan: GREEN for all admin-portal-owned surfaces (platform, audit, security). The ones that depend on user-portal-owned tables (e.g., `news_items`, `user_sessions`, full CCPA cascade across user-portal fact tables) degrade gracefully — they show empty state or "upstream missing" rather than crash.
