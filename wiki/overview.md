---
title: Overview — ShippingCow Admin Portal
type: synthesis
sources: [CLAUDE.md, app/admin/, supabase/migrations/]
created: 2026-05-14
updated: 2026-05-14
---

# Overview — ShippingCow Admin Portal

## What it is

Internal-only admin surface for the ShippingCow platform. Eight sections: Dashboard, Customers, Revenue, Rate Cards (Reference), Platform, Audit Log, Security, Tickets. Plus: DM Tracker, Quote Form, Rate Calculator.

**Stack:** Next.js 14 App Router · TypeScript strict · Supabase (service-role admin + cookie-bound server client) · Tailwind + inline styles · shadcn/ui primitives.

## What's built (as of 2026-05-14)

All main routes exist with page files. Migrations 0001–0007 written. Apparent scope:

| Section | Route | Migrations |
|---|---|---|
| Dashboard | `/admin` | 0001 |
| Customers | `/admin/customers`, `/admin/customers/[orgId]` | 0004 |
| Revenue | `/admin/revenue` | 0001+ |
| Reference (Rate Cards) | `/admin/reference`, `/admin/reference/[table]` | 0002 |
| Platform | `/admin/platform` | 0005 |
| Audit Log | `/admin/audit` | 0001 |
| Security | `/admin/security` | 0005 |
| Tickets | `/admin/tickets`, `/admin/tickets/[ticketId]` | 0004 |
| DM Tracker | `/admin/dm-tracker` | 0007 |
| Quote Form | `/_quote-form` | 0006 |
| Auth/Login | `/login`, `/auth` | 0001 |

## Migration inventory

| File | Scope |
|---|---|
| `0001_phase_a.sql` | Auth, shell, initial tables |
| `0002_reference_tables.sql` | Rate card tables (zone_matrix, carrier_rates, etc.) |
| `0003_mv_refresh_stub.sql` | Materialized view refresh stub |
| `0004_customers_tickets.sql` | Customers + tickets tables |
| `0005_platform_security.sql` | Platform + security tables |
| `0006_quote_requests.sql` | Quote request workflow |
| `0007_dm_tracking.sql` | DM outreach tracker |

**Status of applied migrations:** Verify in Supabase Dashboard → Table Editor. At minimum, 0001 must be applied for auth to work.

## Critical path to launch (from plan.md blockers)

- 2026-05-22: Migrations 0002–0005 applied to Supabase
- 2026-06-03: Migrations 0006–0010 applied; STRIPE_SECRET_KEY set; mv_org_cost_summary landed
- 2026-06-05: Jay + Photographer full smoke test

## Non-negotiable design rules

- Zero border-radius on all interactive elements.
- 3px charcoal border on cards/inputs/buttons.
- 4px pixel shadow on cards and primary buttons.
- Hover state collapses shadow to none + `translate(2px, 2px)`.
