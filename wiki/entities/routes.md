---
title: Route Inventory
type: entity
sources: [app/]
created: 2026-05-14
updated: 2026-05-14
---

# Route Inventory

> All routes in `app/`. Updated when routes are added or removed.

## Public routes (no auth required)

| Route | File | Purpose |
|---|---|---|
| `/login` | `app/login/` | Supabase email/password login |
| `/auth` | `app/auth/` | Auth callback handler |
| `/403` | `app/403/` | Access denied page |

## Admin routes (protected by middleware)

All routes under `/admin/*` require: valid Supabase session + `platform_admins` row + MFA factor.

| Route | File | Section |
|---|---|---|
| `/admin` | `app/admin/page.tsx` | Dashboard — KPI bar, health tiles, MRR chart, alert queue |
| `/admin/customers` | `app/admin/customers/page.tsx` | Customer org list |
| `/admin/customers/[orgId]` | `app/admin/customers/[orgId]/page.tsx` | Customer detail + drawer tabs |
| `/admin/revenue` | `app/admin/revenue/page.tsx` | Revenue — funnel, failed payment queue |
| `/admin/reference` | `app/admin/reference/page.tsx` | Reference data table list |
| `/admin/reference/[table]` | `app/admin/reference/[table]/page.tsx` | Rate table editor |
| `/admin/reference/[table]/history` | `app/admin/reference/[table]/history/page.tsx` | Rate history log |
| `/admin/platform` | `app/admin/platform/page.tsx` | Platform — feature flags, kill switch, model pins, quotas, news |
| `/admin/audit` | `app/admin/audit/page.tsx` | Audit log viewer |
| `/admin/security` | `app/admin/security/page.tsx` | Admin list, CCPA, suspicious sessions |
| `/admin/tickets` | `app/admin/tickets/page.tsx` | Ticket list |
| `/admin/tickets/[ticketId]` | `app/admin/tickets/[ticketId]/page.tsx` | Ticket thread |
| `/admin/dm-tracker` | `app/admin/dm-tracker/page.tsx` | DM outreach tracker |

## Semi-public routes (accessible but not in nav)

| Route | File | Purpose |
|---|---|---|
| `/_quote-form` | `app/_quote-form.tsx` | Customer quote request form |
| `/_rate-calculator` | `app/_rate-calculator.tsx` | Rate calculator tool |
