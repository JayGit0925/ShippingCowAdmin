# ShippingCow MVP Bundle — Prototype-Anchored Implementation Plan

> **Jay-locked constraint (2026-05-17):** The 5 prototype files (`Admin Portal.html`, `landingpage/...v2.html`, `homepage/...home page.html`, `userportal/*.jsx`, `brandguide/...html`) are the binding design source of truth. **All code must port from these files.** No redesign, no improvisation. For greenfield surfaces (no prototype exists), match prototype patterns: 3px charcoal border, 4px pixel shadow, zero border-radius, BRAND tokens from `lib/brand.ts`, MOOOVY voice.

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to execute workstream-by-workstream. Each workstream gets a detailed sub-plan written at start of execution (avoids speculative pre-planning).

**Goal:** Port all 5 prototypes to production-grade Next.js code, wire to Supabase + Stripe + ShipEngine + Anthropic, fully tested, deployed to two Vercel projects. Launch target **2026-06-28**, first paying customer **2026-06-30**.

**Architecture:**
- Two Next.js 14 apps sharing one Supabase project (`aetvueyuaxbgszcisoci`)
- `shippingcow-admin` (existing repo): public website + admin portal
- `shippingcow-portal` (NEW repo): customer app + AM tooling
- Shared `lib/brand.ts` manually kept in sync (duplicate, not packaged)
- Mock state in prototypes (`window.SC_STATE`, `window.SC_AGG`) replaced by Supabase reads with same aggregation shape

**Tech Stack:** Next.js 14.2.x · TypeScript strict · Supabase (Auth + Postgres + RLS + Storage) · Stripe (Subscriptions + Billing Portal) · ShipEngine (multi-carrier) · Resend (email) · Anthropic SDK (tool-use) · Cal.com embed · Vitest + Playwright · Vercel (2 projects)

---

## The 5 Prototypes (Design SoT)

| # | File | Lines | What it defines | Port status |
|---|---|---|---|---|
| 1 | `Admin Portal.html` | 953 | 8 admin screens (Dashboard/Customers/Revenue/Reference/Platform/Audit/Security/Tickets) + ~10 micro-components + 80+ mock rows + multi-step Rate Card Editor + dual-mode ticket reply + impersonation flow | Partial (`app/admin/*` exists, drift unknown) |
| 2 | `landingpage/...v2.html` | 1466 | Launch site `/` — "Stop Getting Milked" hero, quote calc, MOOOVY intro | **✅ SHIPPED** (Phase 0 below) |
| 3 | `homepage/...home page.html` | 1045 | Second public surface — "Moo-ve Your Heavy Goods" hero, 9 sections including DIM Weight + Shrinkage calculators, 4-card guarantee, 6-service grid, Log In/Sign Up nav | ⬜ Not started — route TBD by Jay |
| 4 | `userportal/*.jsx` (9 files, ~150KB) | — | 5 customer screens (Dashboard/Silo/Map/Mooovy/Feed) + shared components (PixelCow, Barn, HBar, etc.) + 39-icon set + full state model (SC_STATE/SC_AGG/ingestRows with zone lookup, DIM weight, sc_cost) + tier gating (Calf/Cow/Bull locks baked in) | ⬜ Not started — new repo `shippingcow-portal` |
| 5 | `brandguide/...html` | 186+ | Color palette, 3 font families, shadow system (sm/md/lg), button/badge/input variants | `lib/brand.ts` is ~40% complete — drift to close |

### Greenfield surfaces (no prototype — match prototype patterns)

The prototypes DON'T cover everything Jay's MVP needs. These get designed in the prototype-pattern visual language:

| Surface | Why no prototype | Approach |
|---|---|---|
| Auth screens (`/login`, `/signup`, `/auth/callback`) | Homepage nav has Log In/Sign Up but no flow drawn | Match homepage button styling, use Supabase Auth UI |
| Settings + team management (`/settings`) | Not in user portal prototype | Match user portal sidebar pattern, simple form |
| Self-serve quote (`/quote`) | Not in user portal prototype | Lift DIM calculator from homepage HTML, extend with ShipEngine rate-shop |
| Self-serve label gen (`/ship`) | Not in any prototype | New, prototype-pattern UI |
| Self-serve tracking (`/track`) | Not in any prototype | New, prototype-pattern timeline |
| Stripe Billing Portal (`/billing`) | Not in any prototype | Stripe-hosted, single button on prototype-styled page |
| AM Portfolio (`/am/portfolio`) | Mentioned in spec, not in prototypes | New, follow admin portal table patterns |
| AM Alerts (`/am/alerts`) | Mentioned in spec, not in prototypes | New, follow admin portal alert-queue pattern |
| AM QBR (`/am/qbr/[org]`) | Mentioned in spec, not in prototypes | New, server-rendered PDF via pdf-lib |

---

## File Structure (locked)

