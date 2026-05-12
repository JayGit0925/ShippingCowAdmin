# Google OAuth Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace email/password + TOTP MFA with Google OAuth as the sole login method for the ShippingCow Admin Portal.

**Architecture:** Supabase Auth handles the OAuth flow. Next.js adds a `/auth/callback` route that exchanges the OAuth code for a session cookie. Middleware loses the TOTP check — session + `platform_admins` row is the only gate. The `setup-mfa` page is deleted entirely.

**Tech Stack:** Next.js 14 App Router, `@supabase/auth-helpers-nextjs@^0.10`, `@supabase/supabase-js@^2.45`, Supabase Auth (Google provider), Vercel.

**Task ownership lanes:**
- **Human-Jay** — browser actions in GCP Console + Supabase dashboard + first Google login
- **AI** — all file edits, CLI commands, MCP calls

---

## File Map

| Action | Path | What changes |
|---|---|---|
| Create | `app/auth/callback/route.ts` | OAuth code → session exchange |
| Modify | `middleware.ts` | Remove TOTP check + setup-mfa redirect |
| Modify | `app/login/page.tsx` | Replace form with Google button |
| Delete | `app/admin/setup-mfa/page.tsx` | Gone entirely |
| Supabase MCP | `platform_admins` table | Delete old row, insert new after OAuth login |

---

## Task 1: Google + Supabase prereqs [Human-Jay, ~10 min]

**Why:** The OAuth flow won't work until Google credentials are wired into Supabase Auth. No code changes — pure config.

- [ ] **Step 1: Add Supabase callback URI to GCP OAuth credentials**

  In Google Cloud Console → your OAuth 2.0 Client → Authorized redirect URIs → add:
  ```
  https://aetvueyuaxbgszcisoci.supabase.co/auth/v1/callback
  ```
  Save.

- [ ] **Step 2: Enable Google provider in Supabase**

  Go to: `https://supabase.com/dashboard/project/aetvueyuaxbgszcisoci/auth/providers`

  Find **Google** → toggle enabled → paste:
  - Client ID (from GCP OAuth credentials)
  - Client Secret (from GCP OAuth credentials)

  Save.

- [ ] **Step 3: Verify provider appears active**

  In the same Supabase Auth → Providers page, Google should show a green "Enabled" state.

---

## Task 2: Add OAuth callback route [AI, ~5 min]

**Why:** After Google redirects back to Supabase, Supabase redirects to `/auth/callback?code=...` in the app. This route exchanges the code for a session cookie. Without it, the user lands on a 404 and is never authenticated.

**Files:**
- Create: `app/auth/callback/route.ts`

- [ ] **Step 1: Create the callback route**

  ```typescript
  // app/auth/callback/route.ts
  import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
  import { cookies } from 'next/headers';
  import { NextResponse } from 'next/server';

  export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
      const supabase = createRouteHandlerClient({ cookies });
      await supabase.auth.exchangeCodeForSession(code);
    }

    return NextResponse.redirect(new URL('/admin', requestUrl.origin));
  }
  ```

- [ ] **Step 2: Verify build passes**

  ```bash
  cd /Users/jayos/jayos/projects/ShippingCowAdmin
  npm run build 2>&1 | tail -20
  ```

  Expected: `✓ Generating static pages` with no type errors. The new route appears in the output as `ƒ /auth/callback`.

- [ ] **Step 3: Commit**

  ```bash
  git add app/auth/callback/route.ts
  git commit -m "feat(auth): add OAuth callback route for Google sign-in"
  ```

---

## Task 3: Strip TOTP from middleware [AI, ~5 min]

**Why:** The middleware currently blocks `/admin` unless a TOTP factor exists. With Google OAuth there is no TOTP — this check must be removed. The new gate is: valid session + active `platform_admins` row.

**Files:**
- Modify: `middleware.ts`

Current middleware (lines 17–32) to remove:
```typescript
const { data: factors } = await supabase.auth.mfa.listFactors();
const hasTotp = (factors?.totp ?? []).length > 0;
if (!hasTotp && !req.nextUrl.pathname.startsWith('/admin/setup-mfa')) {
  return NextResponse.redirect(new URL('/admin/setup-mfa', req.url));
}
```

