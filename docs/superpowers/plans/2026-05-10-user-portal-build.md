# User-Portal Build — MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Phases use `## Phase N` H2 headers; tasks within each phase use checkbox (`- [ ]`) syntax for tracking. Convention matches `2026-05-07-phase-e-platform-audit-security.md`.

**Goal:** Convert HTML/JSX prototype in `userportal/` into a live Next.js user-portal at `app/(portal)/*`, write Supabase migrations 0006+ for the user-portal-owned tables admin code already references, and ship the customer-facing surfaces (signup, dashboard, silo ingest, daily insight, Mooovy chat, tier upgrade) in time for launch Mon 2026-06-08. **Scope is MVP only**; AM portal, workspace customization, advanced personalization, watchlist are deferred post-launch.

**Why now:** Admin app is code-complete and degrades gracefully when user-portal tables are absent — but every "amber/degraded" cell on `/admin/*` becomes "permanent gap" until user-portal lands. Day-1 customers need a working signup → upload → dashboard → upgrade flow. No portal = no real customers. See jayos `strategy/decisions-log.md` 2026-05-10 entry for the integration framing.

**Architecture:** User-portal lives in the same Next.js monorepo as admin. Routes under `app/(portal)/*` (route group, no URL prefix — i.e. `app/(portal)/dashboard/page.tsx` serves `/dashboard`). Separate middleware logic for portal vs admin (single `middleware.ts` continues to dispatch by path). Supabase Auth shared. Same `lib/supabase/{admin,server,browser}.ts` clients. Stripe integration shared with admin billing routes. Mooovy chat = Claude API direct (Anthropic SDK), not via admin layer. RLS gates per-org data by `subscriptions.tier`.

**Tech Stack:**
- Next.js 14.2.35 App Router (existing)
- React 18.3.1 (existing)
- @supabase/supabase-js 2.45.0 + auth-helpers-nextjs 0.10.0 (existing)
- Stripe 17.5.0 (existing) + Stripe Elements (NEW)
- @anthropic-ai/sdk (NEW — Mooovy chat)
- xlsx (NEW — silo XLSX parsing, browser-side, matches prototype)
- TypeScript 5.6.0 strict (existing)
- Tailwind 3.4.13 (existing)
- pytest-equivalent for TS: existing repo has no test runner — Phase 1 adds Vitest + Playwright

**Schema baseline confirmed:** `platform_admins`, `audit_log`, `feature_flags`, `model_pins`, `impersonation_sessions`, `support_tickets`, `ticket_messages` are CREATED (migrations 0001/0004/0005). All user-portal tables (`orgs`, `subscriptions`, `org_members`, `user_sessions`, `subscription_events`, `news_items`, `mv_org_cost_summary`, plus shipments/silo data) are MISSING. This plan creates them all.

---

## Assumptions (FLAG before executing)

| Assumption | Notes |
|---|---|
| Mon 2026-06-08 launch is real | If pushed further, repackage final phase into soft-launch + UAT week |
| MVP excludes AM portal | Per scope cut; AM functionality deferred to post-launch follow-on plan |
| MVP excludes workspace customization | Custom widget canvas + drag-drop deferred |
| MVP includes Calf, Cow, Bull tiers | Calf = 3mo audit; Cow = 12mo + Insight + Mooovy; Bull = unlimited + AM (AM portal NOT shipped, but Bull upgrade path exists) |
| Stripe key WILL be set before Phase 6 ships | Cofounder ops; blocks billing integration |
| Marketing site = homepage/ + landingpage/ HTML files converted to Next.js routes in this monorepo | Alternative deferred (separate static deploy) |
| Brand voice rule: admin + customer = same MOOOVY voice | Per jayos voice-guide.md 2026-05-10 admin↔customer rule |
| Mooovy uses Claude (Anthropic SDK), not admin's existing infra | Direct API calls from `(portal)/api/chat` route handlers |
| Anthropic API key + budget approved | Goes into `.env.local` as `ANTHROPIC_API_KEY` |
| Test infrastructure non-existent | Phase 1 introduces Vitest (unit) + Playwright (E2E); Phase 0 is install-only |

---

## Out of scope (deferred post-launch)

- AM portal (Portfolio Health, alert dashboard, QBR generator) — Bull-tier feature, can ship 30 days post-launch
- Workspace customization / custom widget canvas — Cow-tier delight feature, not blocker for $99 MRR upgrade
- Watchlist on zoning map — engagement loop, not signup-blocker
- Persona model nightly batch job — replaced in MVP with on-demand persona derivation at chat time
- Advanced export quota tracking with atomic decrement — MVP uses simple monthly counter, atomicity bug acceptable at <100 customers
- Real-time alerts (carrier outage, surcharge announcements) — manual operator-pushed via admin Daily Insight approval flow only
- Two-factor for end-users — Calf/Cow optional, Bull "enforced" deferred; Phase 1 wires the toggle but UI deferred
- Brand-typography decisions for marketing site — landing/homepage HTML converts as-is, deeper treatment post-launch

---

## File Structure

**Created:**

