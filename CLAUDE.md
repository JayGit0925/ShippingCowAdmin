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
```

No test runner wired yet (Phase B+).

## Architecture

**Standalone Next.js 14, App Router, TypeScript strict.** Not a Turborepo (the handoff doc describes one but this repo is single-app — migration is a future decision, not a current one).

**Server vs client boundary is critical.** The admin portal uses two Supabase clients:

- `lib/supabase/admin.ts` — service-role key, **bypasses RLS**. Importable only from server components, route handlers, and middleware. Marked with `import 'server-only'`.
- `lib/supabase/server.ts` — anon-key cookie-bound client for ordinary RSC reads.

If you find yourself importing `adminClient` in a `'use client'` file, stop. The build still passes because `'server-only'` checks at runtime, not build time, but you've leaked the service role.

**Auth flow:** `middleware.ts` runs on `/admin/:path*` and `/api/admin/:path*`. It checks Supabase session → `platform_admins` row → MFA factor presence, redirecting to `/login`, `/403`, or `/admin/setup-mfa` respectively. When `SUPABASE_CONFIGURED` is false (no env vars), middleware short-circuits with `x-dev-bypass: 1` so local dev works without infra. Production must set all three Supabase env vars.

**Audit logging:** every successful admin mutation must call `logAudit({...})` from `lib/audit.ts` at the end of the handler. The action enum is closed (see `AuditAction` type) — add new actions only when adding new mutations. Never call `logAudit` on failure paths. The `audit_log` table is append-only at the RLS level; do not write code that updates or deletes from it.

**Brand system:** `lib/brand.ts` exports the `BRAND` color tokens, `px()` / `pxSm()` shadow helpers, and `FONT` stack. Tailwind theme in `tailwind.config.ts` mirrors the same tokens (`bg-brand-blue`, `shadow-px`, etc.) so either approach works. Component styling in this codebase tends to use inline `style={{...}}` — match that. The non-negotiable rules:

- Zero border-radius on every interactive element. Already enforced via `globals.css` and Tailwind config.
- 3px charcoal border on cards/inputs/buttons.
- 4px pixel shadow on cards and primary buttons (2px on small variants).
- Hover state collapses shadow to none + `translate(2px, 2px)`.

**UI primitives** in `components/ui/` (Badge, Button, Card, Eyebrow, TabBar, TrendArrow) are the canonical implementations. The `.jsx` files in `components/` and the `Admin Portal.html` script block contain older versions using `window` globals — read them for design reference, never import them.

## Conventions

- File names lowercase-kebab. Component exports PascalCase.
- TS strict mode, no `any`, no `// @ts-expect-error` without comment explaining why.
- Server components default. Use `'use client'` only when you need state, effects, or browser APIs.
- Inline `style={{...}}` is fine and matches the prototype. Tailwind utility classes are also fine. Don't mix on the same element.
- Route handlers under `app/api/admin/*` must call `assertAdminRole` (not yet built — Phase C) and `logAudit` on success.
- Destructive UI actions (suspend, deactivate, kill switch) need a typed-confirmation modal. Don't skip this.
- Never commit `.env.local`. `.env.example` is the template.

## What is NOT done yet

Phase A is the only phase in the repo. Phase B (Reference Data), C (Customers + Tickets), D (Revenue + Dashboard), E (Platform + Audit + Security) are all backlog. The full backlog is in `admin handoff v1(1).md` §11 + §14.

The user portal app (`apps/web` in the handoff) is not in this repo. It lives at `../shippingcow-nextjs/` or `../ShippingCow/` (separate repos). The admin portal connects to the same Supabase project as the user portal, but the two are deployed independently.

## Companion documents

- `admin handoff v1(1).md` — primary spec. Brand tokens, schema, API contracts, build phases.
- `userportal/userportalprd.md` — user-facing PRD, cited from the handoff.
- `ShippingCow_Admin_Portal_PRD.docx` — original PRD; superseded by the handoff doc where they conflict.
- `Admin Portal.html` — design source of truth for UI. Self-contained Babel-standalone React.
