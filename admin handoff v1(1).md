# ShippingCow Admin Portal — Developer Handoff
**Date:** May 6, 2026  
**Status:** UI complete, all mock data — needs Supabase + Next.js implementation  
**Companion docs required:** ShippingCow Master Build Prompt v1.0, Combined PRD v1.0  
**This doc wins** where it conflicts with those.

---

## 1. What exists today

`Admin Portal.html` is a **fully-designed, fully-interactive React prototype** of the complete admin portal UI. It runs in a single self-contained HTML file using Babel standalone. Every section, every modal, every interaction is built and pixel-accurate to the Shipping Cow brand guide.

**Do not redesign anything.** Convert this file into a Next.js 14 App Router application at `apps/admin` in the Turborepo monorepo, wiring each mock data constant to a real Supabase query.

---

## 2. Tech stack to implement

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 14+ (App Router), TypeScript | Separate app from `apps/web` |
| Styling | Tailwind CSS + inline styles | Match the prototype exactly — see §4 for brand tokens |
| Database | Supabase Postgres (shared with `apps/web`) | Admin uses `SUPABASE_SERVICE_ROLE_KEY` — server only, never browser |
| Auth | Supabase Auth + `platform_admins` table check | After auth, middleware checks `platform_admins`; not found → `/403` |
| Payments | Stripe Node SDK | Invoice history, retry, coupon, refund |
| State | React Query + Zustand | Same as `apps/web` |
| Monorepo | Turborepo — `apps/admin` | Shares `supabase/`, `packages/shared` |
| Deployment | Vercel (separate project) | `admin.shippingcow.com` — IP allowlist or Vercel Access Policy |

---

## 3. URL structure

| Section | URL | Priority |
|---|---|---|
| Dashboard | `/admin` | P0 |
| Customers | `/admin/customers` | P0 |
| Org drawer | `/admin/customers/[orgId]` (sheet overlay) | P0 |
| Revenue | `/admin/revenue` | P0 |
| Rate Cards | `/admin/reference` | P0 |
| Platform Controls | `/admin/platform` | P1 |
| Audit Log | `/admin/audit` | P0 |
| Security | `/admin/security` | P1 |
| Tickets | `/admin/tickets` | P0 |
| Ticket thread | `/admin/tickets/[ticketId]` | P0 |

---

## 4. Brand design system

Copy these **exactly** — do not deviate.

### Color tokens
```ts
export const BRAND = {
  blue:    '#0052C9',  // Primary — backgrounds, headers, active states
  yellow:  '#FEB81B',  // Action — CTAs, active nav indicator, highlights
  charcoal:'#1A202C',  // Frame — borders, shadows, text, sidebar bg
  pageBed: '#F4F7FF',  // Ground — page background
  midBlue: '#3A7FDE',  // Hover state for blue
  sky:     '#B0C8F0',  // Accents, muted text on dark bg
  amber:   '#E0A000',  // Warning, pressed, internal notes
  white:   '#FFFFFF',
  red:     '#D64545',  // Danger, errors, critical alerts
  green:   '#1A7A4A',  // Success, resolved, positive trend
  teal:    '#0D9488',  // Expansion MRR line
};
```

### Typography
```
Headlines:  'Black Han Sans', sans-serif — 400 weight, UPPERCASE, 1.0–1.1 line-height
Body:       'DM Sans', sans-serif — 400/500/700 weight
Labels/meta:'Press Start 2P', monospace — 8–11px max, UPPERCASE, +0.04–0.08em tracking
```
Google Fonts import:
```html
<link href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=DM+Sans:wght@400;500;700&family=Press+Start+2P&display=swap" rel="stylesheet">
```

### Component rules
- **Zero border-radius** everywhere — `border-radius: 0` on all elements including buttons and inputs
- **3px charcoal border** on all cards, inputs, buttons: `border: 3px solid #1A202C`
- **4px pixel shadow** on cards and primary buttons: `box-shadow: 4px 4px 0 #1A202C`
- **2px pixel shadow** (small): `box-shadow: 2px 2px 0 #1A202C`
- Hover state on interactive cards/buttons: shadow collapses + `transform: translate(2px, 2px)`