```
ShippingCowAdmin/
├── supabase/
│   └── migrations/
│       ├── 0006_user_portal_core.sql           # orgs, subscriptions, org_members
│       ├── 0007_user_sessions.sql              # session tracking + RLS
│       ├── 0008_shipments_silo.sql             # shipments, silo_files, persona
│       ├── 0009_subscription_events.sql        # event stream + mv_org_cost_summary
│       └── 0010_news_items.sql                 # news_items table (admin already ALTERs it conditionally)
├── lib/
│   ├── portal-context.ts                       # user-portal route auth context
│   ├── orgs.ts                                 # org CRUD helpers
│   ├── tier-gates.ts                           # tier enforcement (Calf/Cow/Bull)
│   ├── ingest/
│   │   ├── csv-parse.ts                        # canonical field mapper
│   │   ├── xlsx-parse.ts                       # XLSX → rows
│   │   ├── canonical-fields.ts                 # field schema, validators
│   │   └── shipment-insert.ts                  # batched insert w/ dedup
│   ├── metrics-portal.ts                       # SC_AGG-equivalent backend aggregations
│   ├── persona.ts                              # account persona derivation
│   ├── mooovy/
│   │   ├── client.ts                           # Anthropic SDK wrapper
│   │   ├── system-prompt.ts                    # MOOOVY voice system prompt + persona injection
│   │   ├── citations.ts                        # double-source rule enforcement
│   │   └── quota.ts                            # turn counting per tier
│   └── insights/
│       ├── feed-builder.ts                     # daily insight feed assembler
│       └── relevance-score.ts                  # personalization scoring
├── app/
│   ├── (portal)/
│   │   ├── layout.tsx                          # portal shell (sidebar, header, MOOOVY brand)
│   │   ├── signup/
│   │   │   └── page.tsx                        # signup form → audit invite
│   │   ├── audit/
│   │   │   └── page.tsx                        # post-signup audit upload prompt
│   │   ├── dashboard/
│   │   │   ├── page.tsx                        # main dashboard (period, pain points, zone chart, SKU table)
│   │   │   └── _components.tsx
│   │   ├── silo/
│   │   │   ├── page.tsx                        # silo file list
│   │   │   ├── upload/
│   │   │   │   └── page.tsx                    # uploader + column mapper
│   │   │   └── _components.tsx
│   │   ├── insight/
│   │   │   ├── page.tsx                        # daily insight feed
│   │   │   └── _components.tsx
│   │   ├── map/
│   │   │   ├── page.tsx                        # zoning map
│   │   │   └── _components.tsx
│   │   ├── mooovy/
│   │   │   ├── page.tsx                        # full-page chat
│   │   │   └── _components.tsx
│   │   ├── settings/
│   │   │   ├── page.tsx                        # account settings
│   │   │   ├── billing/page.tsx                # tier + payment method
│   │   │   ├── team/page.tsx                   # invite team (Cow+)
│   │   │   └── persona/page.tsx                # persona profile review
│   │   └── upgrade/
│   │       └── page.tsx                        # tier upgrade flow w/ Stripe
│   ├── api/
│   │   └── portal/
│   │       ├── ingest/
│   │       │   ├── upload/route.ts             # POST file → silo_files row
│   │       │   ├── parse/route.ts              # POST canonical mapping → shipments rows
│   │       │   └── delete/route.ts             # DELETE silo file + cascade
│   │       ├── shipments/
│   │       │   └── route.ts                    # GET shipments (RLS gated)
│   │       ├── insights/
│   │       │   └── route.ts                    # GET feed for current org
│   │       ├── chat/
│   │       │   ├── route.ts                    # POST → Claude → response
│   │       │   └── stream/route.ts             # streaming variant (post-MVP nice-to-have)
│   │       ├── billing/
│   │       │   ├── checkout/route.ts           # POST → Stripe Checkout session
│   │       │   ├── portal/route.ts             # POST → Stripe customer portal
│   │       │   └── webhook/route.ts            # Stripe webhook receiver
│   │       └── team/
│   │           ├── invite/route.ts             # POST invite (Cow+)
│   │           └── revoke/route.ts             # DELETE seat
│   ├── (marketing)/
│   │   ├── page.tsx                            # / — converted from homepage/*.html
│   │   ├── pricing/page.tsx
│   │   ├── how-it-works/page.tsx
│   │   └── landing/page.tsx                    # converted from landingpage/*.html
│   └── login/
│       └── page.tsx                            # MODIFIED — handle portal-user redirects
├── components/
│   └── portal/
│       ├── shell/
│       │   ├── Sidebar.tsx
│       │   ├── Header.tsx
│       │   └── TierBadge.tsx
│       ├── ui/
│       │   ├── PixelCow.tsx                    # ported from prototype components.jsx
│       │   ├── Barn.tsx                        # ported
│       │   ├── ZoneCostChart.tsx
│       │   ├── PainPointRow.tsx
│       │   └── SkuRow.tsx
│       ├── silo/
│       │   ├── Uploader.tsx
│       │   └── ColumnMapper.tsx
│       ├── insight/
│       │   └── InsightCard.tsx
│       ├── map/
│       │   └── StateGrid.tsx
│       └── mooovy/
│           ├── Chat.tsx
│           ├── Message.tsx
│           └── QuotaIndicator.tsx
├── tests/
│   ├── unit/
│   │   ├── ingest/
│   │   │   ├── csv-parse.test.ts
│   │   │   ├── canonical-fields.test.ts
│   │   │   └── shipment-insert.test.ts
│   │   ├── tier-gates.test.ts
│   │   ├── metrics-portal.test.ts
│   │   ├── mooovy/
│   │   │   ├── system-prompt.test.ts
│   │   │   ├── citations.test.ts
│   │   │   └── quota.test.ts
│   │   └── persona.test.ts
│   └── e2e/
│       ├── signup-flow.spec.ts
│       ├── silo-upload.spec.ts
│       ├── dashboard-tier-rls.spec.ts
│       ├── mooovy-chat.spec.ts
│       └── upgrade-flow.spec.ts
├── tests/fixtures/
│   ├── shipments-calf-3mo.csv
│   ├── shipments-cow-12mo.csv
│   ├── shipments-bull-3yr.csv
│   ├── shipments-malformed.csv
│   └── persona-seed.json
├── vitest.config.ts
├── playwright.config.ts
└── docs/superpowers/plans/
    └── 2026-05-10-user-portal-build.md         # this file
```

**Modified:**
- `middleware.ts` — add `(portal)` matcher + portal-specific auth dispatch
- `lib/audit.ts` — add new `AuditAction` types for user actions (e.g., `USER_SIGNUP`, `USER_UPGRADE`, `MOOOVY_QUOTA_EXCEEDED`)
- `app/login/page.tsx` — branch redirect by user type (admin → `/admin`, portal user → `/dashboard`)
- `package.json` — add `@anthropic-ai/sdk`, `xlsx`, `vitest`, `@playwright/test`, `@vitest/ui`, scripts
- `tailwind.config.ts` — add portal-specific tokens if needed (likely none, brand is unified per ui-tokens.md)
- `next.config.mjs` — confirm experimental.typedRoutes still on; route group layout works

