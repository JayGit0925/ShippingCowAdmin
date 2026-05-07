# HANDOFF — ShippingCow Admin Portal

Last updated: 2026-05-07
Branch: `master` @ `8159399` (pushed to `origin/master`)
Repo: https://github.com/shippingcow/ShippingCowAdmin (private)

---

## Goal

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

## Next Steps — Phase B.2 (publish workflow)

Per spec §11 + plan "Out of scope" section:
- 4-step UI: Edit → Validate → Preview Impact → Publish.
- Inline spreadsheet editor (`react-data-grid` or similar).
- `POST /api/admin/reference/[table]/validate` route handler.
- `POST /api/admin/reference/[table]/preview-impact` route handler.
- Publish path that writes to `rate_card_drafts.status = 'published'`, sets prior published row's `effective_to`, refreshes downstream materialized views (`mv_org_cost_summary` lives in user-portal repo, not admin — coordinate cross-repo).
- Version history tab + diff view + roll back.
- Scheduled-publish auto-trigger via Edge Function cron.
- CSV import UI (currently CLI-only via the seed script).

Before B.2:
- Set up Supabase CLI linking so type generation (`db:types`) works. This unblocks proper typing of reference table writes.
- Resolve eslint peer-dep mismatch.

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
