# HANDOFF — ShippingCow Admin Portal

Last updated: 2026-05-07
Branch: `master` @ `aafca00` (pushed to `origin/master`)
Repo: https://github.com/shippingcow/ShippingCowAdmin (private)

---

## STATUS: All 5 phases code-complete

| Phase | Commit | Code status | Gate status |
|---|---|---|---|
| A.1 — scaffold + auth middleware + audit log | `8159399` | DONE | — |
| A.2 — login form + TOTP enrollment UI | `298c4c1` | DONE | GREEN |
| B.1 — reference data schema + read-only UI | `9801128` | DONE | — |
| B.2 — rate card editor + publish workflow | `3e4e8d0` | DONE | AMBER (MV cross-repo) |
| C — customers + tickets | `2b105f0` | DONE | AMBER (cross-repo email/banner) |
| D — revenue + dashboard | `aea54f7` | DONE | AMBER (Stripe key not set) |
| E — platform + audit + security | `aafca00` | DONE | GREEN |

**Total:** 5 migrations, ~50 routes (incl. 27 mutating API routes), all under admin middleware + MFA + audit logging.

---

## ▶ HUMAN TASKS — RUN THESE IN ORDER

The code is fully built locally + pushed. Now run these to bring the live system in line. **Each task is independent** — you can do them one at a time, in any order, except the migrations (apply in order).

### 1. Apply 4 SQL migrations via Supabase Dashboard SQL editor

In order. Each is idempotent (safe to re-run).

```
supabase/migrations/0002_reference_tables.sql      ← Phase B.1
supabase/migrations/0003_mv_refresh_stub.sql       ← Phase B.2
supabase/migrations/0004_customers_tickets.sql     ← Phase C
supabase/migrations/0005_platform_security.sql     ← Phase E
```

(`0001_phase_a.sql` was applied during A.1.)

For each file: open in your editor, copy contents, paste into Supabase Dashboard → SQL Editor → New query → Run. Then verify Table Editor shows the new tables.

After all four:
- New tables: `zone_matrix, our_carrier_rates, carrier_retail_rates, our_warehousing_fees, our_logistics_fees, category_benchmarks, rate_card_drafts, scheduled_publishes, admin_notes, impersonation_sessions, support_tickets, ticket_messages, feature_flags, model_pins`.
- New function: `public.refresh_mv_org_cost_summary()`.
- Conditional ALTERs hit `subscriptions, orgs, news_items` only if those tables exist (user-portal-owned). If they don't exist yet, the ALTER block prints `RAISE NOTICE` and skips — that's expected.
- One seeded row: `feature_flags.flag_key='mooovy_enabled'` set to default_enabled=true.

### 2. (Optional) Set Stripe key for live billing actions

If you want `/admin/revenue` failed-payment-queue actions (Retry, Refund, Cancel, Coupon) to work:

```bash
# in .env.local
STRIPE_SECRET_KEY=sk_live_...
```

Without it, the four billing routes return HTTP 503 with `"STRIPE_SECRET_KEY not set; billing actions are disabled."` — that's by design.

### 3. Seed reference data (optional, for B.1/B.2 testing)

If you have CSVs:

```bash
# in shell or .env.local — these are read by the seed script
SEED_ZONE_MATRIX_CSV=...
SEED_OUR_CARRIER_RATES_CSV=...
SEED_CARRIER_RETAIL_RATES_CSV=...
SEED_WAREHOUSING_FEES_CSV=...
SEED_LOGISTICS_FEES_CSV=...
SEED_CATEGORY_BENCHMARKS_CSV=...
SEED_EFFECTIVE_FROM=2026-05-07

npm run seed:ingest
```

Or skip and seed via the `/admin/reference/[table]` editor UI directly (smaller tables only — zone_matrix at ~42k rows wants the CSV path).

### 4. Smoke tests — run `npm run dev` once, exercise each section

```bash
npm run dev   # http://localhost:3001
```

Log in with founder TOTP (was set up during A.2 smoke test). Go through each section:

| Path | Smoke test |
|---|---|
| `/admin` | KPI bar shows 6 cells. Cells render `—` if upstream tables missing — that's degraded, not broken. MRR sparkline shows "No data yet" or a chart. Alert queue + health tiles render. |
| `/admin/customers` | Org list. If user-portal `orgs/subscriptions/org_members` are not migrated, expect "Upstream tables missing" amber card — that's degraded, not broken. |
| `/admin/customers/<orgId>` | If you have at least one org, click into it → drawer with 5 tabs + 5 quick-action buttons. Suspend → reactivate roundtrip. Tier override (super-admin only). Add admin note. |
| `/admin/revenue` | New-MRR sparkline + funnel + failed-payment queue. Funnel labelled "degraded" if `subscription_events` table absent. |
| `/admin/reference` | 6 cards with row counts + last effective date. "N DRAFTS OPEN" badge if you started any drafts. |
| `/admin/reference/our-warehousing-fees` | Smallest table — easiest to test the publish flow. Add row → Validate → Save Draft → Publish → confirm row in Table Editor with `effective_from` set. Publish a second time with later `effective_from` → expect "Superseded 1". MV refresh shows "skipped (no MV)" because user-portal hasn't created `mv_org_cost_summary` yet — by design. |
| `/admin/reference/<slug>/history` | Shows draft + scheduled publish lists. |
| `/admin/platform` | Tabs for Flags, Kill switch, Model pins, News queue, Quotas. Create a flag, toggle, edit, delete. |
| `/admin/audit` | Filterable list. Create some mutations elsewhere (publish a rate card, suspend an org) and verify entries appear here. Click "SHOW DIFF" — expand before/after JSON. Click "EXPORT CSV" — downloads. |
| `/admin/security` | Admin list (deactivate yourself? don't). Suspicious-sessions degrades to "no data" if `user_sessions` table missing. CCPA form: type a real org id → Preview cascade → see counts → type "ERASE <name>" → execute (destructive — only do this on a test org). |
| `/admin/tickets` | Split-pane. If `support_tickets` table empty, list shows "No tickets". Insert a row via SQL editor manually if you want to exercise reply/status/priority/assign. |

### 5. Cross-repo follow-ups (NOT in this repo)

These items belong to the user-portal repo (`apps/web`) or external integrations:

- **Impersonation amber banner** — when admin clicks Impersonate on a customer drawer, this admin portal generates an `impersonation_sessions` row + redirects to `${USER_PORTAL_URL}/impersonate?session=<id>`. The user-portal middleware needs to detect that `?session=` param, look up the session, mount it as the user's session, and render an amber "Admin session active — expires in N min" banner.
- **`mv_org_cost_summary` materialized view** — needs to be created in the user-portal repo's Supabase migrations. Once created, the `refresh_mv_org_cost_summary()` stub function this repo installed will Just Work — no further code change here.
- **Email notifications on admin ticket reply** — needs Resend (or similar) wired up in the admin portal's `tickets/reply` route. RESEND_API_KEY env var. Deferred.
- **`apps/web` ticket submission form** — user-side. Inserts into `support_tickets` + `ticket_messages`.
- **Cron-triggered scheduled publishes** — Supabase Edge Function on a 1-hour cron that scans `scheduled_publishes WHERE status='pending' AND effective_from <= today`, calls the publish path, flips status. Deferred (CLI link not configured).
- **Suspicious-session detection upstream** — user-portal must populate `user_sessions(user_id, ip, country, city, latitude, longitude, created_at)` on each login.

---

## Goal (original)

Ship Phase A of the ShippingCow Admin Portal per `admin handoff v1(1).md` §11.
Phase A gate: founder logs into `/admin`, sees sidebar, non-admin blocked at `/403`, audit log table exists.

Phase A split into:
- **A.1** — scaffold + auth middleware + DB schema + founder seed (DONE)
- **A.2** — `/login` form + `/admin/setup-mfa` TOTP enrollment UI (DONE — Phase A gate closed)

---

## Current Progress

### Phase A.1 — DONE (commit `8159399`)
- Next.js 14 App Router, TS strict, Tailwind + brand tokens (`lib/brand.ts`, `tailwind.config.ts`).
- Supabase clients: `lib/supabase/admin.ts` (service-role, `server-only`) + `lib/supabase/server.ts` (anon cookie-bound).
- Env gate `lib/env.ts` → `SUPABASE_CONFIGURED` flag; DEV_BYPASS when env unset.
- Auth middleware (`middleware.ts`): session → `platform_admins` row → MFA factor presence → redirect chain (`/login`, `/403`, `/admin/setup-mfa`).
- 8 admin route placeholders + `/403` + `/login` + `/admin/setup-mfa` (latter two are stubs, see A.2 below).
- Sidebar + topbar shell (`components/shell/`), UI primitives (`components/ui/`: badge/button/card/eyebrow/tab-bar/trend-arrow).
- Audit helper `lib/audit.ts` with closed `AuditAction` enum.
- Migration `supabase/migrations/0001_phase_a.sql` — `platform_admins` + `audit_log` (append-only RLS + trigger guard).
- Reference docs preserved at root: `Admin Portal.html`, `admin handoff v1(1).md`, `ShippingCow_Admin_Portal_PRD.docx`, `brandguide/`, `homepage/`, `landingpage/`, `userportal/`, `tweaks-panel.jsx`.

### Live infra state
- Supabase project provisioned. Env keys filled in `.env.local` (gitignored).
- Migration run via Supabase Dashboard SQL Editor — both tables exist with RLS + triggers.
- Founder auth user created via Dashboard. UID `f7db2bfe-4f93-4a3a-82e8-ab51f0ee7f7b`.
- Founder seeded into `platform_admins` as `super-admin`, `is_active=true`.
- TOTP factor enabled in Supabase Auth settings.
- Browser smoke check passed: `/admin` → redirects `/login` (env loaded, dev-bypass off).

### GitHub state
- Active `gh` account = `shippingcow` (HTTPS, valid token).
- Secondary account `JayGit0925` still in keyring, inactive.
- Repo created + initial commit pushed.

---

## What Worked

- **Single migration file approach** (`supabase/migrations/0001_phase_a.sql`) run manually via Dashboard — fits user's "via supabase dashboard" preference; no Supabase CLI dependency.
- **Append-only audit_log via RLS policies + trigger guards on UPDATE/DELETE** — defense in depth (service-role bypasses RLS, trigger catches it).
- **Splitting Phase A into A.1 + A.2** rather than attempting full gate in one pass. Matched user's "slow and steady" preference.
- **`gh repo create --source=. --push`** one-shot create + push after reauth.

---

## What Didn't Work / Gotchas

- **`bd` (beads) issue tracker not installed** despite CLAUDE.md mandate. Real `bd` is `steveyegge/beads` (Go binary). `winget` only finds unrelated `GasTownHall.Beads`. User deferred install. Currently using markdown reasoning + this handoff doc for state. **Do not invoke `bd` commands — they will fail.**
- **`/login` and `/admin/setup-mfa` are stubs.** `/login/page.tsx` only shows a placeholder paragraph. `/admin/setup-mfa/page.tsx` literally says "wired in Phase A.2". Do not assume auth UI works. Founder cannot actually authenticate yet.
- **Port 3001 already had a `next dev` running** when we tried to restart. Did not kill it — user's existing tab worked fine after env hot-reload (browser hard refresh).
- **`gh auth` had two accounts**, `shippingcow` had invalid token. User reauth'd via web flow — non-automatable from agent.
- **CRLF warnings on every `git add`** — Windows default `core.autocrlf`. Cosmetic, ignore.
- **`bash` on this box does not have `command -v` resolving win-PATH binaries** consistently. Use `where` (cmd) or PowerShell `Get-Process` for process inspection.

---

## Phase A.2 — DONE

- `lib/supabase/browser.ts` — `createClientComponentClient` factory for client components.
- `app/login/page.tsx` — `'use client'` two-step form: email/password → if `nextLevel==='aal2'` && `currentLevel==='aal1'`, render TOTP challenge (6-digit) → `mfa.challenge` + `mfa.verify` → `router.push('/admin')`. If user already verified, jumps straight to `/admin`. If middleware needs setup-mfa, redirects there.
- `app/admin/setup-mfa/page.tsx` — `'use client'`. On mount: list factors, push to `/admin` if verified TOTP exists; else unenroll any unverified TOTP, call `mfa.enroll({ factorType: 'totp' })`, render QR (data URL) + manual secret. 6-digit input → `mfa.challenge` + `mfa.verify` → `/admin`.
- Smoke test passed: founder login → MFA enroll → `/admin` reachable. Second non-admin user → `/403`. `audit_log` table empty (no mutations yet, expected).

## Phase B.1 — DONE (read-only reference data UI)

Per `docs/superpowers/plans/2026-05-06-phase-b-reference-data.md`, adapted to the manual-Dashboard migration flow established in A.1 (no Supabase CLI link).

- `package.json` — added devDeps `csv-parse`, `tsx`, `supabase` + scripts `db:push`, `db:reset`, `db:types`, `seed:ingest`. Note: `db:push` / `db:reset` require `supabase link` which is not configured; use Dashboard SQL editor for migrations until linking is set up.
- `.gitignore` — added `supabase/.branches`, `supabase/.temp/`.
- `supabase/migrations/0002_reference_tables.sql` — 6 reference tables (`zone_matrix`, `our_carrier_rates`, `carrier_retail_rates`, `our_warehousing_fees`, `our_logistics_fees`, `category_benchmarks`) + `rate_card_drafts` + `scheduled_publishes`. All idempotent (`CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS`). Deny-all RLS on every table. Applied via Dashboard SQL editor.
- `components/ui/data-table.tsx` — generic paginated read-only DataTable with brand styling.
- `components/ui/card.tsx` — added `interactive?: boolean` prop so server components can flag hover-collapse without passing a function.
- `lib/reference.ts` — table metadata (slugs, titles, descriptions, column configs) for all 6 tables. No `Database` type dependency (manual flow → no generated types yet).
- `app/admin/reference/page.tsx` — replaces Phase A placeholder. Server component, `force-dynamic`. Renders 6 cards with live row counts + last `effective_from` per table. Shows `ERR / NOT APPLIED` if a table query errors (e.g., migration not yet run).
- `app/admin/reference/[table]/page.tsx` — per-table read-only paginated view via DataTable. Reads up to 200 rows. Bogus slug → `notFound()`. Errors are caught and rendered as a red Card.
- `supabase/seed/README.md` + `supabase/seed/ingest-csvs.ts` — `tsx`-runnable CSV seed script. `npm run seed:ingest` reads `SEED_*_CSV` env vars, upserts into the 6 tables in chunks of 1000 with the table's natural unique key as the conflict target. Re-runnable.
- `CLAUDE.md` — added `## Database` section documenting the manual migration workflow, RLS posture, effective-date semantics, and seed flow.

### What's NOT in B.1
- Supabase CLI project linking (deferred — requires interactive `supabase login` + DB password). Without linking, `db:push`, `db:reset`, `db:types` scripts will not run.
- `lib/supabase/types.ts` (generated DB types) — deferred until CLI linking lands. `adminClient()` remains untyped (`SupabaseClient`, not `SupabaseClient<Database>`); reference tables use `Record<string, unknown>` rows.
- npm peer-dep conflict — `eslint-config-next@16.2.5` requires `eslint@>=9` but the repo has `eslint@8.57.x`. `npm install --legacy-peer-deps` works around it. `next lint` and `next build`'s lint pass both error out on a circular-config issue but the actual TypeScript build succeeds. Fix path: pin `eslint-config-next` to a v15 that supports eslint v8, or upgrade eslint to v9.

## Phase B.2 — DONE (publish workflow + editor + history)

Implements 4-step workflow (Edit → Validate → Preview Impact → Publish) per spec §11. Three pieces stub-only with reasons documented; not blocking gate.

### Migrations
- `supabase/migrations/0003_mv_refresh_stub.sql` — defines `public.refresh_mv_org_cost_summary()` as a `SECURITY DEFINER` function that tries `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_org_cost_summary`, catches `undefined_table` and `feature_not_supported` exceptions, falls back to non-concurrent refresh when concurrent fails, and returns `false` if the MV doesn't exist. Lets the publish path complete cleanly on a database where the user-portal MV hasn't been created yet. Granted to `service_role` only.

### lib
- `lib/audit.ts` — extended `AuditAction` enum with `RATE_CARD_DRAFT_CREATE`, `RATE_CARD_DRAFT_UPDATE`, `RATE_CARD_DRAFT_DISCARD`, `RATE_CARD_SCHEDULE`, `RATE_CARD_CSV_IMPORT`. (`RATE_CARD_PUBLISH` already existed.) `audit_log.action` is a free-form `text` column; the enum is enforced only at the application layer.
- `lib/admin-context.ts` — `getAdminContext(req)` reads `x-admin-role` from middleware-set header + `actor_user_id` from the route-handler-bound supabase session. Throws `Response(401)` / `Response(403)` for the route to short-circuit. DEV_BYPASS path returns a synthetic super-admin context when env unconfigured.
- `lib/reference-validators.ts` — per-table validators (zone_matrix, carrier rates, fee tables, category benchmarks) producing `ValidationResult { ok, issues, rowCount }`. Carrier-rate validator detects overlapping weight bands within the same `(carrier, service, zone)`.
- `lib/reference-publish.ts` — `applyDraftAsPublished(table, rows)` performs the supersede-and-insert sequence: for each draft row, sets the prior live row's `effective_to = effective_from - 1` (matched by the table's natural business key), then bulk-inserts the draft rows, then RPC-calls `refresh_mv_org_cost_summary`. Returns `{ newRows, superseded, mvRefreshed, mvError }`.

