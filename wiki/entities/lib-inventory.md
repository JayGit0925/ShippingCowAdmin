---
title: Library Inventory — lib/
type: entity
sources: [lib/]
created: 2026-05-14
updated: 2026-05-14
---

# Library Inventory — lib/

> Source of truth for what each `lib/` file exports and who uses it.

| File | Exports | Used by |
|---|---|---|
| `lib/supabase/admin.ts` | `adminClient()` — service-role Supabase client | Server components, route handlers, middleware |
| `lib/supabase/server.ts` | Cookie-bound anon-key Supabase client | RSC reads |
| `lib/audit.ts` | `logAudit({ actor, action, targetType, targetId, metadata })`, `AuditAction` enum | Every admin mutation route handler |
| `lib/brand.ts` | `BRAND` color tokens, `px()` / `pxSm()` shadow helpers, `FONT` stack | All UI components |
| `lib/rate-calc.ts` | `RATES` constants, rate calculation logic | `/_rate-calculator`, audit scripts, hero copy in `app/page.tsx` |
| `lib/reference-publish.ts` | Reference data publish workflow (draft → supersede old → insert new → RPC refresh) | `/api/admin/reference/[table]/*` handlers |
| `lib/reference-validators.ts` | Validation logic for rate table drafts | Reference editor |
| `lib/reference.ts` | Reference data read helpers | Reference pages |
| `lib/admin-context.ts` | `getAdminContext()` — actor identity for audit logging | Route handlers |
| `lib/audit-search.ts` | Audit log search/filter logic | `/admin/audit` page |
| `lib/customers.ts` | Customer org read/write helpers | `/admin/customers*` pages |
| `lib/metrics.ts` | Dashboard KPI aggregation | `/admin` main page |
| `lib/stripe.ts` | Stripe API client + helpers | Revenue page, payment handlers |
| `lib/env.ts` | Environment variable validation | App startup |
| `lib/feature-flags.ts` | Feature flag read/write | `/admin/platform` page |
| `lib/ccpa.ts` | CCPA request handling | `/admin/security` page |

## Important convention

`lib/rate-calc.ts` is the **single source of truth for rates**. Hero copy in `app/page.tsx` and audit scripts must pull from `RATES` here — never hardcode rate values elsewhere. Before any DM or public claim using a rate number, confirm it matches `RATES` in this file.