**Not touched:**
- Admin app routes (`app/admin/*`) — unchanged
- Admin migrations 0001–0005 — unchanged
- Admin lib files (`lib/{customers,metrics,reference,...}.ts`) — unchanged. They already reference user-portal tables gracefully; once tables exist, admin "amber" cells go green automatically.
- jayos repo — only the cross-cutting decisions-log entry from prior session; no further jayos changes in this plan

---

## Phase 0 — Test infrastructure + Anthropic SDK + xlsx install

**Goal:** Repo currently has no test runner. Without tests, every later phase ships untestable. Install Vitest (unit), Playwright (E2E), Anthropic SDK, xlsx. Wire scripts. ~2 hours, no business logic.

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`, `playwright.config.ts`, `tests/unit/.gitkeep`, `tests/e2e/.gitkeep`

**Tasks:**
- [ ] Step 1: `npm install --save-dev vitest @vitest/ui @playwright/test --legacy-peer-deps` (legacy-peer-deps per HANDOFF eslint workaround)
- [ ] Step 2: `npm install --save @anthropic-ai/sdk xlsx --legacy-peer-deps`
- [ ] Step 3: Create `vitest.config.ts` with `tests/unit/**/*.test.ts` glob, jsdom environment for component tests, path alias `@/` → repo root
- [ ] Step 4: Create `playwright.config.ts` with `tests/e2e/**/*.spec.ts` glob, baseURL `http://localhost:3001`, projects: chromium-only for MVP
- [ ] Step 5: Add scripts to `package.json`: `"test"`, `"test:ui"`, `"test:e2e"`, `"test:e2e:ui"`
- [ ] Step 6: `npx playwright install chromium` (downloads browser binary)
- [ ] Step 7: Smoke test: `npm test` (no tests yet, should exit 0 with "no tests found")
- [ ] Step 8: Commit: `chore(portal): install test infra (vitest + playwright) + Anthropic SDK + xlsx`

---

## Phase 1 — Schema migrations 0006–0010

**Goal:** Create every user-portal-owned table admin already references, plus shipments/silo data tables. RLS policies gate by `subscriptions.tier`. Idempotent (`IF NOT EXISTS`, `to_regclass` guards) per repo convention.

**Files:**
- Create: `supabase/migrations/0006_user_portal_core.sql`
- Create: `supabase/migrations/0007_user_sessions.sql`
- Create: `supabase/migrations/0008_shipments_silo.sql`
- Create: `supabase/migrations/0009_subscription_events.sql`
- Create: `supabase/migrations/0010_news_items.sql`
- Create: `tests/unit/migrations/idempotency.test.ts` (lint-only — read each .sql, assert `IF NOT EXISTS` present on every CREATE)

**Tasks:**

- [ ] Step 1: `0006_user_portal_core.sql` — create:
  - `orgs (id uuid pk, name text not null, origin_zip text, status text default 'active', created_at timestamptz default now())`
  - `subscriptions (id uuid pk, org_id uuid fk → orgs, tier text check in ('calf','cow','bull'), mrr numeric default 0, status text default 'trialing', stripe_subscription_id text, current_period_start timestamptz, current_period_end timestamptz, quota_override jsonb default '{}', created_at timestamptz)`
  - `org_members (id uuid pk, org_id uuid fk, user_id uuid fk → auth.users, role text check in ('owner','admin','member'), invited_by uuid, last_login timestamptz, created_at timestamptz)`
  - RLS: `org_members` user can only see their own orgs. `subscriptions` user can read where `org_id IN (their orgs)`. `orgs` user can read where they are member.
- [ ] Step 2: Test 0006 idempotency — run twice in psql, second run = no-op, no error
- [ ] Step 3: `0007_user_sessions.sql` — create `user_sessions (id uuid pk, user_id uuid fk, org_id uuid fk, ip text, country text, city text, latitude numeric, longitude numeric, device_info jsonb, created_at timestamptz, last_activity timestamptz)`. RLS: user reads own sessions; super-admin reads all (admin/security page).
- [ ] Step 4: `0008_shipments_silo.sql` — create:
  - `silo_files (id uuid pk, org_id uuid fk, filename text, uploaded_by uuid, uploaded_at timestamptz, row_count int, status text check in ('parsing','mapped','ingested','error'), error_message text, file_size_bytes bigint, storage_path text)`
  - `shipments (id uuid pk, org_id uuid fk, silo_file_id uuid fk, sku text, category text, ship_date date, packages_shipped int default 1, cost_per_package numeric, length_in numeric, width_in numeric, height_in numeric, actual_weight_lb numeric, billable_weight_lb numeric, dim_weight numeric, origin_zip text, destination_zip text, zone int, dim_overcharge_usd numeric, total_row_cost numeric, sc_cost numeric, sc_saving numeric, carrier text, selling_platform text, raw_row jsonb, created_at timestamptz)`
  - `personas (org_id uuid pk fk, business_type text, primary_carriers text[], avg_monthly_volume int, top_sku_categories text[], preferred_zones int[], news_interests text[], mooovy_tone_pref text default 'concise', updated_at timestamptz)`
  - RLS: `shipments`, `silo_files`, `personas` — user reads where `org_id IN (their orgs)`.