### Shared components (already built in prototype, extract to `packages/shared/ui/`)
| Component | Props | Notes |
|---|---|---|
| `<Badge type="tier" value="calf|cow|bull">` | — | Pixel-shadow badge |
| `<Badge type="status" value="active|suspended|deactivated|payment_failed">` | — | — |
| `<SeverityBadge level="critical|high|medium|low|warning|opportunity">` | — | — |
| `<Btn variant="primary|blue|ghost|danger|dark" size="sm|md|lg">` | — | Press-down hover effect |
| `<Eyebrow>` | — | Press Start 2P label |
| `<Card onClick?>` | — | Pixel shadow, press-down if clickable |
| `<TrendArrow value={number}>` | — | ▲ green / ▼ red |
| `<TabBar tabs active onSelect>` | — | Yellow underline on active |

---

## 5. Section-by-section data contracts

### 5.1 Dashboard (`/admin`)

**KPI bar** — 6 metric cards. Query:
```sql
-- MRR
SELECT SUM(mrr) FROM subscriptions WHERE status = 'active';
-- Active orgs
SELECT COUNT(*) FROM orgs WHERE status = 'active';
-- New signups (30d)
SELECT COUNT(*) FROM orgs WHERE created_at >= now() - interval '30 days';
-- Calf→Cow conversion (30d)
SELECT
  COUNT(*) FILTER (WHERE event_type = 'upgrade') AS upgrades,
  COUNT(*) FILTER (WHERE event_type = 'calf_signup') AS signups
FROM subscription_events WHERE created_at >= now() - interval '30 days';
-- Churn risk
SELECT COUNT(*) FROM mv_org_cost_summary
WHERE last_upload_at < now() - interval '30 days' AND status = 'active';
-- Failed payments
SELECT COUNT(*) FROM subscriptions WHERE status = 'payment_failed';
```

**MRR chart** — 12-month trailing. Source: `subscription_events` grouped by month, summing `new_mrr`, `expansion_mrr`, `churned_mrr`.

**Alert queue** — source: `alerts` table (new table, see §7.2). Ordered by `severity_order ASC, created_at DESC`. Severity order: critical=1, high=2, medium=3, low=4.

**Platform health tiles** — 4 tiles, all read-only:
- Mooovy API: query Edge Function logs or a `api_health_snapshots` table updated by a cron
- AI spend today: query Anthropic usage log table `ai_usage_events` WHERE date = today
- Edge Function error rate: from `edge_fn_error_log` 
- Stripe webhooks: from `stripe_webhook_log`

---

### 5.2 Customers (`/admin/customers`)

**Org list table columns:**
```ts
type OrgRow = {
  id: string;
  name: string;
  tier: 'calf' | 'cow' | 'bull';
  mrr: number;           // from subscriptions.mrr
  members: number;       // COUNT org_members WHERE org_id
  shipments_30d: number; // from mv_org_cost_summary
  last_active: string;   // MAX(last_login) across org_members
  status: 'active' | 'suspended' | 'deactivated' | 'payment_failed';
  origin_zip: string;
  health_score: number;  // 0–100, computed field
}
```

Query (server component):
```sql
SELECT
  o.id, o.name, o.status, o.origin_zip,
  s.tier, s.mrr, s.status AS sub_status,
  COUNT(om.id) AS members,
  COALESCE(mv.shipment_count_30d, 0) AS shipments_30d,
  MAX(om.last_login) AS last_active
FROM orgs o
JOIN subscriptions s ON s.org_id = o.id
LEFT JOIN org_members om ON om.org_id = o.id
LEFT JOIN mv_org_cost_summary mv ON mv.org_id = o.id
GROUP BY o.id, s.id, mv.org_id
ORDER BY s.mrr DESC;
```

**Filters:** tier, status, churn risk (0 shipments 30d), date range, free text (org name, owner email, origin ZIP). Implement as URL search params so filters are shareable.

**Org Drawer** — right-side sheet (720px). 5 tabs:

| Tab | Data source |
|---|---|
| OVERVIEW | `orgs`, `subscriptions`, `admin_notes` |
| MEMBERS | `org_members` JOIN `auth.users`, sessions from Supabase Auth |
| ACTIVITY | `user_activity_log` WHERE org_id = ? ORDER BY created_at DESC, paginated 50/page |
| BILLING | Stripe API: `customers.retrieve`, `invoices.list`, `paymentMethods.list` |
| AUDIT | `audit_log` WHERE org_id = ? ORDER BY occurred_at DESC LIMIT 100 |

**Quick actions** (all require `assertAdminRole`):

| Action | API route | Min role | Audit logged |
|---|---|---|---|
| Suspend org | `POST /api/admin/orgs/[id]/suspend` | support-admin | ✓ with reason |
| Reactivate org | `POST /api/admin/orgs/[id]/reactivate` | support-admin | ✓ |
| Deactivate org | `POST /api/admin/orgs/[id]/deactivate` | super-admin | ✓ with reason |
| Override tier | `POST /api/admin/orgs/[id]/tier-override` | super-admin | ✓ full diff |
| Impersonate owner | `POST /api/admin/users/[id]/impersonate` | support-admin | ✓ |
| Force logout all | `POST /api/admin/orgs/[id]/force-logout` | support-admin | ✓ |
| CCPA erasure | `POST /api/admin/orgs/[id]/erase` | super-admin | ✓ timestamped |

**Impersonation flow** (critical — read carefully):
1. Admin selects reason from fixed list + optional ticket ID
2. Confirmation modal shown
3. Server generates short-lived impersonation token, stores in `impersonation_sessions`
4. New tab opens `apps/web` with token in query param
5. `apps/web` middleware detects token → shows amber banner: `"Admin session active — [email] viewing. Expires in [countdown]"`
6. Session auto-expires 60 min, or admin clicks End Session
7. On end: audit log entry written with start/end/duration/reason

---

### 5.3 Revenue (`/admin/revenue`)

Metrics source: `subscription_events` table with `event_type` in (`new`, `expansion`, `churn`, `downgrade`).

**Conversion funnel** — 3 stages, period-filtered:
```sql
SELECT
  COUNT(*) FILTER (WHERE tier = 'calf' AND event_type = 'signup') AS calf_signups,
  COUNT(DISTINCT org_id) FILTER (WHERE event_type = 'first_upload') AS first_uploads,
  COUNT(*) FILTER (WHERE event_type = 'upgrade' AND from_tier = 'calf') AS upgraded_to_cow
FROM subscription_events
WHERE created_at >= now() - interval '30 days';
```

**Failed payment queue** — `SELECT * FROM subscriptions WHERE status = 'payment_failed' ORDER BY updated_at DESC`. Enrich with Stripe `decline_code` via Stripe API.

**Dunning state machine** — managed by Stripe + Edge Functions. Admin portal shows state and allows manual overrides. States: `grace` → `suspended` → `deactivated`. Days: 0, +3, +8, +15, +22, +52.

---

### 5.4 Reference Data (`/admin/reference`)

**Six tables** (all require `super-admin`):
- `zone_matrix` — ~42,000 rows. Use filterable table, not full grid. Primary edit path: bulk CSV import.
- `our_carrier_rates` — our negotiated rates per carrier/service/zone/weight band
- `carrier_retail_rates` — standard retail rates (benchmark)
- `our_warehousing_fees` — receiving, putaway, storage/cuft
- `our_logistics_fees` — returns, refurb, disposal, special handling
- `category_benchmarks` — peer cohort data per category (Bull only)

**Publish workflow — 4 steps (NEVER SKIP):**
1. **Edit** — inline spreadsheet editor (`react-data-grid`) or CSV import. Saved as draft in `rate_card_drafts`.
2. **Validate** — `POST /api/admin/reference/[table]/validate`. Checks: no duplicate keys, positive rates, no overlapping date ranges. Errors block publish; warnings allow with confirmation.
3. **Preview Impact** — `POST /api/admin/reference/[table]/preview-impact`. Dry-run: shows avg cost/shipment delta for top 10 orgs by volume.
4. **Publish** — `POST /api/admin/reference/[table]/publish`. Requires publish note. On publish:
   - Draft marked `live` with `effective_from = today`
   - Prior live version gets `effective_to = today - 1 day`
   - Calls `mv-refresh` Edge Function to rebuild `mv_org_cost_summary`, `mv_org_destination_distribution`
   - Full row diff written to `audit_log`