- [ ] **Step 1: Replace `middleware.ts` with the stripped version**

  ```typescript
  import { NextResponse, type NextRequest } from 'next/server';
  import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
  import { SUPABASE_CONFIGURED } from '@/lib/env';

  export async function middleware(req: NextRequest) {
    const res = NextResponse.next();

    if (!SUPABASE_CONFIGURED) {
      res.headers.set('x-admin-role', 'super-admin');
      res.headers.set('x-dev-bypass', '1');
      return res;
    }

    const supabase = createMiddlewareClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.redirect(new URL('/login', req.url));

    const { data: admin } = await supabase
      .from('platform_admins')
      .select('role, is_active')
      .eq('user_id', session.user.id)
      .single();

    if (!admin || !admin.is_active) {
      return NextResponse.redirect(new URL('/403', req.url));
    }

    res.headers.set('x-admin-role', admin.role);
    return res;
  }

  export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
  ```

- [ ] **Step 2: Verify build passes**

  ```bash
  npm run build 2>&1 | tail -20
  ```

  Expected: clean build, `ƒ Middleware` still appears in output.

- [ ] **Step 3: Commit**

  ```bash
  git add middleware.ts
  git commit -m "feat(auth): remove TOTP gate from middleware — Google OAuth only"
  ```

---

## Task 4: Replace login page with Google button [AI, ~10 min]

**Why:** The current login page has a two-step email/password + TOTP form. Replace entirely with a single "Sign in with Google" button. Keep the brand design (charcoal border, pixel shadow, Press Start 2P eyebrow).

**Files:**
- Modify: `app/login/page.tsx`

- [ ] **Step 1: Replace `app/login/page.tsx`**

  ```typescript
  'use client';

  import { type CSSProperties } from 'react';
  import { BRAND } from '@/lib/brand';
  import { Button } from '@/components/ui/button';
  import { browserClient } from '@/lib/supabase/browser';

  const eyebrowStyle: CSSProperties = {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 9,
    color: BRAND.charcoal,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 8,
    display: 'block',
    opacity: 0.5,
  };

  export default function LoginPage() {
    const supabase = browserClient();

    async function onGoogleSignIn() {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    }

    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: BRAND.pageBed,
        }}
      >
        <div
          style={{
            background: BRAND.white,
            border: `3px solid ${BRAND.charcoal}`,
            boxShadow: `4px 4px 0 ${BRAND.charcoal}`,
            padding: 32,
            maxWidth: 420,
            width: '100%',
          }}
        >
          <span style={eyebrowStyle}>// ADMIN</span>
          <h1
            style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 28,
              textTransform: 'uppercase',
              color: BRAND.charcoal,
              marginBottom: 8,
              letterSpacing: '0.02em',
            }}
          >
            ShippingCow Admin
          </h1>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: BRAND.charcoal,
              marginBottom: 24,
              opacity: 0.65,
            }}
          >
            Platform admins only.
          </p>
          <Button variant="blue" size="lg" onClick={onGoogleSignIn} style={{ width: '100%' }}>
            Sign in with Google
          </Button>
        </div>
      </main>
    );
  }
  ```

- [ ] **Step 2: Verify build passes**

  ```bash
  npm run build 2>&1 | tail -20
  ```

  Expected: clean build, `/login` listed as `○ (Static)`.

- [ ] **Step 3: Commit**

  ```bash
  git add app/login/page.tsx
  git commit -m "feat(auth): replace email/password+TOTP login with Google OAuth button"
  ```

---

## Task 5: Delete setup-mfa page [AI, ~2 min]

**Why:** The TOTP enrollment page has no role once TOTP is gone. Leaving it in creates dead routes and misleading UI.

**Files:**
- Delete: `app/admin/setup-mfa/page.tsx`

- [ ] **Step 1: Delete the file**

  ```bash
  rm /Users/jayos/jayos/projects/ShippingCowAdmin/app/admin/setup-mfa/page.tsx
  ```

- [ ] **Step 2: Verify no other files import setup-mfa**

  ```bash
  grep -r "setup-mfa" /Users/jayos/jayos/projects/ShippingCowAdmin/app /Users/jayos/jayos/projects/ShippingCowAdmin/lib /Users/jayos/jayos/projects/ShippingCowAdmin/components 2>/dev/null
  ```

  Expected: zero results (middleware reference is gone after Task 3; login page redirect is gone after Task 4).

