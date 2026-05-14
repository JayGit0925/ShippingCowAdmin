---
title: Security Invariants — Must Never Be Violated
type: concept
sources: [CLAUDE.md]
tags: [security, critical]
created: 2026-05-14
updated: 2026-05-14
---

# Security Invariants — Must Never Be Violated

These rules are non-negotiable. Violating any of them creates a security incident. Read before touching auth, database, or admin route handler code.

## 1. Service-role key stays server-side

`lib/supabase/admin.ts` is marked `import 'server-only'`. It may only be imported from:
- Server components
- Route handlers
- Middleware

**Never import `adminClient` in a `'use client'` file.** The TypeScript build still passes (server-only checks at runtime, not build time), but the service role key leaks to the browser.

## 2. Every admin mutation must call logAudit()

```ts
// lib/audit.ts
await logAudit({ actor, action, targetType, targetId, metadata });
```

- Call `logAudit` **only on success paths** — never on failure.
- Use only defined `AuditAction` enum values — add new ones only when adding new mutations.
- The `audit_log` table is append-only at the RLS level. BEFORE UPDATE/DELETE triggers physically reject mutations even from the service role. Never write code that tries to modify or delete from `audit_log`.

## 3. Middleware must not be bypassed in production

`src/middleware.ts` checks: Supabase session → `platform_admins` row → MFA factor presence.

- `SUPABASE_CONFIGURED` = false (no env vars) → short-circuits with `x-dev-bypass: 1` for local dev only.
- Production must have all three Supabase env vars set: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

**Never deploy to production without these three vars set.**

## 4. Destructive UI actions require typed-confirmation modal

Kill switch, suspend, deactivate — all must show a typed-confirmation modal before executing. No exceptions. See `components/ui/` for the modal primitive.

## 5. Reference tables: insert, don't update

Rate tables (`zone_matrix`, `our_carrier_rates`, etc.) carry `effective_from`/`effective_to`. To change a rate:
- Insert a new row with the new `effective_from`.
- Set the old row's `effective_to` to the day before.

**Never UPDATE a published row to change a rate.** The Phase B.2 publish workflow in `lib/reference-publish.ts` automates this.

## 6. Route handlers under /api/admin/* must call assertAdminRole

Once implemented (Phase C), all `app/api/admin/*` handlers must call `assertAdminRole` (not yet built). Until then, they rely on middleware protection. Don't add any admin route handlers that skip middleware-level auth.

## 7. .env.local must never be committed

`.env.local` is in `.gitignore`. `.env.example` is the template. Never commit secrets.
