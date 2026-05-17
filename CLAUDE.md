# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

ShippingCow Admin Portal. Internal-only admin surface for the ShippingCow platform (a Calf/Cow/Bull tier e-commerce logistics SaaS). Eight sections: Dashboard, Customers, Revenue, Rate Cards, Platform, Audit Log, Security, Tickets.

The repo started as a design prototype (`Admin Portal.html` is a Babel-standalone React file that boots the entire UI from a single HTML page). The Next.js 14 App Router app at the repo root is the production target. The HTML prototype is the **design source of truth** for visuals — when porting screens, lift markup verbatim from `Admin Portal.html` and convert `style={{...}}` blocks intact.

The full specification lives in `admin handoff v1(1).md`. **That document wins** where it conflicts with these notes or the user PRD (`userportal/userportalprd.md`). Read it before any non-trivial UI work.

## Commands

```bash
npm install         # first run
npm run dev         # http://localhost:3001
npm run build       # production build
npm run lint
npm run typecheck   # tsc --noEmit

npm test                       # vitest run --passWithNoTests
npm run test:watch             # vitest watch
npm run test:e2e               # playwright (requires `npm run test:e2e:install` once)
npx vitest run path/to/file    # single test file
npx vitest -t "case name"      # single test by name

npm run db:push                # supabase db push (CLI; project link not currently set up — see Database)
npm run db:types               # regenerate lib/supabase/types.ts
npm run seed:ingest            # ingest CSVs (needs SEED_*_CSV env vars)

npm run rate-audit             # scripts/rate-audit.ts — validates RATES vs real data
npm run copy-optimizer         # scripts/copy-optimizer.ts
npm run icp-monitor            # scripts/icp-monitor.ts
```

## Architecture

**Standalone Next.js 14, App Router, TypeScript strict.** Not a Turborepo (the handoff doc describes one but this repo is single-app — migration is a future decision, not a current one).

**Server vs client boundary is critical.** The admin portal uses two Supabase clients:

- `lib/supabase/admin.ts` — service-role key, **bypasses RLS**. Importable only from server components, route handlers, and middleware. Marked with `import 'server-only'`.
- `lib/supabase/server.ts` — anon-key cookie-bound client for ordinary RSC reads.

If you find yourself importing `adminClient` in a `'use client'` file, stop. The build still passes because `'server-only'` checks at runtime, not build time, but you've leaked the service role.

**Auth flow:** `middleware.ts` runs on `/admin/:path*` and `/api/admin/:path*`. It checks Supabase session (→ `/login` if missing) and `platform_admins.is_active` (→ `/403` if missing/inactive), then stamps `x-admin-role` on the response so downstream handlers can read it without re-querying. MFA is not enforced in middleware today — if you re-introduce it, add the check here. When `SUPABASE_CONFIGURED` is false (no env vars), middleware short-circuits with `x-dev-bypass: 1` and `x-admin-role: super-admin` so local dev works without infra. Production must set all three Supabase env vars.

**Route-handler identity:** server routes call `getAdminContext(req)` from `lib/admin-context.ts` to resolve `{ actorId, actorRole, ip }`. It trusts the middleware-stamped `x-admin-role` header when present and falls back to a `platform_admins` lookup otherwise. In dev-bypass mode it returns a fixed super-admin context. Use this — there is no separate `assertAdminRole` function.

**Audit logging:** every successful admin mutation must call `logAudit({...})` from `lib/audit.ts` at the end of the handler. The action enum is closed (see `AuditAction` type) — add new actions only when adding new mutations. Never call `logAudit` on failure paths. The `audit_log` table is append-only at the RLS level; do not write code that updates or deletes from it.

**Brand system:** `lib/brand.ts` exports the `BRAND` color tokens, `px()` / `pxSm()` shadow helpers, and `FONT` stack. Tailwind theme in `tailwind.config.ts` mirrors the same tokens (`bg-brand-blue`, `shadow-px`, etc.) so either approach works. Component styling in this codebase tends to use inline `style={{...}}` — match that. The non-negotiable rules:

- Zero border-radius on every interactive element. Already enforced via `globals.css` and Tailwind config.
- 3px charcoal border on cards/inputs/buttons.
- 4px pixel shadow on cards and primary buttons (2px on small variants).
- Hover state collapses shadow to none + `translate(2px, 2px)`.

**UI primitives** in `components/ui/` (Badge, Button, Card, Eyebrow, TabBar, TrendArrow) are the canonical implementations. The `.jsx` files in `components/` and the `Admin Portal.html` script block contain older versions using `window` globals — read them for design reference, never import them.

## Conventions

- File names lowercase-kebab. Component exports PascalCase.
- **Validate before publishing:** Any rate, savings number, or DIM claim on a public page must be confirmed against real rate data before the page is promoted or DMs go out. Edit `RATES` in `lib/rate-calc.ts` (the source of truth — shared by UI and audit scripts) and hero copy in `app/page.tsx`.
- TS strict mode, no `any`, no `// @ts-expect-error` without comment explaining why.
- Server components default. Use `'use client'` only when you need state, effects, or browser APIs.
- Inline `style={{...}}` is fine and matches the prototype. Tailwind utility classes are also fine. Don't mix on the same element.
- Route handlers under `app/api/admin/*` must call `getAdminContext(req)` for actor identity and `logAudit` on success.
- Destructive UI actions (suspend, deactivate, kill switch) need a typed-confirmation modal. Don't skip this.
- Never commit `.env.local`. `.env.example` is the template.

## Build phase status

Re-derive this from the tree before trusting it — phases land in slices and this section drifts.