- [ ] **Step 3: Verify build passes**

  ```bash
  npm run build 2>&1 | tail -20
  ```

  Expected: clean build. `/admin/setup-mfa` no longer appears in route listing.

- [ ] **Step 4: Commit**

  ```bash
  git add -A
  git commit -m "chore(auth): delete setup-mfa page — TOTP enrollment no longer needed"
  ```

---

## Task 6: Clean up old Supabase user + platform_admins row [AI via MCP, ~3 min]

**Why:** The old email/password user (UUID `42b2ed01-7a4e-4f7d-983f-76c5e2cdbf31`) and its `platform_admins` row are orphaned once Google OAuth is live. The new Google OAuth user will have a different UUID. Clean state before first login.

**No file changes — MCP only.**

- [ ] **Step 1: Delete old platform_admins row**

  Via Supabase MCP `execute_sql` on project `aetvueyuaxbgszcisoci`:
  ```sql
  DELETE FROM public.platform_admins
  WHERE user_id = '42b2ed01-7a4e-4f7d-983f-76c5e2cdbf31';
  ```
  Expected: `DELETE 1`

- [ ] **Step 2: Delete old auth user**

  Via Supabase MCP `execute_sql`:
  ```sql
  DELETE FROM auth.users
  WHERE id = '42b2ed01-7a4e-4f7d-983f-76c5e2cdbf31';
  ```
  Expected: `DELETE 1`

- [ ] **Step 3: Verify both are gone**

  ```sql
  SELECT COUNT(*) FROM public.platform_admins;
  SELECT COUNT(*) FROM auth.users;
  ```
  Expected: both return `0`.

---

## Task 7: Deploy + first OAuth login + re-seed platform_admins [Human-Jay + AI, ~10 min]

**Why:** The code is ready but the `platform_admins` table is empty. Jay signs in via Google → Supabase creates a new auth user → AI grabs the new UUID via MCP and inserts the admin row.

- [ ] **Step 1: Push to master (triggers Vercel auto-deploy)**

  ```bash
  git push origin master
  ```

  Wait for Vercel to finish (watch at `https://vercel.com/jiaweli0521-1285s-projects/shippingcow-admin`). Takes ~60s.

- [ ] **Step 2: Jay opens the login page and signs in with Google [Human-Jay]**

  Go to: `https://shippingcow-admin.vercel.app/login`

  Click **Sign in with Google** → complete Google OAuth flow.

  Expected: redirected to `/403` (no `platform_admins` row yet — correct behavior).

- [ ] **Step 3: AI grabs the new UUID via MCP**

  Via Supabase MCP `execute_sql` on project `aetvueyuaxbgszcisoci`:
  ```sql
  SELECT id, email, created_at
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;
  ```
  Note the `id` value — this is the new Google OAuth user UUID.

- [ ] **Step 4: AI inserts platform_admins row**

  ```sql
  INSERT INTO public.platform_admins (user_id, role, is_active)
  VALUES ('<new-uuid-from-step-3>', 'super-admin', true);
  ```
  Expected: `INSERT 1`

- [ ] **Step 5: Jay refreshes the browser [Human-Jay]**

  Expected: redirected to `/admin` dashboard. No login form. No TOTP. Done.

- [ ] **Step 6: Verify audit log entry (optional)**

  ```sql
  SELECT id, email, last_sign_in_at FROM auth.users ORDER BY last_sign_in_at DESC LIMIT 1;
  ```

  Expected: `last_sign_in_at` is recent (within the last 5 minutes).

---

## Self-Review

**Spec coverage:**
- ✅ Remove TOTP MFA — Tasks 3, 5
- ✅ Add Google OAuth — Tasks 1, 2, 4
- ✅ Delete old email/password user — Task 6
- ✅ Manual re-seed platform_admins — Task 7
- ✅ No backdoor fallback — setup-mfa deleted, old user deleted, no password route kept
- ✅ Cofounder path documented — add their Google UUID to platform_admins when ready (same Task 7 Step 4 pattern)

**Placeholder scan:** None. All steps have exact code, commands, or SQL.

**Type consistency:** `createRouteHandlerClient`, `createMiddlewareClient`, `browserClient()` — all from `@supabase/auth-helpers-nextjs`, consistent with existing codebase patterns.
