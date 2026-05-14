---
title: Source — Database Schema & Migrations
type: source
sources: [supabase/migrations/, CLAUDE.md]
created: 2026-05-14
updated: 2026-05-14
---

# Database Schema & Migrations

## Migration inventory

| File | Scope | Applied to Supabase? |
|---|---|---|
| `0001_phase_a.sql` | Auth tables, `platform_admins`, `audit_log`, shell schema | Must be applied for auth to work |
| `0002_reference_tables.sql` | `zone_matrix`, `our_carrier_rates`, `carrier_retail_rates`, `our_warehousing_fees`, `our_logistics_fees`, `category_benchmarks` | Target: 2026-05-22 |
| `0003_mv_refresh_stub.sql` | `refresh_mv_org_cost_summary()` RPC stub (no-ops until user-portal overwrites) | Target: 2026-05-22 |
| `0004_customers_tickets.sql` | Customer orgs, tickets tables | Target: 2026-05-22 |
| `0005_platform_security.sql` | Feature flags, kill switch, quota tables | Target: 2026-05-22 |
| `0006_quote_requests.sql` | Quote request workflow table | Target: 2026-06-03 |
| `0007_dm_tracking.sql` | DM outreach tracking table | Target: 2026-06-03 |

**To apply a migration:** Supabase Dashboard → SQL Editor → New query → paste → Run → verify in Table Editor.

## RLS posture

Every table has explicit RLS policies. Default posture: `using (false) with check (false)` — end-users cannot read or write directly. Only the service role (via `adminClient()`) can bypass.

**Exceptions:**
- `audit_log`: BEFORE UPDATE/DELETE triggers physically reject mutations even from service role. Append-only at database level.

## Reference table lifecycle

Rate tables (`zone_matrix`, `our_carrier_rates`, etc.) use `effective_from` / `effective_to` for historical accuracy:

1. Never UPDATE a published row to change a rate.
2. Insert new row with new `effective_from`.
3. Set old row's `effective_to` = new `effective_from` - 1 day.
4. The Phase B.2 publish workflow in `lib/reference-publish.ts` automates this.
5. After publish: call `refresh_mv_org_cost_summary()` RPC.

## Supabase clients

| Client | File | Key type | Usage |
|---|---|---|---|
| `adminClient()` | `lib/supabase/admin.ts` | Service-role (bypasses RLS) | Server components, route handlers, middleware only |
| Server client | `lib/supabase/server.ts` | Anon key + cookie-bound | Ordinary RSC reads |

See also: [[security-invariants]], [[auth-flow]]
