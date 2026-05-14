---
title: Auth Flow — Middleware Chain
type: concept
sources: [CLAUDE.md, src/middleware.ts]
created: 2026-05-14
updated: 2026-05-14
---

# Auth Flow — Middleware Chain

## Middleware protection scope

```
/admin/:path*         → protected
/api/admin/:path*     → protected
All other routes      → public (login, auth callback, 403, quote form, rate calc)
```

## Auth check chain (3 gates)

```
Request to /admin/*
  ↓
Gate 1: Valid Supabase session?
  No  → redirect to /login
  Yes ↓
Gate 2: Row exists in platform_admins?
  No  → redirect to /403
  Yes ↓
Gate 3: MFA factor present on session?
  No  → redirect to /admin/setup-mfa
  Yes → allow request
```

## Local dev bypass

When `SUPABASE_CONFIGURED` is `false` (all three Supabase env vars absent), middleware short-circuits with `x-dev-bypass: 1` header and allows all traffic. This lets local dev work without infra.

**Never deploy to production without the three Supabase env vars:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Supabase clients

| Client | File | Purpose |
|---|---|---|
| `adminClient()` | `lib/supabase/admin.ts` | Service-role, bypasses RLS. Server-only. |
| Server client | `lib/supabase/server.ts` | Anon key + cookie-bound. RSC reads. |

See also: [[security-invariants]]