**Version history** — every table has version history tab. `View diff` shows side-by-side comparison. `Roll back` creates new draft (still requires full publish flow).

---

### 5.5 Platform Controls (`/admin/platform`)

**Feature flags** — `feature_flags` table. UI: table + per-flag drawer with per-org overrides.

```ts
type FeatureFlag = {
  flag_key: string;          // snake_case
  description: string;
  default_enabled: boolean;
  enabled_tiers: string[];   // ['cow', 'bull']
  org_overrides: Record<string, boolean>; // {org_id: true/false}
  rollout_pct: number;       // 0–100, deterministic hash
  updated_by: string;
  updated_at: string;
}
```

The user portal (`apps/web`) reads `feature_flags` on every page load. Use a 60-second client-side cache to avoid hammering the DB.

**AI Kill Switch** — `POST /api/admin/ai/kill-switch`. Sets a global `feature_flags` record `mooovy_enabled = false`. Requires reason. Red border when disabled — impossible to miss. All Mooovy endpoints in `apps/web` check this flag before calling Anthropic.

**AI per-org suspension** — `subscriptions.ai_suspended = true`. Mooovy chat endpoint checks this.

**Model pinning** — `model_pins` table. Mooovy chat endpoint checks `model_pins` (org-specific first, then global) before calling Anthropic. If no pin, uses default `claude-sonnet-4-20250514`.

**Insight feed** — AI-generated cards enter `news_items` with `approval_state = 'pending'`. Only `approved` cards appear in user feed. Admin approves/rejects from the review queue UI.

**Quotas** — `subscriptions.quota_override` JSONB. Per-org overrides for `mooovy_turns`, `csv_parses`, `silo_storage_gb`. UI shows usage bars from `usage_events` table.

---

### 5.6 Audit Log (`/admin/audit`)

Table: `audit_log`. **Append-only** — no deletes, no updates. RLS policy must prevent any DELETE or UPDATE even from service role.

```ts
type AuditEntry = {
  id: string;            // uuid
  occurred_at: string;   // server-generated
  actor_user_id: string;
  actor_role: string;    // 'super-admin' | 'support-admin' | 'billing-admin' | 'system'
  org_id?: string;
  action: string;        // SCREAMING_SNAKE_CASE — see list below
  resource_type: string; // 'user' | 'org' | 'subscription' | 'rate_card' | etc.
  resource_id: string;
  before_value?: object; // full record before change
  after_value?: object;  // full record after change
  reason?: string;       // required for destructive actions
  ticket_id?: string;
  ip_address: string;
}
```

**Action identifiers** (complete list):
`IMPERSONATE_USER`, `IMPERSONATE_USER_END`, `SUSPEND_ORG`, `REACTIVATE_ORG`, `DEACTIVATE_ORG`, `TIER_OVERRIDE`, `FORCE_LOGOUT_USER`, `RESET_MFA`, `TRANSFER_OWNERSHIP`, `CCPA_ERASURE`, `RATE_CARD_PUBLISH`, `RATE_CARD_ROLLBACK`, `NEWS_CARD_PUBLISH`, `NEWS_CARD_RETIRE`, `CONVERSATION_VIEW_START`, `CONVERSATION_VIEW_END`, `AI_KILL_SWITCH_TOGGLE`, `AI_SUSPEND_ORG`, `FEATURE_FLAG_CHANGE`, `QUOTA_OVERRIDE`, `COUPON_APPLIED`, `SUBSCRIPTION_CANCELLED`, `PAYMENT_RETRY`, `REFUND_INITIATED`, `ADMIN_CREATED`, `ADMIN_DELETED`, `TICKET_CREATED`, `TICKET_REPLIED`, `TICKET_STATUS_CHANGED`