### API routes (all under `/api/admin/reference/[table]/*`, all `nodejs` + `force-dynamic`, all behind admin middleware)
- `POST .../draft` — create or update an open draft (write `draft_payload` + `validation_result` JSON). Audits `RATE_CARD_DRAFT_CREATE` or `RATE_CARD_DRAFT_UPDATE`.
- `POST .../validate` — runs the pure validator and echoes results. No DB writes, no audit.
- `POST .../publish` — re-runs validation; returns 422 on failure. Otherwise calls `applyDraftAsPublished`, marks the draft `status='published'`, and audits `RATE_CARD_PUBLISH` with the publish outcome.
- `POST .../schedule` — inserts a `scheduled_publishes` row with `status='pending'` and an `effective_from` date. Audits `RATE_CARD_SCHEDULE`. (Cron trigger that flips pending → published is **not** in this phase — see "What's NOT in B.2" below.)
- `POST .../csv` — accepts a `text/csv` body, parses with `csv-parse/sync`, coerces rows per-table to typed payload, runs validator, inserts as a new draft. Audits `RATE_CARD_CSV_IMPORT`.
- `POST .../discard` — flips a draft from `draft` to `discarded`. Audits `RATE_CARD_DRAFT_DISCARD`.
- `POST .../preview-impact` — returns 501 with the reason `"requires the shipments table, which is delivered in Phase C"`. Editor UI surfaces this to the user as an info banner.