- [ ] Step 5: Index design — `CREATE INDEX ON shipments(org_id, ship_date)`, `CREATE INDEX ON shipments(org_id, sku)`, `CREATE INDEX ON shipments(org_id, zone)`. Verify EXPLAIN on representative dashboard query uses indexes.
- [ ] Step 6: `0009_subscription_events.sql` — create `subscription_events (id uuid pk, org_id uuid fk, event_type text check in ('signup','tier_upgrade','tier_downgrade','churn','reactivation','quota_exceeded','payment_failed'), old_tier text, new_tier text, mrr_delta numeric, occurred_at timestamptz, source text)`. PLUS materialized view `mv_org_cost_summary` (refreshed nightly via cron edge fn) — fields: `org_id, period_start, period_end, total_shipments, total_cost, total_saving, avg_zone, dim_overcharge_total`. Refresh function `refresh_mv_org_cost_summary()` already exists as stub (migration 0003); REPLACE that function with real implementation.
- [ ] Step 7: `0010_news_items.sql` — create `news_items (id uuid pk, source text, url text, headline text, summary text, category text check in ('carrier','platform','trade','logistics','tips','your_data'), severity text check in ('critical','warning','opportunity','info'), published_at timestamptz, approval_state text default 'pending' check in ('pending','approved','rejected'), approved_by uuid, approved_at timestamptz, created_at timestamptz)`. RLS: portal users read where `approval_state='approved'`; admins read all.
- [ ] Step 8: Apply migrations 0006–0010 to dev Supabase project (NOT production yet — that gates on cofounder applying 0002–0005 first). Verify via SQL: `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`.
- [ ] Step 9: Verify admin's "amber/degraded" cells flip green: run `npm run dev`, sign in as admin, visit `/admin/customers` and `/admin`. KPIs that previously showed `—` for missing tables should now show `0` (no orgs yet) instead of `—` (table missing).
- [ ] Step 10: Commit: `feat(portal): migrations 0006-0010 — orgs, sessions, shipments, events, news`

---

## Phase 2 — Auth + portal middleware + portal-context lib

**Goal:** Wire auth so a user signing in lands on `/dashboard` (portal user) or `/admin` (admin user) based on whether they have a `platform_admins` row. Create `lib/portal-context.ts` that route handlers use to get `{ userId, orgId, role, tier }`. RLS-test the gates.

**Files:**
- Modify: `middleware.ts`
- Modify: `app/login/page.tsx`
- Create: `lib/portal-context.ts`
- Create: `lib/orgs.ts`
- Create: `lib/tier-gates.ts`
- Create: `tests/unit/tier-gates.test.ts`
- Create: `tests/e2e/signup-flow.spec.ts` (skeleton, fully populated Phase 7)

**Tasks:**

- [ ] Step 1: Test-first — `tests/unit/tier-gates.test.ts` defines: `canViewHistoricalShipments(tier, monthsBack)` → Calf=3, Cow=12, Bull=∞. `mooovyTurnLimit(tier)` → Calf=50, Cow=300, Bull=∞. `siloStorageLimitMB(tier)` → Calf=50, Cow=200, Bull=∞. `canExport(tier)` → Calf=false, Cow+Bull=true. Write failing tests.
- [ ] Step 2: Implement `lib/tier-gates.ts` with the helpers. Tests pass.
- [ ] Step 3: Implement `lib/orgs.ts` — `getCurrentOrg(userId)` returns the user's primary org (first `org_members` row by `created_at`). `getOrgTier(orgId)` returns subscription tier with fallback to `'calf'` for trialing.
- [ ] Step 4: Implement `lib/portal-context.ts` — `getPortalContext(req)` returns `{ userId, orgId, role, tier, ip }`. Used by every portal route handler.
- [ ] Step 5: Modify `middleware.ts` — add `'/dashboard'`, `'/silo/:path*'`, `'/insight'`, `'/map'`, `'/mooovy'`, `'/settings/:path*'`, `'/upgrade'`, `'/api/portal/:path*'` to matcher. Auth check: if no session → `/login`. If admin → continue (unchanged admin flow). If portal user but `platform_admins` row exists → it's still an admin; treat as such. Set `x-org-id` and `x-user-tier` headers.
- [ ] Step 6: Modify `app/login/page.tsx` — after successful auth, look up: admin first (existing flow). If not admin, look up `org_members` for the user. If found, redirect `/dashboard`. If neither, redirect `/signup` to onboard.
- [ ] Step 7: E2E skeleton at `tests/e2e/signup-flow.spec.ts` — empty `test.skip()` placeholders for "new user → signup → dashboard". Fully implemented Phase 7.
- [ ] Step 8: Smoke test: typecheck + build + npm test. Commit: `feat(portal): auth middleware + portal-context lib + tier gates`

---

## Phase 3 — Silo + ingest pipeline

**Goal:** Customer can upload CSV/XLSX of shipments, map columns to canonical fields, see preview, ingest into `shipments` table. Calf-tier gate: max 3mo history visible after ingest (older rows still stored, just RLS-filtered on read).

**Files:**
- Create: `lib/ingest/canonical-fields.ts`
- Create: `lib/ingest/csv-parse.ts`
- Create: `lib/ingest/xlsx-parse.ts`
- Create: `lib/ingest/shipment-insert.ts`
- Create: `app/(portal)/silo/page.tsx`
- Create: `app/(portal)/silo/upload/page.tsx`
- Create: `app/(portal)/silo/_components.tsx`
- Create: `components/portal/silo/Uploader.tsx`
- Create: `components/portal/silo/ColumnMapper.tsx`
- Create: `app/api/portal/ingest/upload/route.ts`
- Create: `app/api/portal/ingest/parse/route.ts`
- Create: `app/api/portal/ingest/delete/route.ts`
- Create: `tests/unit/ingest/canonical-fields.test.ts`
- Create: `tests/unit/ingest/csv-parse.test.ts`
- Create: `tests/unit/ingest/shipment-insert.test.ts`
- Create: `tests/fixtures/shipments-calf-3mo.csv`
- Create: `tests/fixtures/shipments-cow-12mo.csv`
- Create: `tests/fixtures/shipments-malformed.csv`
- Create: `tests/e2e/silo-upload.spec.ts`

**Tasks:**