UI: paginated 100/page, filters by actor/action/org/date range. Click row expands full before/after JSON diff. Export to CSV (max 10,000 rows).

Retention: 7 years. Monthly archival to cold storage (Supabase Storage) for entries older than 2 years.

---

### 5.7 Security (`/admin/security`)

**Suspicious session detection** — `user_sessions` table with `country`, `ip`, `city`. On each login, compare to prior sessions for that user. Flag if:
- New country not seen before for that user
- Two sessions from locations >1,000km apart within 2 hours ("impossible travel")

Flagged sessions appear in both the Security section and the Dashboard alert queue.

**CCPA/GDPR erasure** — guided 5-step workflow:
1. Admin enters request metadata (source, date, requestor email, ticket ID)
2. Cascade preview shown (shipment count, conversation count, file count)
3. Admin types `ERASE [org name]` to confirm
4. System deletes: auth record, org record, all fact tables, conversations, Silo files, insight subscriptions
5. Single `CCPA_ERASURE` audit entry written (this entry itself is NOT deleted)
6. Confirmation email sent to requestor

**Admin user management** — `platform_admins` table. Super-admin can create, deactivate, change role. All changes audit-logged. New admins receive one-time setup email.

---

### 5.8 Tickets (`/admin/tickets`)

New surface added during design — not in original PRD. Treat as P0.

**Schema** (new table `support_tickets`):
```sql
CREATE TABLE support_tickets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid REFERENCES orgs(id),
  user_id     uuid REFERENCES auth.users(id),
  subject     text NOT NULL,
  status      text DEFAULT 'open'  CHECK (status IN ('open','in_progress','resolved')),
  priority    text DEFAULT 'normal' CHECK (priority IN ('urgent','high','normal','low')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE ticket_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   uuid REFERENCES support_tickets(id) ON DELETE CASCADE,
  from_type   text CHECK (from_type IN ('user','admin','note')), -- 'note' = internal only
  author_id   uuid REFERENCES auth.users(id),
  body        text NOT NULL,
  created_at  timestamptz DEFAULT now()
);
```

RLS rules:
- Users can SELECT/INSERT on `support_tickets` WHERE `user_id = auth.uid()` and `org_id = their org`
- Users can SELECT `ticket_messages` WHERE `from_type != 'note'` (internal notes never visible to users)
- Admins (via service role) have full access

**User portal integration** (`apps/web`):
- Add "Support" link in user portal nav → opens ticket submission form
- Form fields: subject (required), description (required), screenshot upload (optional, stored in Supabase Storage `tickets/[ticket_id]/`)
- After submit: confirmation screen with ticket ID. User can view ticket status and thread in portal.
- When admin replies, trigger email notification to `user.email` via Resend/SendGrid
- Show "NEEDS REPLY" badge on admin side when last message is from user

**Admin UI** (already designed):
- Split-pane: ticket list (left 360px) + email-style thread (right)
- Reply tab vs. Internal Note tab — notes have `from_type = 'note'`, never shown to users
- Status workflow: Open → In Progress → Resolved (one-click cycling)
- Priority tags: Urgent / High / Normal / Low
- "Impersonate User" shortcut in thread header
- Org link → navigates to Customers drawer for that org
- Cmd+Enter keyboard shortcut to send

**API routes:**
```
GET  /api/admin/tickets          — list with filters (status, priority, search)
GET  /api/admin/tickets/[id]     — single ticket + full message thread
POST /api/admin/tickets/[id]/reply     — admin reply (from_type = 'admin')
POST /api/admin/tickets/[id]/note      — internal note (from_type = 'note')
PATCH /api/admin/tickets/[id]/status  — status change
PATCH /api/admin/tickets/[id]/priority — priority change

-- User-facing (apps/web):
POST /api/tickets                — create ticket (authenticated user)
GET  /api/tickets/[id]           — get own ticket thread (no internal notes)
```

---

## 6. Admin-specific Supabase client

```ts
// packages/shared/src/supabase/admin-client.ts
// SERVER ONLY — never import in client components
import { createClient } from '@supabase/supabase-js';

export const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // never NEXT_PUBLIC_
  { auth: { autoRefreshToken: false, persistSession: false } }
);
```

