# HANDOFF — ShippingCow Admin Portal

Last updated: 2026-05-11
Branch: `master` (pushed to `https://github.com/JayGit0925/ShippingCowAdmin`)
Project root: `C:\Users\andyg\OneDrive\Desktop\github\shippingcowadmin`
Spec (authoritative): `admin handoff v1(1).md` (WARNING: deleted locally — see below)

---

## Goal

Build the ShippingCow Admin Portal — internal Next.js 14 admin surface for ShippingCow Calf/Cow/Bull tier e-commerce logistics SaaS. Eight sections: Dashboard, Customers, Revenue, Rate Cards, Platform Controls, Audit Log, Security, Tickets. Admin portal connects to same Supabase project as user-portal (separate repo).

---

## Status: All 5 phases code-complete + pushed to GitHub

| Phase | Surface | Code | Live gate |
|---|---|---|---|
| A.1 | Foundation scaffold + auth middleware + audit log + 8 placeholder routes | DONE | — |
| A.2 | `/login` form + `/admin/setup-mfa` TOTP enrollment | DONE | GREEN (smoke-tested) |
| B.1 | Reference data schema + read-only `/admin/reference` UI | DONE | DEPENDS on migration 0002 |
| B.2 | Rate card editor + 4-step publish workflow + history page | DONE | AMBER (mv_org_cost_summary in user-portal repo) |
| C | `/admin/customers` + drawer + 7 org actions + `/admin/tickets` + 4 ticket actions | DONE | AMBER (cross-repo email/banner) |
| D | `/admin` (Dashboard) + `/admin/revenue` + 4 Stripe action handlers | DONE | AMBER (`STRIPE_SECRET_KEY` not set; routes return 503) |
| E | `/admin/platform` + `/admin/audit` + `/admin/security` + 13 routes | DONE | GREEN |

~50 routes total. Typecheck clean. `npm run build` green.

---

## Session 2026-05-11 Changes

- **Fixed git remote URL.** Was wrong (`shippingcow/ShippingCowAdmin`) — corrected to `JayGit0925/ShippingCowAdmin`. GitHub has the repo at `https://github.com/JayGit0925/ShippingCowAdmin`.
- **Pushed code to GitHub.** First successful push — all 10 commits now on remote.
- **`admin handoff v1(1).md` is deleted locally (unstaged).** This was the primary spec doc. The deletion is NOT committed. To restore: `git restore "admin handoff v1(1).md"`. Do this before any spec-sensitive work.
- **Untracked clutter in working tree:**
  - `artifacts/` — marketing images (Mother's Day poster, philosophy doc). Unrelated to app.
  - `pixel-bull-duel.html` — mini-game. Unrelated to app.
  - Decide: commit these, gitignore them, or delete them.

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

### 1. Restore deleted spec doc (before anything else)

```bash
git restore "admin handoff v1(1).md"
```

### 2. Apply 4 SQL migrations to live Supabase (REQUIRED for B/C/D/E)

In order. Each is idempotent. Open Supabase Dashboard → SQL Editor → New query → paste → Run.

```
supabase/migrations/0002_reference_tables.sql      (Phase B.1)
supabase/migrations/0003_mv_refresh_stub.sql       (Phase B.2)
supabase/migrations/0004_customers_tickets.sql     (Phase C)
supabase/migrations/0005_platform_security.sql     (Phase E)
```

After applying — new tables: `zone_matrix, our_carrier_rates, carrier_retail_rates, our_warehousing_fees, our_logistics_fees, category_benchmarks, rate_card_drafts, scheduled_publishes, admin_notes, impersonation_sessions, support_tickets, ticket_messages, feature_flags, model_pins`.

### 3. Smoke test all 8 sections

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

### 4. Optional: set Stripe key

```
# .env.local
STRIPE_SECRET_KEY=sk_live_...
```

Flips billing routes live with no code change.

### 5. Optional: seed reference data

```powershell
$env:SEED_ZONE_MATRIX_CSV = "C:\path\to\zones.csv"
# ... (see supabase/seed/README.md for all vars)
npm run seed:ingest
```

### 6. Deal with working-tree clutter

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
- **`admin handoff v1(1).md` deleted locally (unstaged).** Restore with `git restore "admin handoff v1(1).md"` before spec-sensitive work.
- **Git remote was misconfigured.** Was `shippingcow/ShippingCowAdmin` — fixed to `JayGit0925/ShippingCowAdmin` in 2026-05-11 session.

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