- [ ] Step 1: Generate fixtures — `tests/fixtures/shipments-{calf-3mo,cow-12mo,bull-3yr,malformed}.csv`. Realistic data: 10 SKUs, 7-zone distribution, mixed carriers (UPS/FedEx/USPS), some dim-overcharge cases. Malformed = missing required columns + bad numeric.
- [ ] Step 2: Test-first — `tests/unit/ingest/canonical-fields.test.ts` defines REQUIRED list (date, sku, packages_shipped, length_in, width_in, height_in, origin_zip, destination_zip, actual_weight_lb, cost_per_package, carrier) + OPTIONAL list (category, billable_weight_lb, selling_platform). Validators: date parses, weights positive, ZIP 5-digit, carrier in known list (UPS/FedEx/USPS/DHL/Amazon/Other).
- [ ] Step 3: Implement `lib/ingest/canonical-fields.ts`. Tests pass.
- [ ] Step 4: Test-first `lib/ingest/csv-parse.ts` — parse CSV from file → headers + rows. Use existing `csv-parse` dep (already in package.json devDeps). Move to deps.
- [ ] Step 5: Implement `lib/ingest/csv-parse.ts`. Tests pass.
- [ ] Step 6: Implement `lib/ingest/xlsx-parse.ts` — use `xlsx` dep, browser-side parsing matches prototype. Test via fixture.
- [ ] Step 7: Test-first `lib/ingest/shipment-insert.ts` — batched `INSERT INTO shipments` with computed fields (dim_weight = L*W*H/166, billable_weight = max(actual, dim), zone = lookup from `zone_matrix` table created in 0002, dim_overcharge_usd = (billable - actual) * carrier_dim_rate, sc_cost + sc_saving from carrier_retail_rates vs our_carrier_rates lookup).
- [ ] Step 8: Implement `lib/ingest/shipment-insert.ts`. Atomic per-batch (1000 rows/insert). On failure, mark `silo_files.status='error'` + record error_message. Log to `audit_log` with action `SILO_INGEST`.
- [ ] Step 9: Build `Uploader.tsx` (drag-drop + click-to-choose, accepts .csv/.xlsx/.xls, max 50MB calf / 200MB cow / unlimited bull per tier-gates).
- [ ] Step 10: Build `ColumnMapper.tsx` — left col = file headers, right col = canonical fields, drag mapping w/ heuristic auto-suggest (string-similarity on header names). Required fields highlighted red until mapped. Save mapping back to file metadata for re-use.
- [ ] Step 11: API routes — `/api/portal/ingest/{upload,parse,delete}`. Upload accepts multipart, writes to Supabase Storage bucket `silo-files/{org_id}/{file_id}.{ext}`, creates `silo_files` row. Parse reads storage file, runs csv-parse OR xlsx-parse, applies column mapping (from request body), runs shipment-insert. Delete cascades shipments where `silo_file_id = ?`.
- [ ] Step 12: Build `app/(portal)/silo/page.tsx` — list silo_files for current org, status badges, row counts, upload button. `silo/upload/page.tsx` — Uploader → ColumnMapper → confirm.
- [ ] Step 13: E2E `tests/e2e/silo-upload.spec.ts` — sign in as Calf user, upload `shipments-calf-3mo.csv`, map columns, verify row count, verify dashboard updates.
- [ ] Step 14: Commit: `feat(portal): silo ingest — CSV/XLSX upload, column mapper, batched shipment insert`

---

## Phase 4 — Dashboard + metrics-portal lib

**Goal:** Audit-style dashboard. Period selector (30d/90d/6mo/12mo), pain points table (top dim-overcharge SKUs), zone cost chart, SKU breakdown. Calf sees only last 3mo regardless of selector.

**Files:**
- Create: `lib/metrics-portal.ts`
- Create: `app/(portal)/dashboard/page.tsx`
- Create: `app/(portal)/dashboard/_components.tsx`
- Create: `components/portal/ui/{PixelCow,Barn,ZoneCostChart,PainPointRow,SkuRow}.tsx`
- Create: `tests/unit/metrics-portal.test.ts`
- Create: `tests/e2e/dashboard-tier-rls.spec.ts`

**Tasks:**

- [ ] Step 1: Test-first `metrics-portal.test.ts` — given fixture shipments, assert `getDashboardMetrics(orgId, period)` returns `{ totalSpend, dimOverchargeTotal, painPoints: [{sku, overcharge, count}], zoneSpend: {1:n, 2:n, ...}, topSkus: [...] }`. Calf path: query restricted to last 3mo. Cow path: 12mo. Bull: unlimited.
- [ ] Step 2: Implement `lib/metrics-portal.ts`. SQL or PostgREST queries. Aggregate via SQL function for performance, NOT in-app row iteration.
- [ ] Step 3: Port `PixelCow.tsx` from `userportal/components.jsx` (procedural SVG with inflate prop). Same for `Barn.tsx`.
- [ ] Step 4: Port `ZoneCostChart.tsx` from `userportal/dashboard.jsx` — SVG bar chart, 8 zones, hard-edge bars (no rounded corners per brand rule).
- [ ] Step 5: Port `PainPointRow.tsx` and `SkuRow.tsx` from prototype, restyle w/ Tailwind + brand tokens (charcoal border, 3px, no border-radius, 4px shadow).
- [ ] Step 6: Build `dashboard/page.tsx` — server component, fetches metrics via `lib/metrics-portal.ts`, renders cards. Period selector = client component lifting state to URL search param.
- [ ] Step 7: Tier-RLS E2E test — sign in as Calf user with 12mo of fixture shipments, dashboard shows last 3mo only. Sign in as Cow, sees full 12mo. Sign in as Bull, sees full 3yr from `shipments-bull-3yr.csv`.
- [ ] Step 8: Commit: `feat(portal): dashboard — period, pain points, zone chart, SKU table, tier-RLS`

---

## Phase 5 — Daily Insight feed + Zoning Map

**Goal:** Feed of news/insight cards (admin-curated via existing `/admin/platform` news approval). Zoning map visualizes shipments-by-zone. No personalization batch job in MVP — feed is global "approved" cards filtered by category at view time. Map = top-3 destination state list per SKU, computed on-demand.