**CRITICAL:** `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. Import `adminClient` only in:
- Server Components (`async function Page()`)
- Route Handlers (`export async function POST(req)`)
- Never in `'use client'` components

---

## 7. New database tables required

### 7.1 Tables from PRD (not yet built)
```sql
-- Admin user registry
CREATE TABLE platform_admins (
  user_id    uuid REFERENCES auth.users(id) PRIMARY KEY,
  role       text CHECK (role IN ('super-admin','support-admin','billing-admin')),
  is_active  boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Feature flags
CREATE TABLE feature_flags (
  flag_key        text PRIMARY KEY,
  description     text,
  default_enabled boolean DEFAULT false,
  enabled_tiers   text[],
  org_overrides   jsonb DEFAULT '{}',
  rollout_pct     integer DEFAULT 0 CHECK (rollout_pct BETWEEN 0 AND 100),
  updated_by      uuid,
  updated_at      timestamptz DEFAULT now()
);

-- AI model version pins
CREATE TABLE model_pins (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid,            -- null = global
  role       text,            -- 'parser' | 'insight' | 'chat'
  model_string text NOT NULL,
  pinned_by  uuid,
  pinned_at  timestamptz DEFAULT now(),
  expiry     timestamptz
);

-- Internal per-org admin notes
CREATE TABLE admin_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid REFERENCES orgs(id),
  note       text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Impersonation session log
CREATE TABLE impersonation_sessions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id        uuid,
  target_user_id       uuid,
  org_id               uuid,
  reason               text,
  ticket_id            text,
  started_at           timestamptz DEFAULT now(),
  ended_at             timestamptz,
  suppress_notification boolean DEFAULT false
);

-- Rate card drafts
CREATE TABLE rate_card_drafts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name        text NOT NULL,
  draft_payload     jsonb NOT NULL,
  created_by        uuid,
  created_at        timestamptz DEFAULT now(),
  validation_result jsonb,
  impact_preview    jsonb,
  status            text DEFAULT 'draft' CHECK (status IN ('draft','published','discarded'))
);

-- Scheduled publishes
CREATE TABLE scheduled_publishes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name   text NOT NULL,
  draft_id     uuid REFERENCES rate_card_drafts(id),
  effective_from date NOT NULL,
  scheduled_by uuid,
  scheduled_at timestamptz DEFAULT now(),
  status       text DEFAULT 'pending' CHECK (status IN ('pending','published','cancelled'))
);

-- Append-only audit log
CREATE TABLE audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at   timestamptz DEFAULT now(),
  actor_user_id uuid,
  actor_role    text,
  org_id        uuid,
  action        text NOT NULL,
  resource_type text,
  resource_id   text,
  before_value  jsonb,
  after_value   jsonb,
  reason        text,
  ticket_id     text,
  ip_address    inet
);
-- RLS: no DELETE, no UPDATE — append-only enforced at policy level
CREATE POLICY audit_log_insert ON audit_log FOR INSERT WITH CHECK (true);
CREATE POLICY audit_log_select ON audit_log FOR SELECT USING (true); -- admin service role only