### UI
- `app/admin/reference/page.tsx` — adds a yellow "N DRAFTS OPEN" badge per table card when `rate_card_drafts.status='draft'` rows exist. New `Promise.all` of three queries (count, latest, drafts) per card.
- `app/admin/reference/[table]/page.tsx` — splits view into "currently published" DataTable on top and `<ReferenceEditor>` on bottom. If an open draft exists, the editor seeds from that draft's payload; otherwise from the currently-published rows. Adds `HISTORY` link in eyebrow.
- `app/admin/reference/[table]/_editor.tsx` — `'use client'` editor: cell-by-cell `<input>` per column, add/remove row, file picker for CSV upload, action bar with Validate / Save Draft / Publish / Preview Impact / Discard / Schedule. Each action posts to the matching API route, surfaces validation issues + publish outcome inline. Brand-styled (3px borders, pixel shadow, zero radius).
- `app/admin/reference/[table]/history/page.tsx` — drafts table (last 100, oldest first by `created_at`) + scheduled publishes table (last 100). Status colored: published=green, draft=blue, discarded/cancelled=red, pending=amber. Trailing card explains the cross-repo MV refresh contract.

### What's NOT in B.2 (deferred with explicit reasons)
- **Preview Impact recalculation** — depends on a `shipments` table (Phase C). Until then the route returns 501 + reason.
- **Cron-trigger for scheduled publishes** — Supabase Edge Function + cron. Requires CLI linking + deploy step. Schedule rows accumulate in `scheduled_publishes` with `status='pending'` until a cron worker (or manual operator) flips them.
- **`mv_org_cost_summary` materialized view itself** — user-portal repo's responsibility. The stub function in `0003_mv_refresh_stub.sql` lets publish complete cleanly until the MV is delivered.
- **Diff view + rollback** — version history page lists drafts but does not visualize column-level diffs against the prior published version, and there is no one-click rollback. Adding both is a UI-only follow-up over the existing data.
- **Spreadsheet-grade editor** — current editor is a basic table of `<input>` cells. No keyboard navigation, no copy/paste from Excel, no column type hints. `react-data-grid` integration is the obvious upgrade path.
- **Supabase CLI project linking + generated types** — still not configured (carry-over from B.1). All reference rows remain typed as `Record<string, unknown>`.
- **eslint peer-dep mismatch** — still present (carry-over from B.1).