**Files:**
- Create: `lib/insights/feed-builder.ts`
- Create: `lib/insights/relevance-score.ts`
- Create: `app/(portal)/insight/page.tsx`
- Create: `app/(portal)/insight/_components.tsx`
- Create: `components/portal/insight/InsightCard.tsx`
- Create: `app/(portal)/map/page.tsx`
- Create: `app/(portal)/map/_components.tsx`
- Create: `components/portal/map/StateGrid.tsx`
- Create: `app/api/portal/insights/route.ts`

**Tasks:**

- [ ] Step 1: Implement `feed-builder.ts` — `getApprovedFeed(orgId, category?)` returns `news_items` rows where `approval_state='approved'`, sorted by `published_at DESC`, limit 50.
- [ ] Step 2: Implement `relevance-score.ts` — given user's persona (or fallback if persona empty), score each card 0–10. MVP heuristic only: +3 if card category in `persona.news_interests`, +2 if `severity='critical'`, +1 if `published_at` within 7 days. Sort by score desc.
- [ ] Step 3: Build `InsightCard.tsx` — title, summary, source attribution, severity tag, published_at, like/dismiss buttons (optional MVP — wire backend, defer UI to post-launch if time-pressed).
- [ ] Step 4: Build `insight/page.tsx` — server component, fetches feed, renders cards. Category filter pills (All, Carrier, Platform, Trade, Logistics, Your Data, Tips) as URL search param.
- [ ] Step 5: Port `StateGrid.tsx` from `userportal/map.jsx` — TILES array (state grid), ZONE_COLOR/ZONE_LABEL constants. Hover shows top-3 destination cities per state.
- [ ] Step 6: Build `map/page.tsx` — server component, computes state-shipment counts from `shipments` table, passes to client `StateGrid`.
- [ ] Step 7: Smoke: seed 5 mock news_items in dev DB, all approved, varied categories. Sign in as test user, verify feed renders.
- [ ] Step 8: Commit: `feat(portal): daily insight feed + zoning map`

---

## Phase 6 — Mooovy chat + persona

**Goal:** Conversational AI grounded in user's shipment data. Uses Anthropic SDK direct (Claude Sonnet 4.6 default; pinned per `model_pins` if set for org). Persona injected into system prompt. Quota tracked per tier.

**Files:**
- Create: `lib/persona.ts`
- Create: `lib/mooovy/client.ts`
- Create: `lib/mooovy/system-prompt.ts`
- Create: `lib/mooovy/citations.ts`
- Create: `lib/mooovy/quota.ts`
- Create: `app/(portal)/mooovy/page.tsx`
- Create: `app/(portal)/mooovy/_components.tsx`
- Create: `components/portal/mooovy/{Chat,Message,QuotaIndicator}.tsx`
- Create: `app/api/portal/chat/route.ts`
- Create: `tests/unit/mooovy/system-prompt.test.ts`
- Create: `tests/unit/mooovy/citations.test.ts`
- Create: `tests/unit/mooovy/quota.test.ts`
- Create: `tests/unit/persona.test.ts`
- Create: `tests/e2e/mooovy-chat.spec.ts`

**Tasks:**

- [ ] Step 1: Test-first — `persona.test.ts`. `derivePersona(orgId)` queries shipments → returns `{ business_type, primary_carriers, avg_monthly_volume, top_sku_categories, preferred_zones, news_interests }`. MVP heuristic: business_type from selling_platform mode; primary_carriers from carrier mode top-2; avg_monthly_volume from packages_shipped per month avg; top_sku_categories from category mode top-3; preferred_zones from zone mode top-2.
- [ ] Step 2: Implement `lib/persona.ts`. On first chat message, derive + cache to `personas` table. Subsequent messages skip derivation if cached.
- [ ] Step 3: Test-first `system-prompt.test.ts` — `buildSystemPrompt(persona, recentShipmentSummary)` produces a prompt that:
  - Names the role: "You are Mooovy, a sharp logistics analyst at ShippingCow.ai."
  - Voice rules: direct, confident, seller-first, honest. Concise by default unless user asks for detail. Drop puns when problem-solving.
  - Persona context: business_type, primary_carriers, etc.
  - Recent data summary: total spend last 30d, top dim-overcharge SKU, zone distribution.
  - Citation rule: when stating a number, cite the source (shipment row id, or insight card id).
  - Boundary rules: never make up benchmarks; only cite user's data or approved insight cards.
- [ ] Step 4: Implement `system-prompt.ts`. Tests pass.
- [ ] Step 5: Test-first `citations.test.ts` — `extractCitations(claudeResponse)` finds inline `[shipment:abc]` or `[insight:xyz]` markers. `validateCitations(claudeResponse, allowedIds)` returns true iff every marker resolves. False = response rejected, retry once with stricter system prompt.
- [ ] Step 6: Implement `citations.ts`.
- [ ] Step 7: Test-first `quota.test.ts` — `incrementMooovyTurn(orgId)` returns `{ remaining, exceeded }`. Reset monthly. Calf=50/mo, Cow=300/mo, Bull=∞. On exceeded, return rejection w/ tier-upgrade CTA copy.
- [ ] Step 8: Implement `quota.ts` — increments + reads from a turn-counter row in `subscriptions.quota_override` jsonb (post-MVP: dedicated quota table). Tests pass.
- [ ] Step 9: Implement `lib/mooovy/client.ts` — Anthropic SDK wrapper. Default model `claude-sonnet-4-6` (per CLAUDE.md model IDs). Read `model_pins` for org override. Call `messages.create` with system prompt + conversation history. Streaming TODO post-MVP; MVP returns single response.
- [ ] Step 10: Implement `app/api/portal/chat/route.ts` — POST `{ message, history }` → check quota → derive/load persona → build system prompt → call Claude → validate citations → log to `audit_log` action `MOOOVY_TURN` → respond. On quota-exceeded, log `MOOOVY_QUOTA_EXCEEDED` and return upgrade CTA payload.
- [ ] Step 11: Build `Chat.tsx`, `Message.tsx`, `QuotaIndicator.tsx`. `mooovy/page.tsx` is full-page chat. Embed-on-dashboard variant deferred.
- [ ] Step 12: E2E `mooovy-chat.spec.ts` — sign in as Cow user, ask "what's my biggest dim overcharge?", assert response contains a shipment SKU + dollar amount + citation.
- [ ] Step 13: Commit: `feat(portal): mooovy chat — Anthropic SDK, persona, citations, quota`