### `shippingcow-admin/` (existing)
```
app/
  page.tsx                          # landingpage-v2 (SHIPPED)
  how-it-works/page.tsx             # SHIPPED
  pricing/page.tsx                  # SHIPPED
  quote/submitted/page.tsx          # SHIPPED
  about/page.tsx (or /why)          # NEW — homepage HTML port (route TBD)
  login/page.tsx                    # existing (admin login)
  admin/
    page.tsx                        # Dashboard (port from Admin Portal.html DashboardSection)
    customers/page.tsx              # port from CustomersSection
    revenue/page.tsx                # port from RevenueSection
    reference/page.tsx              # port from ReferenceSection
    platform/page.tsx               # port from PlatformSection
    audit/page.tsx                  # port from AuditSection
    security/page.tsx               # port from SecuritySection
    tickets/page.tsx                # port from TicketsSection
  api/admin/[…]                     # mutating routes, all gated
components/
  shell/                            # PublicNav/Footer/Layout (SHIPPED)
  ui/                               # Badge, Btn, Card, Eyebrow (extracted from prototypes)
lib/
  brand.ts                          # close drift vs brand guide
  supabase/{admin,server,browser}.ts
  rate-calc.ts
  metrics.ts
  audit.ts
  customers.ts
  stripe.ts
  impersonation.ts (new)
  feature-flag-eval.ts (new)
  reference-publish.ts
supabase/migrations/0001-0007 (applied)
  0008_admin_completion.sql (new)
```

### `shippingcow-portal/` (NEW)
```
app/
  (auth)/login/page.tsx
  (auth)/signup/page.tsx
  (auth)/callback/route.ts
  (app)/layout.tsx                  # sidebar shell from styles.css
  (app)/dashboard/page.tsx          # port dashboard.jsx
  (app)/silo/page.tsx               # port silo.jsx (the big one)
  (app)/map/page.tsx                # port map.jsx
  (app)/mooovy/page.tsx             # port mooovy.jsx
  (app)/insights/page.tsx           # port feed.jsx
  (app)/quote/page.tsx              # GREENFIELD (lift DIM calc from homepage HTML + ShipEngine)
  (app)/ship/page.tsx               # GREENFIELD
  (app)/track/page.tsx              # GREENFIELD
  (app)/billing/page.tsx            # GREENFIELD (Stripe Portal embed)
  (app)/settings/page.tsx           # GREENFIELD
  am/portfolio/page.tsx             # GREENFIELD
  am/alerts/page.tsx                # GREENFIELD
  am/qbr/[org]/page.tsx             # GREENFIELD
  api/
    auth/callback/route.ts
    shipengine/{rates,label,tracking}/route.ts
    mooovy/chat/route.ts            # SSE stream w/ Anthropic tool use
    stripe/{portal,webhook}/route.ts
    insights/cron/route.ts          # Vercel cron
components/
  ui/                               # port components.jsx (PixelCow, Barn, HBar, VBars, StackedBars, ScoreRing)
  icons/                            # port icons.jsx (39 icons)
lib/
  brand.ts                          # COPY of admin's lib/brand.ts
  supabase/{admin,server,browser}.ts
  sc-agg.ts                         # port state.js SC_AGG aggregation methods, Supabase-backed
  zone-lookup.ts                    # port lookupZone() + ZIP_TO_STATE
  ingest.ts                         # port ingestRows() pipeline
  shipengine.ts
  mooovy/{chat,tools,rag}.ts
  rls-helpers.ts                    # current_org_id()
middleware.ts
supabase/migrations/                 # user-portal-specific (start at 0009)
  0009_user_portal_core.sql         # orgs + org_members + subscriptions + RLS + current_org_id() helper
  0010_user_portal_facts.sql        # shipments + inbound + storage + returns + silo_files + mv_org_cost_summary
  0011_mooovy.sql                   # mooovy.conversations + messages + daily_insights + watchlist + dashboard_layouts
```

---

## Workstream Structure

Workstreams run in **prototype-anchored parallel tracks** rather than strict weekly phases. Some can overlap; some serialize. Each workstream gets a detailed sub-plan written at its start.