## Phase B Gate (per spec §11)
> **Gate:** Founder can publish a rate card. `mv_org_cost_summary` refreshes. User dashboard shows updated numbers.

Status: **PARTIAL.** Founder can publish via `/admin/reference/[table]`; rows enter the live tables with correct `effective_from/to` windowing. MV refresh attempts but no-ops if the MV doesn't yet exist (Phase B blocker is upstream — user-portal MV migration). Gate flips to GREEN when the user-portal repo lands `mv_org_cost_summary`.

## Next Steps

- Apply `supabase/migrations/0002_reference_tables.sql` and `0003_mv_refresh_stub.sql` in the Supabase Dashboard SQL editor (in that order).
- Manual smoke test: log in → `/admin/reference/our-warehousing-fees` (smallest table to start) → add 1-2 rows → Validate → Save Draft → Publish → confirm row appears in Table Editor with correct `effective_from`. Run a second publish to confirm the prior row's `effective_to` is set.
- Coordinate with user-portal repo to land `mv_org_cost_summary` migration. Once landed, B.2 publish will refresh it automatically (the stub function gets shadowed by the user-portal's real definition).
- Phase C (Customers + Tickets) and Preview Impact unblock once `shipments` table arrives.

---

## Key Files / Paths

| Concern | Path |
|---|---|
| Spec (authoritative) | `admin handoff v1(1).md` |
| Project rules | `CLAUDE.md` (root) and `C:\Users\andyg\OneDrive\Desktop\github\CLAUDE.md` |
| Design source of truth | `Admin Portal.html` |
| Brand tokens | `lib/brand.ts` + `tailwind.config.ts` |
| Auth middleware | `middleware.ts` |
| Audit helper | `lib/audit.ts` (closed enum — extend only when adding new mutations) |
| Server Supabase | `lib/supabase/server.ts` (cookie-bound, anon) |
| Service-role Supabase | `lib/supabase/admin.ts` (`server-only`, NEVER import from `'use client'`) |
| Migration | `supabase/migrations/0001_phase_a.sql` |
| Founder UUID | `f7db2bfe-4f93-4a3a-82e8-ab51f0ee7f7b` |

---

## Hard Rules (don't break)

- Zero border-radius on every interactive element.
- 3px charcoal border on cards/inputs/buttons.
- 4px pixel shadow on cards + primary buttons (2px on sm). Hover collapses shadow + `translate(2px, 2px)`.
- Never import `lib/supabase/admin.ts` from `'use client'`. Service role leak.
- Every successful admin mutation must call `logAudit(...)` at end. Never on failure paths.
- `audit_log` is append-only — no UPDATE/DELETE code paths anywhere.
- Don't commit `.env.local`. `.gitignore` covers it.
- Don't run `bd` — not installed.