---

## Phase 7 — Signup + Stripe upgrade flow + team invites

**Goal:** New user signs up via marketing landing → audit invite → upload first file → see Calf dashboard → CTA to upgrade Cow ($99 first month, $499 ongoing) or Bull ($999/mo). Stripe Checkout session for paid tiers. Webhook updates `subscriptions.tier`. Team invites for Cow+ tier (max 5 seats Cow, unlimited Bull).

**Files:**
- Create: `app/(portal)/signup/page.tsx`
- Create: `app/(portal)/audit/page.tsx`
- Create: `app/(portal)/upgrade/page.tsx`
- Create: `app/(portal)/settings/page.tsx`
- Create: `app/(portal)/settings/billing/page.tsx`
- Create: `app/(portal)/settings/team/page.tsx`
- Create: `app/(portal)/settings/persona/page.tsx`
- Create: `app/api/portal/billing/checkout/route.ts`
- Create: `app/api/portal/billing/portal/route.ts`
- Create: `app/api/portal/billing/webhook/route.ts`
- Create: `app/api/portal/team/invite/route.ts`
- Create: `app/api/portal/team/revoke/route.ts`
- Create: `tests/e2e/signup-flow.spec.ts` (full impl)
- Create: `tests/e2e/upgrade-flow.spec.ts`

**Tasks:**

- [ ] Step 1: Build `signup/page.tsx` — email + password + company-name + origin-zip → Supabase Auth signup → create `orgs` row + `subscriptions(tier='calf', status='trialing')` row + `org_members(role='owner')` row → redirect `/audit`.
- [ ] Step 2: Build `audit/page.tsx` — onboarding prompt: "Upload your last 90 days of shipments to see what you're overpaying." Direct to `/silo/upload`.
- [ ] Step 3: Build `upgrade/page.tsx` — tier comparison table, "Upgrade to Cow" / "Upgrade to Bull" buttons → POST `/api/portal/billing/checkout`.
- [ ] Step 4: Implement `billing/checkout/route.ts` — creates Stripe Checkout session for the chosen tier's price ID. Stripe price IDs in env: `STRIPE_PRICE_COW_FIRST_MONTH`, `STRIPE_PRICE_COW_RECURRING`, `STRIPE_PRICE_BULL_RECURRING`. Returns session URL.
- [ ] Step 5: Implement `billing/portal/route.ts` — creates Stripe Customer Portal session for self-service billing changes. Required for cancellations.
- [ ] Step 6: Implement `billing/webhook/route.ts` — verify Stripe signature. Handle `checkout.session.completed` → upgrade tier in `subscriptions`. Handle `customer.subscription.updated` → mirror status. Handle `invoice.payment_failed` → log `subscription_events` row with `event_type='payment_failed'`. Handle `customer.subscription.deleted` → flip to churn event.
- [ ] Step 7: Settings pages — `billing/page.tsx` (current tier, MRR, next billing date, "manage in Stripe" link), `team/page.tsx` (invite by email, list members, revoke; Cow+ gated), `persona/page.tsx` (read-only persona display + manual override of `mooovy_tone_pref`).
- [ ] Step 8: Implement `team/invite/route.ts` — Cow+ gate. Creates pending `org_members` row. Sends invite email via Resend (env `RESEND_API_KEY`). Email link → signup page w/ pre-filled org_id token.
- [ ] Step 9: E2E `signup-flow.spec.ts` — full happy path: signup → audit → silo upload → dashboard.
- [ ] Step 10: E2E `upgrade-flow.spec.ts` — sign in as Calf user, click upgrade Cow, complete Stripe Checkout in test mode, verify subscription row updates, verify dashboard now shows 12mo data.
- [ ] Step 11: Commit: `feat(portal): signup + Stripe upgrade flow + team invites`

---

## Phase 8 — Marketing routes + landing page conversion

**Goal:** Convert `homepage/shipping cow home page(1).html` and `landingpage/shippingcow-landingpage-v2(1).html` into Next.js routes at `/` and `/landing`. Plus `/pricing` and `/how-it-works`.

**Files:**
- Create: `app/(marketing)/page.tsx` (homepage at `/`)
- Create: `app/(marketing)/pricing/page.tsx`
- Create: `app/(marketing)/how-it-works/page.tsx`
- Create: `app/(marketing)/landing/page.tsx`
- Read: `homepage/shipping cow home page(1).html` (extract content)
- Read: `landingpage/shippingcow-landingpage-v2(1).html` (extract content)

**Tasks:**

- [ ] Step 1: Read both HTML files. Extract: hero copy, feature cards, pricing tiers, FAQ, footer.
- [ ] Step 2: Build `(marketing)/page.tsx` (homepage at `/`) — port hero + feature cards. Apply brand voice rules (per voice-guide.md admin↔customer same-voice rule = MOOOVY moderate). CTA to `/signup`.
- [ ] Step 3: Build `pricing/page.tsx` — tier comparison table sourced from PRD §1.4. Calf (free), Cow ($99 first mo / $499 recurring), Bull ($999 + dedicated AM).
- [ ] Step 4: Build `how-it-works/page.tsx` — 3-step explainer: Upload shipments → See overcharge → Switch carriers / use ShippingCow.
- [ ] Step 5: Build `landing/page.tsx` — port full landing page. Used for paid-ad attribution if engager runs paid traffic.
- [ ] Step 6: Verify all marketing routes render server-side (no auth required, fast TTFB for SEO).
- [ ] Step 7: Commit: `feat(portal): marketing routes — homepage, pricing, how-it-works, landing`

---

## Phase 9 — End-to-end smoke test + production migration apply

**Goal:** Full system smoke test before launch. Apply migrations to PRODUCTION Supabase. Verify admin "amber" cells flip green. Verify customer flow works against production DB w/ live Stripe (test mode initially, then real cards).

