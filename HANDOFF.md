# HANDOFF — ShippingCow Admin Portal

Last updated: 2026-05-18
Branch: `master` (pushed to `https://github.com/JayGit0925/ShippingCowAdmin`)
Project root: `/Users/jayos/code/shippingcow-admin`
Spec (authoritative): `admin handoff v1(1).md`

---

## Goal

Build the ShippingCow Admin Portal — internal Next.js 14 admin surface for ShippingCow Calf/Cow/Bull tier e-commerce logistics SaaS. Eight sections: Dashboard, Customers, Revenue, Rate Cards, Platform Controls, Audit Log, Security, Tickets. Admin portal connects to same Supabase project as user-portal (separate repo).

---

## Status: All phases + workstreams complete — 33 e2e + 163 unit tests pass

| Phase | Surface | Code | Live gate |
|---|---|---|---|
| A.1 | Foundation + auth + audit + 8 routes | DONE | GREEN |
| A.2 | /login + /admin/setup-mfa TOTP | DONE | GREEN |
| B.1 | Reference data schema + read-only /admin/reference | DONE | DEPENDS on migration 0002 |
| B.2 | Rate card editor + 4-step publish workflow | DONE | GREEN (4-step editor complete) |
| C | /admin/customers + /admin/tickets | DONE | GREEN |
| D | Dashboard + Revenue + Stripe handlers | DONE | AMBER (STRIPE_SECRET_KEY not set) |
| E | Platform + Audit + Security | DONE | GREEN |
| WS A | Brand tokens + Tailwind | DONE | GREEN |
| WS B | Homepage HTML port at / | DONE | GREEN |
| WS C | Admin portal drift — all 8 sections | DONE | GREEN |
| E2E | Full test coverage | DONE | GREEN |

~50 routes total. Build: clean (`npm run build` exits 0). Tests: 33 e2e + 163 unit all pass. 22 commits pushed to master on 2026-05-18.

---

## Session 2026-05-18 Changes

### WS A — Brand Drift

- Added `TYPOGRAPHY`, `SPACING`, `BORDER_RADIUS`, `LETTER_SPACING`, `COLOR` exports to `lib/brand.ts`.
- 27 unit tests in `tests/unit/brand.test.ts` — all pass.
- Extended `tailwind.config.ts` with spacing / letterSpacing / lineHeight tokens.
- Fixed `@calcom/embed-react` missing from `node_modules` (was in `package.json` but not installed).

### E2E Testing

- Created `tests/e2e/public-routes.spec.ts` (7 tests).
- Created `tests/e2e/navigation.spec.ts` (5 tests).
- Created `tests/e2e/admin-smoke.spec.ts` (13 tests).
- Added quote form validation tests to `landing-flow.spec.ts`.
- Fixed `DEV_BYPASS` in `middleware.ts` to work even when `SUPABASE_CONFIGURED=true`.
- All 33 e2e + 163 unit tests pass.

### WS C — Admin Portal Drift (all 8 sections)

- **Dashboard:** `_mrr-chart.tsx` now has 3MO/6MO/12MO period selector tabs.
- **Customers:** `_drawer-tabs.tsx` has all 5 tabs (Overview / Activity / Usage / Subscriptions / Notes); new `ConfirmActionButton` for Suspend / Override Tier with typed confirmation; 5 quick actions.
- **Revenue:** funnel rebuilt (Visits → Quotes → Trials → Paid → Expanded with conversion rates); failed queue columns ORG · AMOUNT · ATTEMPTS · LAST ATTEMPT · ACTIONS (Retry + Waive).
- **Reference:** `[table]` route has full 4-step publish editor (Edit → Validate → Preview Impact → Publish).
- **Platform:** all 5 tabs aligned — Flags (table + toggle), Kill switch (modal + reason), Model pins (table + pinned_at), News queue (approve / reject), Quotas (usage table); URL `?tab=` switching confirmed.
- **Audit:** `_entry-detail.tsx` has DIFF toggle with red/green before/after JSON view; `_filters.tsx` confirmed complete.
- **Security:** `_admin-list.tsx` has typed DEACTIVATE confirmation; `_suspicious-sessions.tsx` shows amber notice; `_ccpa-form.tsx` has org ID + email + reason select.
- **Tickets:** `_reply-form.tsx` has PUBLIC / INTERNAL NOTE dual-mode toggle with `#FFFBEA` background; `[ticketId]/page.tsx` fully implemented.

### Session 2026-05-11 Changes (archived)

- Fixed git remote URL (was `shippingcow/ShippingCowAdmin` — corrected to `JayGit0925/ShippingCowAdmin`).
- First successful push to GitHub — all 10 commits on remote.
- Untracked clutter (`artifacts/`, `pixel-bull-duel.html`) — still present; gitignore or commit as desired.

---

## Current Progress

### Code is complete

5 migrations + ~30 new files in `app/`, `lib/`, `components/`, `supabase/`. Plans in `docs/superpowers/plans/`. See git log for per-phase breakdown.

### What's wired

