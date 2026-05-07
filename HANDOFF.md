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

## Next Steps — Phase B (Reference Data)

Reference Data = 6 tables + publish workflow. Blocks user portal analytics. See `admin handoff v1(1).md` §11.

Per spec, Phase B builds:
- Reference data tables (carriers, services, surcharges, fuel surcharges, accessorials, zone_maps).
- Draft → Published workflow with effective-date windowing.
- Admin CRUD UI under `/admin/reference`.
- Server actions or `/api/admin/reference/*` route handlers (call `assertAdminRole` once built — Phase C — for now, middleware role header `x-admin-role` suffices).
- Every successful mutation calls `logAudit(...)` with appropriate `AuditAction`. Extend the closed enum in `lib/audit.ts` only when adding new mutations.

Sub-split suggestion:
- **B.1** — schema migration (`0002_phase_b_reference.sql`) for the 6 tables + publish state column + RLS.
- **B.2** — `/admin/reference` list + detail UI per table type.
- **B.3** — publish workflow (draft → published, effective-date guard, supersede prior published row).

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