**Files:**
- Create: `tests/e2e/full-launch-smoke.spec.ts`
- Modify: `docs/superpowers/plans/2026-05-10-user-portal-build.md` (this file — mark phases complete)
- Update: jayos `SETUP_REMAINING.md` and `strategy/decisions-log.md` per locked decisions

**Tasks:**

- [ ] Step 1: COFOUNDER applies migrations 0002–0010 to PRODUCTION Supabase via Dashboard SQL Editor. Verify each idempotent re-run = no-op.
- [ ] Step 2: Set `STRIPE_SECRET_KEY` in production `.env.local` (or Vercel env, depending on hosting). Set `ANTHROPIC_API_KEY`. Set `RESEND_API_KEY`. Set Stripe price IDs.
- [ ] Step 3: Deploy to Vercel (or equivalent). Verify build green.
- [ ] Step 4: Smoke test against production:
  - Marketing landing `/` loads, CTA → signup
  - Signup → org + subscriptions(calf) created → audit prompt
  - Silo upload → `shipments-cow-12mo.csv` ingests
  - Dashboard renders w/ Calf 3mo restriction
  - Upgrade to Cow → Stripe checkout → tier flips → dashboard now 12mo
  - Mooovy chat works, citations valid, quota tracks
  - Team invite works (Cow+)
  - Admin sign-in still works, 8 admin sections all functional, "amber" cells now green for orgs/subscriptions/etc
- [ ] Step 5: Production verification SQL:
  ```sql
  SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;
  -- Expected: orgs, subscriptions, org_members, user_sessions, shipments, silo_files, personas, subscription_events, news_items, mv_org_cost_summary, + admin tables
  SELECT action, COUNT(*) FROM audit_log WHERE occurred_at >= now() - interval '1 day' GROUP BY action;
  -- Expected: USER_SIGNUP, SILO_INGEST, MOOOVY_TURN entries
  ```
- [ ] Step 6: Update jayos `docs/external-repos/shippingcow-admin-handoff.md` via `pwsh ./scripts/sync-admin-handoff.ps1`.
- [ ] Step 7: Update jayos `strategy/decisions-log.md` with launch-readiness decision (gov-class action per locked rule).
- [ ] Step 8: Commit: `chore(portal): launch readiness verified — production smoke test passed`

---

## Risk + slip mitigation

**Aggressive 4-week timeline (locked Mon 2026-06-08).** If at end of week 2 (Mon 2026-05-25), Phases 0–4 are not complete, slip Phase 6 (Mooovy) to post-launch. Customers can launch with: signup, silo, dashboard, daily insight, marketing routes. Mooovy is the killer feature but absence is recoverable. Tier upgrade (Phase 7) is non-negotiable — without it, no MRR.

**Cut order if slipping:**
1. First cut: Phase 5 zoning map (replace w/ "Map coming soon" placeholder)
2. Second cut: Phase 5 daily insight feed (operator manually emails customers)
3. Third cut: Phase 6 Mooovy chat (defer 1–2 weeks post-launch)
4. NEVER cut: Phase 1 (schema), Phase 2 (auth), Phase 3 (silo), Phase 4 (dashboard), Phase 7 (signup + upgrade), Phase 8 (marketing), Phase 9 (smoke)

**Hard blocker risks:**
- Stripe entity not formed by Phase 7 → can't test live billing → manual onboarding day-1 (operator runs Stripe checkout from operator-side)
- Cofounder doesn't apply migrations 0002–0005 → Phase 9 production smoke fails. Cofounder MUST apply by Day 5 of execution.
- Anthropic API rate-limit during Phase 6 dev → use development workspace org w/ separate quota. Production swap at Phase 9.

**Voice / brand drift risk:**
- Phase 6 Mooovy system prompt is highest leverage for brand voice. Spot-check 5+ sample replies during Phase 6 review. Use jayos `cow-voice` skill validation if possible.
- Phase 8 marketing routes carry brand. Run jayos `cow-voice` validator on copy before commit.

---

## Hard rules (carryover from admin HANDOFF + new for portal)

- Zero border-radius on every interactive element (existing brand rule)
- 3px charcoal border on cards/inputs/buttons (existing)
- 4px pixel shadow on cards + primary buttons (existing)
- `lib/supabase/admin.ts` NEVER imported from `'use client'` (existing — service role leak)
- Every successful portal mutation calls `logAudit()` (extend `AuditAction` type w/ portal actions)
- `audit_log` append-only (existing)
- Portal users CANNOT see other orgs' data — RLS enforced + tested in Phase 4 + 6
- Mooovy responses MUST cite shipment row IDs or approved insight IDs — citations.ts enforces, `audit_log` logs every chat turn
- Tier gates enforced at BOTH RLS layer AND application layer (defense in depth — RLS is hard floor, app layer is UX)
- Brand voice rules apply to all customer-facing strings per jayos voice-guide.md admin↔customer rule
- All migrations idempotent (`IF NOT EXISTS`, `to_regclass` guards)

---

## References

- jayos `strategy/decisions-log.md` 2026-05-10 entry — integration framing
- jayos `brand/voice-and-tone/voice-guide.md` — voice rules incl. admin↔customer same-voice
- jayos `brand/visual-identity/ui-tokens.md` — UI token canonical
- jayos `SETUP_REMAINING.md` "Admin portal go-live" — blocker checklist
- admin `HANDOFF.md` — current state of admin app
- admin `userportal/userportalprd.md` — user-portal PRD (264KB, authoritative)
- admin `userportal/{dashboard,components,silo,map,mooovy,feed,state,data}.{jsx,js}` — prototype source for porting
- admin `Admin Portal.html` — admin UI design source of truth (carry brand to portal)
- admin `lib/{customers,metrics,reference,ccpa,feature-flags}.ts` — already references user-portal tables
- admin `supabase/migrations/0001-0005` — existing schema
- this plan `tests/fixtures/*.csv` — TDD fixtures generated in Phase 3 Step 1