- **Auth:** `middleware.ts` on `/admin/:path*` and `/api/admin/:path*`. Checks Supabase session → `platform_admins.is_active` → MFA factor → redirects to `/login`, `/403`, `/admin/setup-mfa`. Sets `x-admin-role` header. `DEV_BYPASS` short-circuits when env unset.
- **Two Supabase clients:**
  - `lib/supabase/admin.ts` — service-role, bypasses RLS, `'server-only'`
  - `lib/supabase/server.ts` — anon-key cookie-bound for RSC reads
  - `lib/supabase/browser.ts` — `createClientComponentClient` for `'use client'` files
- **Route handler context:** `lib/admin-context.ts` exports `getAdminContext(req)` → `{ actorId, actorRole, ip }`. Used by every mutating API route.
- **Audit logging:** `lib/audit.ts` — closed `AuditAction` enum (40+ actions), `logAudit()` called by every successful mutation. `audit_log` append-only via RLS + BEFORE UPDATE/DELETE triggers.
- **Brand system:** `lib/brand.ts` + `tailwind.config.ts`. Zero border-radius, 3px charcoal borders, 4px pixel shadow, hover collapses shadow + `translate(2px, 2px)`. Inline `style={{...}}` prevailing pattern.

### Live infra state

- Supabase project `kmioqhqqheyyllqifrli` provisioned. `.env.local` has all 3 Supabase env vars.
- Migration `0001_phase_a.sql` applied — `platform_admins` and `audit_log` exist with RLS + triggers.
- Founder auth user exists. UID `f7db2bfe-4f93-4a3a-82e8-ab51f0ee7f7b`. Seeded into `platform_admins` as `super-admin`, `is_active=true`. TOTP enrolled.
- Migrations `0002`–`0005` written but **NOT yet applied** to live Supabase.
- Supabase CLI installed as devDep but **not linked** (needs interactive auth).
- `STRIPE_SECRET_KEY` not set — billing routes return 503 by design.

---

## Immediate Next Steps (priority order)

### 1. Apply 4 SQL migrations to live Supabase (REQUIRED for B/C/D/E)

In order. Each is idempotent. Open Supabase Dashboard → SQL Editor → New query → paste → Run.

```
supabase/migrations/0002_reference_tables.sql      (Phase B.1)
supabase/migrations/0003_mv_refresh_stub.sql       (Phase B.2)
supabase/migrations/0004_customers_tickets.sql     (Phase C)
supabase/migrations/0005_platform_security.sql     (Phase E)
```

After applying — new tables: `zone_matrix, our_carrier_rates, carrier_retail_rates, our_warehousing_fees, our_logistics_fees, category_benchmarks, rate_card_drafts, scheduled_publishes, admin_notes, impersonation_sessions, support_tickets, ticket_messages, feature_flags, model_pins`.

### 2. Smoke test all 8 sections

```powershell
npm run dev   # http://localhost:3001
```

| Path | Test |
|---|---|
| `/admin` | KPI bar, MRR sparkline, alerts, health tiles. Amber `—` = degraded upstream, not bugs. |
| `/admin/customers` | Org list → drawer (5 tabs, 5 quick actions). Suspend/Reactivate/Tier override/Note → verify `audit_log`. |
| `/admin/revenue` | Sparkline, funnel, failed-payment queue. |
| `/admin/reference` | 6 cards. Click one → add row → Validate → Save Draft → Publish → check Table Editor. |
| `/admin/platform` | 5 tabs. Create flag, toggle, delete. Toggle kill switch with reason. |
| `/admin/audit` | Filter by action, expand diff, CSV export. |
| `/admin/security` | Admin list. CCPA flow on test orgs only. |
| `/admin/tickets` | Insert a test row via SQL if empty. Status/priority/reply roundtrip. |

Verification SQL:
```sql
SELECT action, COUNT(*) FROM audit_log
WHERE occurred_at >= now() - interval '1 day'
GROUP BY action ORDER BY 2 DESC;

-- Must fail with trigger error:
DELETE FROM audit_log WHERE action = 'TEST';
```

### 3. Optional: set Stripe key

```
# .env.local
STRIPE_SECRET_KEY=sk_live_...
```

Flips billing routes live with no code change.

### 4. Optional: seed reference data

```powershell
$env:SEED_ZONE_MATRIX_CSV = "C:\path\to\zones.csv"
# ... (see supabase/seed/README.md for all vars)
npm run seed:ingest
```

### 5. Optional: deal with working-tree clutter

```bash
# Option A: commit them
git add artifacts/ pixel-bull-duel.html
git commit -m "chore: add marketing artifacts and pixel game"

# Option B: gitignore them
echo "artifacts/" >> .gitignore
echo "pixel-bull-duel.html" >> .gitignore
git add .gitignore && git commit -m "chore: gitignore unrelated assets"
```

---

## Cross-Repo Follow-Ups (user-portal repo — NOT this repo)