- **Phase A** (auth, brand, shell, audit log skeleton): shipped. Migration `0001_phase_a.sql`.
- **Phase B** (Reference Data): shipped. `app/api/admin/reference/*`, `lib/reference-publish.ts`, `lib/reference-validators.ts`, migrations `0002_reference_tables.sql` + `0003_mv_refresh_stub.sql`.
- **Phase C** (Customers + Tickets): partial. `app/admin/{customers,tickets}/`, `lib/customers.ts`, `app/api/admin/{orgs,tickets,billing}/`, migration `0004_customers_tickets.sql`.
- **Phase D** (Revenue + Dashboard): partial. `app/admin/revenue/`, `app/admin/_kpi-bar.tsx` / `_mrr-chart.tsx` / `_alert-queue.tsx` / `_health-tiles.tsx`, `lib/metrics.ts`, `lib/stripe.ts`.
- **Phase E** (Platform + Audit + Security): partial. `app/admin/{platform,security,audit}/`, `lib/{ccpa,feature-flags}.ts`, `app/api/admin/{platform,security,audit}/`, migration `0005_platform_security.sql`.
- **Beyond the original handoff**: public quote-request flow (`app/api/quote-request/`, migration `0006_quote_requests.sql`); DM tracker (`app/admin/dm-tracker/`, `app/api/admin/dm-tracking/`, migration `0007_dm_tracking.sql`); `@anthropic-ai/sdk` for the copy/ICP scripts.

The full backlog is in `admin handoff v1(1).md` §11 + §14.

The user portal app (`apps/web` in the handoff) is not in this repo. It lives at `../shippingcow-nextjs/` or `../ShippingCow/` (separate repos). The admin portal connects to the same Supabase project as the user portal, but the two are deployed independently.

## Database

Supabase is the single source of truth for all data. Migrations live in `supabase/migrations/` as numbered SQL files (e.g. `0001_phase_a.sql`, `0002_reference_tables.sql`). They are applied **manually via the Supabase Dashboard SQL Editor** — paste, run, verify in Table Editor. The Supabase CLI is installed as a devDependency (`npx supabase ...`) and can be used later for type generation, but project linking is not currently set up.

**Migration workflow:**
1. Write `supabase/migrations/000N_<name>.sql` using `CREATE TABLE IF NOT EXISTS` + `DROP POLICY IF EXISTS` so it's idempotent.
2. Apply via Supabase MCP (`apply_migration`) against project `aetvueyuaxbgszcisoci` (shippingcow-admin-prod, us-east-1) — that's how 0001–0005 went out. Dashboard SQL Editor is the manual fallback.
3. Verify Table Editor reflects the new schema and append to `docs/migrations-applied.md`.
4. Commit the SQL file.

**RLS posture:** every table has explicit policies. Most have `using (false) with check (false)` — meaning end-users cannot read or write directly; only the service role (admin portal via `adminClient()`) can. The `audit_log` table additionally uses BEFORE UPDATE/DELETE triggers to physically reject mutations even from the service role.

**Reference tables** (`zone_matrix`, `our_carrier_rates`, `carrier_retail_rates`, `our_warehousing_fees`, `our_logistics_fees`, `category_benchmarks`) carry `effective_from` / `effective_to` dates so historical analytics keep their original rates. Never UPDATE a published row to change a rate — instead insert a new row with a new `effective_from`, and set the old row's `effective_to` to the day before. The Phase B.2 publish workflow automates this.

**Seed data** is not in migrations. Run `npm run seed:ingest` with the `SEED_*_CSV` env vars set (see `supabase/seed/README.md`).

**Reference data publish flow (Phase B.2):** edits go through `rate_card_drafts` (a draft row holds the proposed `draft_payload` + `validation_result`). On publish, `lib/reference-publish.ts` supersedes prior live rows for each business key (sets `effective_to = effective_from - 1`) and inserts the new rows, then RPC-calls `public.refresh_mv_org_cost_summary()` (a stub function in this repo that no-ops if the MV doesn't yet exist; user-portal repo overwrites with the real refresh). All mutating routes live under `app/api/admin/reference/[table]/*` and call `getAdminContext` for actor identity + `logAudit` on success.

## Deployment & CI

- **Prod URL:** `https://shippingcow-admin.vercel.app` (Vercel project `prj_CkdfeN1Em0EjFUtncRn9u0Rkv5ue`). `git push origin master` triggers auto-deploy.
- **CI** (`.github/workflows/ci.yml`) runs `typecheck → build → test` on PR/push to master. The build step uses placeholder Supabase values plus `DEV_BYPASS=1` so it can compile without real secrets — match that pattern if you add env-dependent code paths.
- **Install flag:** CI uses `npm install --legacy-peer-deps`. Use the same flag locally if a fresh install fails.

## Services & env gating

- **Supabase** — required for everything. If any of the three keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are missing, `SUPABASE_CONFIGURED` flips false and middleware enters dev-bypass.
- **Stripe** — `STRIPE_SECRET_KEY` gates `/admin/revenue` billing actions. Routes under `app/api/admin/billing/*` return HTTP 503 with a clear "Stripe not wired" message when unset, so the rest of the portal stays usable in dev.
- **Anthropic / Resend** — `ANTHROPIC_API_KEY` powers `scripts/{copy-optimizer,icp-monitor}.ts`. `RESEND_API_KEY` is Phase E (not wired yet).

## Companion documents

- `admin handoff v1(1).md` — primary spec. Brand tokens, schema, API contracts, build phases.
- `userportal/userportalprd.md` — user-facing PRD, cited from the handoff.
- `ShippingCow_Admin_Portal_PRD.docx` — original PRD; superseded by the handoff doc where they conflict.
- `Admin Portal.html` — design source of truth for UI. Self-contained Babel-standalone React.
