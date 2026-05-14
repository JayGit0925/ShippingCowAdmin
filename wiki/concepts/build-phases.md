---
title: Build Phases — A through E
type: concept
sources: [CLAUDE.md, admin handoff v1(1).md]
created: 2026-05-14
updated: 2026-05-14
---

# Build Phases — A through E

## Phase sequence rule

**Phases run sequentially. No Phase N+1 work before Phase N is smoke-tested by Jay.** If a Phase A security bug surfaces during Day 8–10 smoke test, all Phase B work freezes until fixed.

## Phase A — Auth + Shell (COMPLETE in repo)

- MFA-gated middleware protecting `/admin/*` and `/api/admin/*`
- Supabase session → `platform_admins` row → MFA factor presence chain
- Brand system (`lib/brand.ts`), UI primitives (`components/ui/`)
- Login page, MFA setup page, 403 page
- Audit log table (append-only at RLS level)
- Migration: `0001_phase_a.sql`

## Phase B — Reference Data

- Rate tables: `zone_matrix`, `our_carrier_rates`, `carrier_retail_rates`, `our_warehousing_fees`, `our_logistics_fees`, `category_benchmarks`
- All with `effective_from` / `effective_to` for historical accuracy
- Draft → validate → publish workflow via `lib/reference-publish.ts`
- Route: `/admin/reference`, `/admin/reference/[table]`
- Migration: `0002_reference_tables.sql`, `0003_mv_refresh_stub.sql`
- Launch blocker target: migrations 0002–0005 applied by **2026-05-22**

## Phase C — Customers + Tickets

- Customer org management, impersonation banner
- Ticket system
- Routes: `/admin/customers`, `/admin/customers/[orgId]`, `/admin/tickets`, `/admin/tickets/[ticketId]`
- Migration: `0004_customers_tickets.sql`
- Launch blocker target: phase C complete by **2026-05-25**

## Phase D — Revenue + Dashboard

- MRR chart, funnel view, failed payment queue
- KPI bar and health tiles on `/admin` main page
- `mv_org_cost_summary` materialized view (RPC stub → real refresh in user-portal repo)
- `STRIPE_SECRET_KEY` required
- Route: `/admin/revenue`
- Launch blocker target: phase D complete by **2026-05-29**

## Phase E — Platform + Audit + Security

- Platform: feature flags, kill switch, model pins, quota panel, news queue
- Audit: filterable log viewer
- Security: admin list, CCPA form, suspicious sessions
- Routes: `/admin/platform`, `/admin/audit`, `/admin/security`
- Migration: `0005_platform_security.sql`
- Launch blocker target: phase E complete by **2026-06-03**

## Additional modules (post-phase-A work observed)

| Module | Route | Migration |
|---|---|---|
| DM Tracker | `/admin/dm-tracker` | `0007_dm_tracking.sql` |
| Quote Form | `/_quote-form` | `0006_quote_requests.sql` |
| Rate Calculator | `/_rate-calculator` | — |

See also: [[security-invariants]], [[auth-flow]], [[routes]]