-- Support tickets (new, not in original PRD)
CREATE TABLE support_tickets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid REFERENCES orgs(id),
  user_id    uuid REFERENCES auth.users(id),
  subject    text NOT NULL,
  status     text DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  priority   text DEFAULT 'normal' CHECK (priority IN ('urgent','high','normal','low')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TABLE ticket_messages (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES support_tickets(id) ON DELETE CASCADE,
  from_type text CHECK (from_type IN ('user','admin','note')),
  author_id uuid REFERENCES auth.users(id),
  body      text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

### 7.2 Additions to existing tables
```sql
-- subscriptions
ALTER TABLE subscriptions ADD COLUMN quota_override jsonb;
ALTER TABLE subscriptions ADD COLUMN ai_suspended boolean DEFAULT false;
ALTER TABLE subscriptions ADD COLUMN tier_override jsonb;

-- orgs
ALTER TABLE orgs ADD COLUMN assigned_am_user_id uuid;

-- news_items
ALTER TABLE news_items ADD COLUMN approved_by uuid;
ALTER TABLE news_items ADD COLUMN approval_state text DEFAULT 'pending'
  CHECK (approval_state IN ('pending','approved','rejected'));
```

---

## 8. Auth middleware

```ts
// apps/admin/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return NextResponse.redirect(new URL('/login', req.url));

  // Check platform_admins table
  const { data: admin } = await supabase
    .from('platform_admins')
    .select('role, is_active')
    .eq('user_id', session.user.id)
    .single();

  if (!admin || !admin.is_active) {
    return NextResponse.redirect(new URL('/403', req.url));
  }

  // Enforce MFA
  const { data: factors } = await supabase.auth.mfa.listFactors();
  if (!factors?.totp?.length) {
    return NextResponse.redirect(new URL('/admin/setup-mfa', req.url));
  }

  // Attach role to headers for route handlers
  res.headers.set('x-admin-role', admin.role);
  return res;
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
```

---

## 9. Audit logging helper

```ts
// packages/shared/src/audit.ts
export async function logAudit({
  action, actorId, actorRole, orgId, resourceType, resourceId,
  before, after, reason, ticketId, ip
}: AuditParams) {
  await adminClient.from('audit_log').insert({
    action, actor_user_id: actorId, actor_role: actorRole,
    org_id: orgId, resource_type: resourceType, resource_id: resourceId,
    before_value: before, after_value: after,
    reason, ticket_id: ticketId, ip_address: ip,
  });
}
```

Call `logAudit(...)` at the END of every successful route handler. If the operation fails, do not log.

---

## 10. User portal integration points

The admin portal connects to `apps/web` through the shared Supabase database. Every change made in admin immediately affects what users see:

| Admin action | Effect on user portal |
|---|---|
| Rate card publish | Triggers `mv-refresh` Edge Function → `mv_org_cost_summary` rebuilds → all dashboard analytics update within 10 min |
| Tier override | Updates `subscriptions.tier_override` → `useTier()` hook in `apps/web` reads this on every authenticated request |
| Feature flag change | `feature_flags` table updated → `apps/web` reads on each page load (60s cache) |
| Org suspend | `subscriptions.status = 'suspended'` → `apps/web` checks on auth → shows suspension screen |
| News card approve | `news_items.approval_state = 'approved'` → user feed query picks up immediately |
| AI kill switch | `feature_flags.mooovy_enabled = false` → all Mooovy endpoints return static message |
| Ticket admin reply | `ticket_messages` row created → email sent to user via Resend → user portal thread updates |
| Impersonation start | Token stored → `apps/web` middleware detects → amber "Admin viewing" banner shown |

**Impersonation banner in `apps/web`** (needs to be built):
```tsx
// apps/web/components/ImpersonationBanner.tsx
// Check for active impersonation session on every page
// Show sticky amber banner at top: "Admin session active — [admin email] is viewing your account. Expires in [countdown]."
// Poll /api/impersonation/status every 30s
// Auto-dismiss when session ends
```

---

## 11. Build sequence

Build in this order. Each phase must be demonstrable before the next.

**Phase A — Foundation**
- [ ] Create `apps/admin` as Next.js 14 App Router project in Turborepo
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to admin env; create `packages/shared/src/supabase/admin-client.ts`
- [ ] Auth middleware (Supabase auth + `platform_admins` check + MFA redirect)
- [ ] Create `platform_admins` table; seed one super-admin row for founder
- [ ] Persistent sidebar layout (charcoal, 220px, collapsible to 60px icon rail)
- [ ] All 8 nav items pointing to placeholder pages
- [ ] Audit logging helper: `logAudit()`
- [ ] Topbar with breadcrumb, system status dot, date
- **Gate:** Founder logs into `admin.shippingcow.com`. Sees sidebar. Non-admin blocked at `/403`. Audit log table exists.

**Phase B — Reference Data** *(blocks user portal analytics)*
- [ ] Create all 6 reference tables + seed data (zone matrix, FedEx/UPS rates)
- [ ] `/admin/reference` — 6 table cards with status badges
- [ ] 4-step publish workflow (Edit → Validate → Preview Impact → Publish)
- [ ] `mv-refresh` Edge Function called on publish
- **Gate:** Founder can publish a rate card. `mv_org_cost_summary` refreshes. User dashboard shows updated numbers.

**Phase C — Customers + Tickets** *(core ops)*
- [ ] `/admin/customers` — org list with search/sort/filter
- [ ] Org drawer — all 5 tabs wired to real data
- [ ] Impersonation flow (both admin side + `apps/web` banner)
- [ ] Suspend/Reactivate/Tier Override actions with modals + audit logging
- [ ] Create `support_tickets` + `ticket_messages` tables
- [ ] `/admin/tickets` — split-pane list + thread
- [ ] Ticket submission form in `apps/web`
- [ ] Email notifications on admin reply
- **Gate:** Ops team can manage orgs, impersonate users, and respond to support tickets.

**Phase D — Revenue + Dashboard**
- [ ] `/admin/revenue` — all 6 metrics + funnel + failed payment queue
- [ ] Manual payment retry, coupon apply, subscription cancel
- [ ] `/admin` dashboard — KPI bar wired, MRR chart, alert queue, health tiles
- **Gate:** Finance team can see real revenue metrics and process failed payments.

**Phase E — Platform Controls + Audit + Security**
- [ ] `/admin/platform` — feature flags CRUD, AI kill switch, model pins, insight review queue, quotas, email templates
- [ ] `/admin/audit` — full log with expand/diff/export
- [ ] `/admin/security` — suspicious session detection, CCPA workflow, admin user management
- **Gate:** All 8 sections fully operational with real data.

---

## 12. Environment variables

```bash
# apps/admin/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...        # anon key for auth UI only
SUPABASE_SERVICE_ROLE_KEY=eyJ...            # NEVER expose to browser
STRIPE_SECRET_KEY=sk_live_...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_URL=https://admin.shippingcow.com
USER_PORTAL_URL=https://app.shippingcow.com # for impersonation redirects
RESEND_API_KEY=re_...                        # for ticket reply emails
```

---

## 13. Security rules (non-negotiable)

1. **All admin routes require MFA.** No exceptions. Enforce in middleware.
2. **Admin sessions expire after 8 hours of inactivity.** Set Supabase session timeout.
3. **Impersonation sessions expire after 60 minutes.** Enforce server-side, not just UI.
4. **Audit log is append-only.** No admin — including super-admin — can DELETE or UPDATE entries. Enforce via Postgres RLS trigger.
5. **`SUPABASE_SERVICE_ROLE_KEY` is server-only.** CI check: grep for this key in client bundles; fail build if found.
6. **Destructive actions require typed confirmation** (CCPA erasure) or reason modal (suspend, deactivate, AI kill switch).
7. **IP allowlist** at Vercel/Cloudflare level for `admin.shippingcow.com`. This is infra config, not app code.

---

## 14. What is NOT built yet (backlog)

- [ ] QBR generator (AI-powered quarterly business review draft from Mooovy)
- [ ] Conversation viewer (admin reading tenant Mooovy chats — requires privacy guardrail + tenant notification)
- [ ] Bull custom contract upload + custom MRR amount
- [ ] Dunning auto-advance Edge Function (currently manual in UI)
- [ ] ZIP prefix lookup tool in Zone Matrix editor
- [ ] Scheduled publish auto-trigger (cron Edge Function at midnight ET)
- [ ] Data export ZIP for right-to-portability requests
- [ ] AM assignment SLA tracking (alert fires >24h without AM assigned)
- [ ] Ticket assignment to specific admin
- [ ] Canned responses in ticket reply
- [ ] Ticket creation from alert panel (one-click "Create ticket for this org")
- [ ] Per-org Tickets tab in org drawer (filter `support_tickets` by `org_id`)

---

*Handoff generated May 6, 2026 from the Shipping Cow Admin Portal prototype.*  
*Design source of truth: `Admin Portal.html` in the `shipping cow admin` project.*