| WS | Surface | Prototype | Days | Blocks |
|---|---|---|---|---|
| **0** | Phase 0 (already started) — ship launch site to prod | landingpage-v2 (shipped) | 0.25 | unblocks DMs |
| **A** | Brand drift close in `lib/brand.ts` | brand guide HTML | 1 | foundational for all visual ports |
| **B** | Homepage HTML port (route TBD: `/why` / `/about` / replace `/`) | homepage HTML | 2 | none |
| **C** | Admin portal port + completion (8 screens, drift audit + missing APIs + live data) | Admin Portal.html | 9 | needs Migration 0008 |
| **D** | User portal scaffold (new repo, auth, RLS, shell) | greenfield + brand | 3 | needs Migration 0009 |
| **E** | User portal 5-screen port (Dashboard/Silo/Map/Mooovy/Feed) + state→Supabase wire | userportal/*.jsx | 5 | blocks F, needs Migration 0010 |
| **F** | User portal greenfield (Settings, /quote, /ship, /track, /billing) + ShipEngine + Stripe Billing Portal | none | 6 | needs E for nav |
| **G** | AM tooling (Portfolio, Alerts, QBR) | none | 3 | needs F for data |
| **H** | Mooovy chat live AI + Daily Insights feed live data | mooovy.jsx + feed.jsx (already ported in E as UI) | 3 | needs Migration 0011, F for billing context |
| **T** | Full test coverage (unit ≥80%, e2e all critical flows) | n/a | 4 | runs continuous |
| **Z** | Integration smoke + prod ship + DM announce | n/a | 1 | needs all above |

**Sequencing (Gantt-ish):**

```
Week 0 (today)  : WS 0 ──────────────┐
                                     │
Week 1          : WS A ──┐           │
                  WS B ──┤           │
                  WS C ──┼───────────┘
                                     
Week 2          : WS C (cont) ───────┐
                  WS D ──┐           │
                                     │
Week 3          : WS D ──┘           │
                  WS E ──┐           │
                  WS T (continuous starts) │
                                     │
Week 4          : WS E ──┘           │
                  WS F ──┐           │
                                     │
Week 5          : WS F (cont) ───────┐
                  WS H ──┐           │
                  WS G ──┤           │
                                     │
Week 6          : WS T (push to 80%) │
                  WS Z ───────────── PROD SHIP 2026-06-28
```

---

# WS 0 — Phase 0: Ship Launch Site (TODAY, ~2 hours)

**Status:** ⬜ pending Jay merge approval

**Goal:** Merge `worktree-launch-site` branch to master, deploy to prod on `shippingcowmvp.vercel.app`, unblock DM campaign.

### Tasks

- [ ] **0.1 Stale-doc fixes** — `CLAUDE.md:109` + `docs/migrations-applied.md`: swap `shippingcow-admin.vercel.app` → `shippingcowmvp.vercel.app`. Commit `chore(docs): point prod URL refs to shippingcowmvp.vercel.app`. Push to `worktree-launch-site`.
- [ ] **0.2 Sanity check** — From worktree: `npm run typecheck` (clean), `npm test` (8/8 pass).
- [ ] **0.3 FF-merge** (REQUIRES JAY EXPLICIT "merge" PER AUTONOMY CONTRACT) — From main repo: `git fetch origin && git merge --ff-only origin/worktree-launch-site && git push origin master`.
- [ ] **0.4 Vercel auto-deploy** — Watch `shippingcowmvp` project deploy. Verify READY via Vercel MCP `get_deployment`.
- [ ] **0.5 Post-deploy smoke** — Browse `/`, `/how-it-works`, `/pricing`, `/quote/submitted`. Submit test quote → verify `quote_requests` row appears in Supabase. Note Cal.com slug 404 acceptable (Jay's separate dashboard action).
- [ ] **0.6 Worktree cleanup** — `git branch -d worktree-launch-site` (local), `git push origin :worktree-launch-site` (optional). ExitWorktree.
- [ ] **0.7 DM unblock confirmation** — Confirm `docs/campaign/linkedin-dms.md` send-ready.

---

# WS A — Brand System Drift Close (~1 day)

**Status:** ⬜ pending
**Prototype:** `brandguide/Shipping Cow Brand Guide _standalone_(1).html`
**Files affected:** `lib/brand.ts` (admin repo)

**Goal:** Close ~60% drift between brand guide and `lib/brand.ts`. Foundational — every subsequent port reads from `lib/brand.ts`.

### Drift to close

- [ ] **A.1** Add `pxLg()` shadow helper → `'6px 6px 0'` (used for hover states)
- [ ] **A.2** Add border-radius scale: `RADIUS.sm = 6, RADIUS.md = 8` (current rule "zero radius on interactive" stays for buttons/inputs; 6/8 for cards/modals)
- [ ] **A.3** Add font scale: `FONT_SIZE = { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.25rem', xl: '2rem' }`, `FONT_WEIGHT = { regular: 400, medium: 500, bold: 700 }`, `LINE_HEIGHT = { tight: 0.95, snug: 1.05, base: 1.5, loose: 1.8 }`
- [ ] **A.4** Add spacing scale: `SPACE = [0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64]` (px-based, rem-equivalent)
- [ ] **A.5** Add `BORDER` constants: `BORDER.thick = '3px solid'`, `BORDER.thin = '1.5px solid'`
- [ ] **A.6** Add utility/grayscale colors observed in brand guide: `BRAND.gray400 = '#8b94a3'`, `BRAND.gray200 = '#cfd5df'`, `BRAND.skyLight = '#dbe6fa'`, `BRAND.redDeep = '#c53030'`
- [ ] **A.7** Add unit tests in `tests/unit/brand.test.ts` asserting every token has expected value (regression-proof)
- [ ] **A.8** Commit + mirror to `shippingcow-portal/lib/brand.ts` once that repo exists (manual sync, ~5 min per edit)

---

# WS B — Homepage HTML Port (~2 days)

**Status:** ⬜ pending. **Route locked 2026-05-17 (kickoff): replace `/`.** Homepage HTML becomes the root. Current `app/page.tsx` (launch v2 hero + MOOOVY intro — just shipped in WS 0) moves to `/launch` so DM-pasted links keep working during transition; deleted once the DM batch rotates to homepage-pointed URLs. Decision accepts denser first-paint trade-off and the brand-drift rework cost from skipping WS A.

### High-level tasks (sub-plan at WS start)

- [ ] **B.0** Move current `app/page.tsx` → `app/launch/page.tsx`; add "Launch" to PublicNav for the transition window. After DM batch rotates, replace `/launch` with a redirect to `/` (or delete).
- [ ] **B.1** Replace `app/page.tsx` with homepage HTML port (server component) — `S` style object containing every inline style from the prototype, `satisfies CSSProperties`. Lift markup verbatim.
- [ ] **B.2** Port hero — "Moo-ve Your Heavy Goods Without Getting Milked", animated cow visual, blue framed box with floating badges, 4 trust checkmarks.
- [ ] **B.3** Port "Three Things Killing Margins" 3-card grid.
- [ ] **B.4** Port DIM Weight Savings Calculator (`'use client'` for state). 5 inputs + 2 ZIP fields, real-time `recalcDim()` math, 3-divisor bar chart, copy-to-clipboard. **Extract math to `lib/dim-calc.ts` for reuse in `/quote`.**
- [ ] **B.5** Port Zero Shrinkage Calculator (`'use client'`). 4 inputs (AOV, units, weight slider, rate slider), real-time outputs.
- [ ] **B.6** Port "Built by Operators" 2-col section with warehouse illustration.
- [ ] **B.7** Port "Cow-Guaranteed Promise" 4-card grid (zero shrinkage, 2-day delivery, dock-to-stock 48h, 100% accuracy).
- [ ] **B.8** Port "Herd Has Spoken" 3-testimonial grid (Marcus T., Priya M., Derek S.).
- [ ] **B.9** Port "Every Link in the Chain" 6-service grid.
- [ ] **B.10** Port "Ready to Start Saving" final CTA section.
- [ ] **B.11** Update `PublicNav` — "Home" link points to `/` (now homepage), add transition "Launch" link to `/launch` (remove once DMs rotate).
- [ ] **B.12** Update root `metadata: { title, description }` to homepage version ("Moo-ve Your Heavy Goods Without Getting Milked"). Update `/launch/page.tsx` metadata to launch-v2 strings.
- [ ] **B.13** E2E test: navigate to `/`, both calculators render and respond to input. Verify `/launch` still serves the v2 hero during transition.
- [ ] **B.14** Unit tests for `lib/dim-calc.ts` and `lib/shrink-calc.ts` (extracted math).

---

# WS C — Admin Portal Port + Completion (~9 days)

**Status:** ⬜ pending
**Prototype:** `Admin Portal.html` (953 lines)
**Existing code:** `app/admin/*` is partial (per CLAUDE.md, Phases A-B shipped, C-E partial)

**Strategy per section (8 sections × ~1 day each):**
1. Read prototype section JSX
2. Diff vs current `app/admin/{section}/page.tsx`
3. Three outcomes:
   - **Matches** → wire APIs + live data only
   - **Drifted** → re-port markup from prototype, keep API/data work
   - **Missing** → port from scratch + add API
4. Add API routes (all `getAdminContext` + `logAudit`)
5. E2E test the critical flow
6. Commit per section

### Sections in order (each = 1 sub-task day)

- [ ] **C.1 Dashboard** (`/admin`) — KPI bar (6 cards), MRR chart (3mo/6mo/12mo SVG line chart with 3 stacked lines), Alert Queue (8 alerts scrollable), 4 System Health tiles. Wire to `lib/metrics.ts` Supabase reads.
- [ ] **C.2 Customers** (`/admin/customers`) — 8-col sortable table, search + tier/status filters, click-row OrgDrawer (5 tabs: Overview/Members/Activity/Billing/Audit). Drawer Overview has 7 quick-action buttons (Impersonate, Suspend, Tier Override, Force Logout, CCPA Erasure, etc.). Each action = mutating API route + typed-confirm modal + `logAudit`.
- [ ] **C.3 Revenue** (`/admin/revenue`) — 6 metric cards, period selector (30d/90d/12mo), 3-stage Conversion Funnel, Failed Payment Queue (7-col table with Retry/Extend/Suspend actions), Dunning Flow timeline (6 stages from Day 0 to Day +52).
- [ ] **C.4 Reference (Rate Cards)** (`/admin/reference`) — 3-col grid of 6 rate tables, multi-step Editor Modal (4 stages: EDIT → VALIDATE → PREVIEW IMPACT → PUBLISH with required publish-note textarea). Scheduled publishes section. Wire to `lib/reference-publish.ts` (already exists). Verify draft workflow matches prototype's 4-step UI.
- [ ] **C.5 Platform** (`/admin/platform`) — 5 tabs (FLAGS/AI OPS/INSIGHT FEED/QUOTAS/EMAIL TEMPLATES). FLAGS: Global Kill Switch card + flag table with toggle + rollout %. AI OPS: Mooovy enable toggle + Model Version Pins table. INSIGHT FEED: pending cards with Approve/Edit/Reject. QUOTAS: usage bars (amber >80%). EMAIL TEMPLATES: 6-template list.
- [ ] **C.6 Audit** (`/admin/audit`) — Append-only notice banner, search + action-type filter dropdown, Export CSV button, 5-col table with expandable rows showing BEFORE/AFTER JSON diff (red/green). Read from `audit_log` table.
- [ ] **C.7 Security** (`/admin/security`) — Suspicious Sessions card with 3-action buttons per row, 2-col grid (CCPA Erasure trigger + Admin User Management). `platform_admins` CRUD (super-admin only).
- [ ] **C.8 Tickets** (`/admin/tickets`) — Stat header (OPEN red + URGENT amber), search + status/priority filters, split-pane (360px left list + main right thread). TicketThread with dual-mode reply box (REPLY TO USER blue / INTERNAL NOTE amber). Status cycling, Impersonate User shortcut. Wire to `support_tickets` + `ticket_messages` tables (already in migration 0004).

### Cross-cutting

- [ ] **C.9 Migration 0008** — Add any missing columns/indexes per prototype features. Audit existing 0001-0007 against prototype state model first.
- [ ] **C.10 Reusable `<ConfirmDestructive>` modal** — typed-confirm pattern (type org name to enable Confirm button), used by Suspend, CCPA, Cancel Sub, etc.
- [ ] **C.11 Reusable `<RoleGate>`** — super-admin-only UI for admin user CRUD + system kill switches.
- [ ] **C.12 Per-section e2e tests** — one Playwright spec per admin section covering happy path + one destructive action.

---

# WS D — User Portal Scaffold (~3 days)

**Status:** ⬜ pending
**Prototype:** brand guide (visual) + greenfield (auth flow not in user portal prototype)

### Tasks

- [ ] **D.1 New repo** — `gh repo create JayGit0925/shippingcow-portal --private`, `cd ~/code && git clone`, `npx create-next-app@latest shippingcow-portal --typescript --tailwind --app`. Initial commit.
- [ ] **D.2 Vercel project** — Create `shippingcow-portal` project, link to GitHub. Env vars (Production + Preview): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Domain `shippingcow-portal.vercel.app`.
- [ ] **D.3 Copy brand foundation** — `lib/brand.ts` (post-WS-A version), Tailwind config mirrored, `globals.css` with the same zero-radius + 3px-border rules.
- [ ] **D.4 Migration 0009** (run in shippingcow-admin repo since migrations are shared) — `orgs` (id, name, tier, origin_zip, origin_city, mrr, status, created_at), `org_members` (org_id, user_id, role enum, mfa, last_login, created_at), `subscriptions` (org_id, stripe_subscription_id, status, tier, amount_cents). RLS: `current_org_id()` helper function reads from `auth.jwt() -> 'org_id'`, all tables filter by `org_id = current_org_id()`.
- [ ] **D.5 Supabase clients** — Port `lib/supabase/{admin,server,browser}.ts` from admin repo. Same `server-only` discipline.
- [ ] **D.6 Auth pages** (greenfield, prototype-pattern styling) — `(auth)/login/page.tsx` with Supabase magic-link form, `(auth)/signup/page.tsx` with email + org name → creates user + org + `org_members.owner`, `(auth)/callback/route.ts` Supabase callback handler.
- [ ] **D.7 Middleware** — `middleware.ts` checks Supabase session + org membership, redirects to `/login` if missing.
- [ ] **D.8 App shell** — `(app)/layout.tsx` with left sidebar (port `styles.css` `.app` grid 240px + 1fr), nav items from prototype (Dashboard / Silo / Map / Mooovy / Feed / + greenfield Quote / Ship / Track / Billing / Settings), tier badge at bottom, logout button.
- [ ] **D.9 Dashboard placeholder** — `(app)/dashboard/page.tsx` empty skeleton confirming RLS works (no cross-org leak).
- [ ] **D.10 E2E sanity** — Signup → magic-link (test mode) → dashboard renders → logout. RLS leak test (two orgs, confirm isolation).

---

# WS E — User Portal 5-Screen Port (~5 days)

**Status:** ⬜ pending
**Prototype:** `userportal/{dashboard,silo,map,mooovy,feed}.jsx` + `components.jsx` + `icons.jsx` + `state.js` + `data.js`

**Core approach:** Each `.jsx` file = one Next.js page. Port markup + render logic verbatim. Replace mock state (`window.SC_STATE` / `window.SC_AGG`) with Supabase reads through `lib/sc-agg.ts` (a new module that exposes the same method names but queries Postgres).

### Tasks

- [ ] **E.1 Port shared components** (~0.5d) — `components.jsx` → `components/ui/{PixelCow,Barn,HBar,VBars,StackedBars,ScoreRing}.tsx`. Each preserves props + SVG markup verbatim.
- [ ] **E.2 Port icons** (~0.25d) — `icons.jsx` → `components/icons/icon.tsx` with same 39-icon set, name prop, size/stroke/fill.
- [ ] **E.3 Migration 0010** (~0.5d) — `shipments` table with every field from `state.js` `ingestRows()` output (date, sku, carrier, origin_zip, destination_zip, actual_lb, billable_lb, cost, zone (computed), dim_weight (computed), dim_overcharge_usd (computed), sc_cost (computed), packages_shipped, selling_platform). `inbound_shipments`, `storage_records`, `returns`, `silo_files`. Materialized view `mv_org_cost_summary` (replaces 0003 stub) with org-level aggregations. RLS by org_id.
- [ ] **E.4 Port `state.js` → `lib/sc-agg.ts` + `lib/ingest.ts` + `lib/zone-lookup.ts`** (~1d) — Server-side equivalents of every SC_AGG method (filteredRows, totalSpend, avgZone, dimOverchargePct, annualSavings, topSkus, painPoints, zoneDist, etc.). Each becomes a Supabase RPC or query helper returning the same shape the JSX expects. ZIP_TO_STATE map (500 entries) ported as constant.
- [ ] **E.5 Port `dashboard.jsx` → `(app)/dashboard/page.tsx`** (~0.5d) — Server component. 4 sections: Gauges (5 metrics), Zone Cost Distribution (with origin ZIP selector + ZoneCostChart), Top Shipped SKUs (with dim-overcharge cow visual using `<PixelCow inflate={dimPct} />`), Pain Points table (preserve tier gate: Calf sees 3 rows + `lock` badge on rest). Period selector via URL params. EmptyDashboard fallback when no data.
- [ ] **E.6 Port `silo.jsx` → `(app)/silo/page.tsx`** (~1.5d) — Biggest file (39KB, 738 lines). State machine: list / upload / ai-parsing / ai-review / success. Drag-drop file upload (CSV + XLSX via `xlsx` lib). Column mapping pipeline (`autoMap` + `applyMappingAndNormalize`). AI parse via Anthropic SDK (replace `window.claude.complete` mock with real API). AIReviewTable with editable cells. File list 3-panel layout (files / preview / metadata). Delete cascade modal. Wire ingest → `lib/ingest.ts` → `shipments` insert.
- [ ] **E.7 Port `map.jsx` → `(app)/map/page.tsx`** (~0.75d) — TileMapLive SVG component with destination state coloring (yellow=warehouses, blue-shade=volume, gray=no data, zone-colors=demo mode). Hover tooltips. Right sidebar: Zone Analytics card + SC 3-Node Savings card with tier-gated scenario tool (Calf sees lock). Pull stats from `lib/sc-agg.ts` `destStateShipments()`, `topDestStates()`, etc.
- [ ] **E.8 Port `feed.jsx` → `(app)/insights/page.tsx`** (~0.75d) — Header (data-aware title), category filter buttons, 2-col layout (insights left, sidebar right). Insight cards with tag/severity/timestamp/impact/sources/actions. "What this means for you" yellow box. Internal auto-generated insights (Zone 6+, dim overcharge, carrier negotiation) computed from `lib/sc-agg.ts`. Sidebar: Watchlist (tier-gated topic limits: calf=3, cow=8, bull=12) + Daily digest toggle. Static external insights from `daily_insights` table (Migration 0011).
- [ ] **E.9 Port `mooovy.jsx` UI shell → `(app)/mooovy/page.tsx`** (~0.5d) — Header (status badge data-aware), chat stream (user yellow right-align, moo white left-align), suggested questions (context-aware list), composer (attach + textarea + send), thinking indicator. **Real AI wiring deferred to WS H.** For now, use the mock `generateReply` function inline so UI is testable.

### Cross-cutting in WS E

- [ ] **E.10 Tier gate enforcement** — `lib/rls-helpers.ts` exposes `currentTier()` server-side. UI components check tier before rendering paid rows / unlocking scenarios. Match prototype gating exactly: Calf pain-points rows 3+ locked, Calf map scenario locked, Calf watchlist 3/5, etc.
- [ ] **E.11 Visual regression tests** (Playwright with screenshot) — one per ported screen, compare to prototype HTML render.
- [ ] **E.12 Unit tests for `lib/sc-agg.ts`** — assert each aggregation method returns expected shape for fixture data.

---

# WS F — Greenfield (Settings / Quote / Ship / Track / Billing) (~6 days)

**Status:** ⬜ pending
**Prototype:** none for these screens. Match user portal prototype's sidebar + card patterns. Lift homepage HTML's DIM calculator math.

### Tasks

- [ ] **F.1 Settings (`/settings`)** (~0.5d) — Org info form (name, origin_zip), team members table (port from admin's MembersTab pattern), invite member button → Supabase invite flow, plan + billing link to `/billing`.
- [ ] **F.2 ShipEngine setup** (~0.5d, Jay's onboarding action + my wiring) — Sign up for ShipEngine, add ShippingCow-owned FedEx + UPS carrier accounts. Store API key in env. `lib/shipengine.ts` with `getRates`, `createLabel`, `getTracking`.
- [ ] **F.3 Quote page (`/quote`)** (~1.5d) — Lift DIM calculator UI from homepage HTML, reuse `lib/dim-calc.ts` (extracted in WS B), add address inputs (from/to). On "Get rates" → `lib/shipengine.ts.getRates()` → display rate table (carrier/service/cost). "Use this rate" → `/ship?rateId=...`.
- [ ] **F.4 Ship page (`/ship`)** (~1.5d) — Confirm rate, customer billing card (Stripe Elements), `lib/shipengine.ts.createLabel()` → insert into `shipments` with `org_id`. Display printable label PDF + tracking number.
- [ ] **F.5 Track page (`/track`)** (~0.5d) — Input: tracking # OR shipment ID. `lib/shipengine.ts.getTracking()` → timeline (event list with date, location, status).
- [ ] **F.6 Billing page (`/billing`)** (~0.5d) — Stripe Portal session API (`POST /api/stripe/portal`) → redirect. Single button on prototype-styled page. Stripe webhook handler (`/api/stripe/webhook`) updates `subscriptions.status`.
- [ ] **F.7 Migration: shipments billing fields** (~0.25d) — Add `stripe_charge_id`, `label_url`, `tracking_status` columns.
- [ ] **F.8 Tests** (~1d) — Unit: dim-calc, shipengine rate sorter, label payload builder, tracking event normalizer. E2E: quote → label → track happy path (mocked ShipEngine).

---

# WS G — AM Tooling (~3 days)

**Status:** ⬜ pending
**Prototype:** none. Follow admin portal table + alert-queue patterns.

### Tasks

- [ ] **G.1 AM role** (~0.25d) — Add `'am'` to `platform_admins.role` enum (or `org_members.role`). AM is a special platform_admin with assigned orgs.
- [ ] **G.2 AM Portfolio (`/am/portfolio`)** (~1d) — List orgs assigned to current AM via `orgs.assigned_am_user_id`. Health score column (composite: last_login recency + ticket count + payment status + AI usage). Sort/filter. Click → org detail (reuse admin OrgDrawer pattern).
- [ ] **G.3 AM Alerts (`/am/alerts`)** (~0.75d) — Aggregate across AM's portfolio: failed payments + churn-risk orgs (no activity 14d) + suspicious sessions. Each alert: "Draft outreach" button → prefilled Resend email template.
- [ ] **G.4 AM QBR (`/am/qbr/[org]`)** (~1d) — Pulls 90d metrics for org from `mv_org_cost_summary`. Anthropic drafts talking points from metrics JSON. Export via `pdf-lib` server-side.

---

# WS H — Mooovy Chat Live AI + Daily Insights Live Data (~3 days)

**Status:** ⬜ pending
**Prototype:** mooovy.jsx + feed.jsx (UI ported in WS E)

### Tasks

- [ ] **H.1 Migration 0011** (~0.25d) — `mooovy.conversations` (id, org_id, user_id, title, created_at), `mooovy.messages` (conversation_id, role enum: user|assistant|tool, content, tool_calls jsonb, created_at), `daily_insights` (id, headline, body, category, source_url, published_at, approval_state), `org_insight_watchlist` (org_id, topic, created_at), `dashboard_layouts` (user_id, layout jsonb).
- [ ] **H.2 `lib/mooovy/chat.ts`** (~1d) — Anthropic SDK client with tool definitions: `query_my_shipments({filters})`, `query_my_costs({period})`, `get_zone_for_zip({origin, dest})`, `get_my_savings_estimate({})`. Each tool calls Supabase via service-role-on-behalf-of-user pattern (RLS scope by org_id).
- [ ] **H.3 SSE streaming endpoint** (~0.5d) — `POST /api/mooovy/chat` streams Anthropic response with tool calls. Persist messages to `mooovy.messages` as they stream.
- [ ] **H.4 Mooovy UI wire** (~0.25d) — Replace mock `generateReply` in `/(app)/mooovy/page.tsx` with SSE fetch. Tool call results render as inline tables/charts in the chat.
- [ ] **H.5 Daily Insights cron** (~0.5d) — Vercel cron route `/api/insights/cron` daily fetches RSS feeds (logistics news), Anthropic summarizes + categorizes per `org_insight_watchlist`. Inserts into `daily_insights`.
- [ ] **H.6 Feed live data wire** (~0.25d) — Replace static `SC_DATA.insights` with Supabase reads from `daily_insights` filtered by approval_state='approved' + watchlist match.
- [ ] **H.7 Tests** (~0.25d) — Tool call schema validation, RAG query mocking, SSE stream sanity.

**Risk:** if H falls behind, ship UI-only Mooovy (mock replies) for v1.0, real AI in v1.1.

---

# WS T — Test Coverage (continuous, ~4 days dedicated push at end)

**Status:** ⬜ pending. Starts during WS E, peaks in week 6.

**Goal:** Both repos at ≥80% line coverage on `vitest --coverage`. All critical e2e flows green.

### Tasks

- [ ] **T.1 Coverage audit** — `vitest --coverage` on both repos. Identify untested files. Prioritize lib/* over routes.
- [ ] **T.2 Unit tests added** (continuous through WS C-H, batched push if needed) — every `lib/*.ts` file has matching test.
- [ ] **T.3 Mock factories** — Supabase via `vitest-mock-extended`, Stripe via test mode keys, ShipEngine via JSON fixtures, Anthropic via response cassettes.
- [ ] **T.4 E2E suites per repo:**
  - `shippingcow-admin`: landing → quote → submitted; /why calculators; /how-it-works; /pricing; login → /admin; admin/customers create → suspend → audit row appears; admin/tickets reply + status cycle.
  - `shippingcow-portal`: signup → magic link → dashboard; silo CSV upload → dashboard updates; map renders + tier-gate check; quote → ship → track happy path; mooovy chat send → reply; billing portal redirect.
- [ ] **T.5 CI gates** — `.github/workflows/ci.yml` in both repos: `typecheck → lint → unit → e2e → coverage ≥80%`. Fail build on regression.

---

# WS Z — Integration Smoke + Ship (~1 day, 2026-06-28)

**Status:** ⬜ pending

- [ ] **Z.1 Manual integration smoke** — Full customer journey on prod: DM reply → audit page (`/why` calc → quote form → /quote/submitted → Cal.com demo) → signup → ingest CSV → see dashboard populate → request quote → generate label → track → chat with Mooovy → review invoice in Stripe Portal. Log every snag.
- [ ] **Z.2 High-priority fixes** — fix anything that breaks the journey. Defer cosmetic.
- [ ] **Z.3 Tag releases** — `v1.0.0` in both repos.
- [ ] **Z.4 Vercel prod promote** — both projects to production.
- [ ] **Z.5 Synthetic smoke on prod URLs** — repeat Z.1 against prod.
- [ ] **Z.6 DM campaign confirm** — Jay's go to send DMs.

---

## Out-of-scope for MVP (v1.1+)

- Customer-owned carrier accounts (V1 uses ShippingCow's ShipEngine)
- Workspace draggable widgets (`react-grid-layout` per old plan) — replaced by porting the prototype's fixed dashboard layout. Workspace as a separate route is v1.1.
- Multi-org per user (V1 = single org per session, prototype doesn't show switcher)
- Conversation viewer (admin reading tenant Mooovy chats)
- Bull custom contracts (handled offline via DocuSign)
- Dunning auto-advance Edge Function (V1 manual via admin)
- ZIP prefix lookup in Zone Matrix editor
- Scheduled publish auto-trigger (midnight ET cron)
- Canned ticket responses
- AM-initiated chat with seller
- In-platform contract signing
- SMS push alerts
- Custom knowledge sources in Mooovy
- QBR auto-scheduling
- AI insights personalization beyond watchlist topics

---

## Risks

1. **Mooovy chat real AI (WS H)** — tool use + SSE + RAG is non-trivial. If behind, ship UI-only with mock replies.
2. **ShipEngine onboarding (WS F)** — production carrier creds need real accounts; UX for customer-owned carriers deferred.
3. **Silo port (WS E.6)** — biggest single file (39KB). May need to split across 2 days. AI parse via Anthropic is the trickiest path.
4. **Brand drift (WS A)** — if WS A slips, every later visual port costs extra rework.
5. **Solo dev fragility** — any single blocker = day lost. Mitigation: tests-first, git checkpoints per commit.
6. **Scope creep from DM responder feedback** — once DMs send (after WS 0), prospect feedback arrives. Log to `docs/launch-feedback.md`, do NOT pull in unless it breaks an MVP flow.

---

## Execution handoff

Plan saved at `docs/superpowers/plans/2026-05-17-mvp-bundle.md`.

**Recommended execution mode:** `superpowers:subagent-driven-development` per workstream.

**Next concrete actions:**
1. **Jay reviews this plan** — accept, descope, or call out changes
2. **Jay decides homepage HTML route** (WS B) — `/why`, `/about`, or replace `/`
3. **Jay says "merge"** — kicks off WS 0 (ship launch site, ~2h)
4. After WS 0: WS A (brand drift, 1d) → kicks off the rest

Each workstream gets a detailed sub-plan written at its start. Sub-plans are NOT pre-written for weeks 3-6 work — saves wasted planning effort if scope shifts.