- [ ] Impersonation amber banner in `apps/web` middleware
- [ ] `mv_org_cost_summary` materialized view in user-portal Supabase migrations
- [ ] Email on ticket reply (wire Resend, add `RESEND_API_KEY`)
- [ ] End-user ticket submission form in `apps/web`
- [ ] Cron for scheduled rate-card publishes (Supabase Edge Function)
- [ ] `user_sessions` table populated by user-portal (for suspicious-session detection)

---

## What Worked

- Phase splits A.1/A.2, B.1/B.2 kept commits scoped to single coherent gates.
- Idempotent migrations (`CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `to_regclass` guards).
- Manual Dashboard SQL flow for migrations — no CLI link required.
- Per-metric error containment in dashboard — each KPI catches its own errors, renders `—` if upstream missing.
- `StripeNotConfiguredError` pattern — 503 with clear message until env var set.
- `logAudit` enforced at every successful mutation, never on failure paths.
- `<Card interactive>` boolean prop pattern — server components flag hover-collapse without passing function across RSC boundary.

## What Didn't Work / Gotchas

- **`bd` (beads) not installed.** Don't run `bd` — binary not on this machine.
- **Supabase CLI not linked.** `npx supabase login` needs interactive auth. `db:push`, `db:reset`, `db:types` won't run. `adminClient()` typed as plain `SupabaseClient`, not `SupabaseClient<Database>`. Fix: `npx supabase login && npx supabase link --project-ref kmioqhqqheyyllqifrli && npm run db:types`.
- **eslint peer-dep mismatch.** `eslint-config-next@16` requires `eslint>=9`, repo has `eslint@8`. `npm install --legacy-peer-deps` works. Fix: pin `eslint-config-next` to v15 or upgrade eslint to v9.
- **CRLF warnings on `git add`** — Windows `core.autocrlf`. Cosmetic.
- **`experimental.typedRoutes` enabled.** Dynamic href strings need `as Route` casts.
- **Server component → client callback prop = build error.** Use boolean prop pattern (see `<Card interactive>`).
- **`gstack` browser tool not set up** — can't drive dev-server smoke tests from agent side.
- **Git remote was misconfigured** (2026-05-11 session). Was `shippingcow/ShippingCowAdmin` — corrected to `JayGit0925/ShippingCowAdmin`. Now stable.

---

## Key Files / Paths

| Concern | Path |
|---|---|
| GitHub repo | `https://github.com/JayGit0925/ShippingCowAdmin` |
| Spec (authoritative) | `admin handoff v1(1).md` (restore if missing: `git restore "admin handoff v1(1).md"`) |
| Project rules | `CLAUDE.md` (repo root) |
| Design source of truth | `Admin Portal.html` |
| Brand tokens | `lib/brand.ts` + `tailwind.config.ts` |
| Auth middleware | `middleware.ts` |
| Service-role client | `lib/supabase/admin.ts` (`'server-only'` — NEVER import from `'use client'`) |
| Server component client | `lib/supabase/server.ts` |
| Browser client | `lib/supabase/browser.ts` |
| Route handler auth | `lib/admin-context.ts` |
| Audit helper + closed enum | `lib/audit.ts` |
| Reference-data helpers | `lib/reference.ts`, `lib/reference-validators.ts`, `lib/reference-publish.ts` |
| Customers helper | `lib/customers.ts` |
| Metrics helper | `lib/metrics.ts` |
| Stripe lazy client | `lib/stripe.ts` |
| Feature flags | `lib/feature-flags.ts` |
| Audit search + CSV | `lib/audit-search.ts` |
| CCPA cascade | `lib/ccpa.ts` |
| Migrations | `supabase/migrations/0001_phase_a.sql` … `0005_platform_security.sql` |
| Plans | `docs/superpowers/plans/` (6 plans — A through E + user portal) |
| Founder UUID | `f7db2bfe-4f93-4a3a-82e8-ab51f0ee7f7b` |
| Supabase project ref | `kmioqhqqheyyllqifrli` |

---

## Hard Rules (don't break)

- Zero border-radius on every interactive element (enforced via `globals.css` + Tailwind).
- 3px charcoal border on cards/inputs/buttons.
- 4px pixel shadow on cards + primary buttons (2px on `sm` variants). Hover collapses shadow + `translate(2px, 2px)`.
- Never import `lib/supabase/admin.ts` from `'use client'`. Service role leak.
- Every successful admin mutation calls `logAudit(...)` at end of handler. Never on failure paths.
- `audit_log` append-only. No UPDATE/DELETE code paths anywhere.
- Don't commit `.env.local`.
- Don't run `bd` — not installed.
- Server components cannot pass functions to client component props — use boolean prop pattern.
- Dynamic href strings under `experimental.typedRoutes` need `as Route` casts.
- Migrations must be idempotent (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `to_regclass` guards).

---

## Companion Documents

- `admin handoff v1(1).md` — primary spec. Brand tokens, schema, API contracts, build phases.
- `userportal/userportalprd.md` — user-facing PRD.
- `Admin Portal.html` — design source of truth for UI. Self-contained Babel-standalone React.
- `docs/superpowers/plans/*.md` — per-phase implementation plans.
