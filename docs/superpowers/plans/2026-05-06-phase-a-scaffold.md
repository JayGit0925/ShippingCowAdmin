# Phase A — Foundation Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the `ShippingCowAdmin` design prototype repo into a runnable Next.js 14 App Router skeleton with auth middleware, admin Supabase client, audit logging helper, port of the sidebar/topbar UI, and 8 placeholder route pages — gated only by env-var presence so the app boots without a real Supabase project.

**Architecture:** Standalone Next.js 14 (App Router, TypeScript) at the repo root — not a Turborepo. Server-only Supabase admin client lives in `lib/supabase/admin.ts` and is never imported from `'use client'` files. Middleware checks `platform_admins` table and MFA, but short-circuits to a "DEV BYPASS" path when `NEXT_PUBLIC_SUPABASE_URL` is unset (so first-run dev works before infra exists). Brand tokens, badges, buttons, and pixel-shadow helpers extract from `Admin Portal.html` lines 30–88 into `lib/brand.ts` + `components/ui/*.tsx` (TSX, no `window` globals).

**Tech Stack:** Next.js 14 (App Router), TypeScript 5, Tailwind CSS 3, `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`, ESLint, Prettier. No DB driver beyond Supabase. No Stripe / Resend / Anthropic deps yet (deferred to Phase D/E).

---

## File Structure

**New files (created by this plan):**

```
ShippingCowAdmin/
├── CLAUDE.md                                  # Repo-level guidance for Claude Code
├── package.json                               # Next.js 14 deps
├── tsconfig.json                              # TS strict
├── next.config.mjs                            # Next config (no remote images)
├── tailwind.config.ts                         # brand tokens wired to Tailwind
├── postcss.config.mjs
├── .env.example                               # all required env vars, no secrets
├── .gitignore                                 # node_modules, .next, .env*
├── .eslintrc.json
├── middleware.ts                              # auth + platform_admins + MFA gate
├── app/
│   ├── layout.tsx                             # root layout, fonts, page bed
│   ├── globals.css                            # Tailwind + zero-radius reset
│   ├── 403/page.tsx                           # not-authorized landing
│   ├── login/page.tsx                         # placeholder login (Supabase auth UI later)
│   ├── admin/
│   │   ├── layout.tsx                         # sidebar + topbar shell
│   │   ├── page.tsx                           # /admin (Dashboard placeholder)
│   │   ├── customers/page.tsx
│   │   ├── revenue/page.tsx
│   │   ├── reference/page.tsx
│   │   ├── platform/page.tsx
│   │   ├── audit/page.tsx
│   │   ├── security/page.tsx
│   │   ├── tickets/page.tsx
│   │   └── setup-mfa/page.tsx
│   └── api/
│       └── admin/
│           └── _ping/route.ts                 # smoke test for admin client
├── components/
│   ├── ui/
│   │   ├── badge.tsx                          # Tier/Status/Severity badges
│   │   ├── button.tsx                         # Btn variants
│   │   ├── card.tsx                           # pixel-shadow Card
│   │   ├── eyebrow.tsx                        # Press Start 2P label
│   │   ├── tab-bar.tsx
│   │   └── trend-arrow.tsx
│   └── shell/
│       ├── sidebar.tsx                        # 8 nav items, collapsible
│       └── topbar.tsx                         # breadcrumb + status dot + date
├── lib/
│   ├── brand.ts                               # BRAND, px(), pxSm(), font stacks
│   ├── audit.ts                               # logAudit()
│   ├── env.ts                                 # typed env access + dev-bypass flag
│   └── supabase/
│       ├── admin.ts                           # service-role client, server only
│       └── server.ts                          # createServerClient for RSCs
└── docs/
    └── superpowers/
        └── plans/2026-05-06-phase-a-scaffold.md  # this file
```

**Files NOT touched by this plan:**
- `Admin Portal.html`, `tweaks-panel.jsx`, `components/*.jsx` — kept as design source of truth, read-only reference for UI port
- `userportal/`, `homepage/`, `landingpage/`, `brandguide/` — separate surfaces, not in `apps/admin` scope
- `admin handoff v1(1).md`, `userportal/userportalprd.md`, `ShippingCow_Admin_Portal_PRD.docx` — spec docs

---

## Task 1: Repo bootstrap — package.json, tsconfig, gitignore

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `next.config.mjs`
- Create: `postcss.config.mjs`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "shippingcow-admin",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "@supabase/supabase-js": "^2.45.0",
    "next": "14.2.13",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.16.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.13",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "Admin Portal.html", "tweaks-panel.jsx", "components/*.jsx", "userportal", "homepage", "landingpage", "brandguide", "uploads"]
}
```

- [ ] **Step 3: Write `.gitignore`**

```
node_modules/
.next/
.vercel/
.env
.env.local
.env.*.local
next-env.d.ts
*.tsbuildinfo
.DS_Store
```

- [ ] **Step 4: Write `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
};
export default nextConfig;
```

- [ ] **Step 5: Write `postcss.config.mjs`**

```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

- [ ] **Step 6: Install deps and verify**

Run: `npm install`
Expected: clean install, no peer-dep errors. `node_modules/next/package.json` exists.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json .gitignore next.config.mjs postcss.config.mjs
git commit -m "feat(scaffold): bootstrap Next.js 14 + TS + Tailwind config"
```

---

## Task 2: Brand tokens + Tailwind config

**Files:**
- Create: `lib/brand.ts`
- Create: `tailwind.config.ts`
- Create: `app/globals.css`

- [ ] **Step 1: Write `lib/brand.ts`** (tokens lifted verbatim from `Admin Portal.html:30-37`)

```ts
export const BRAND = {
  blue: '#0052C9',
  yellow: '#FEB81B',
  charcoal: '#1A202C',
  pageBed: '#F4F7FF',
  midBlue: '#3A7FDE',
  sky: '#B0C8F0',
  amber: '#E0A000',
  white: '#FFFFFF',
  red: '#D64545',
  green: '#1A7A4A',
  teal: '#0D9488',
} as const;

export const px = (c: string = BRAND.charcoal) => `4px 4px 0 ${c}`;
export const pxSm = (c: string = BRAND.charcoal) => `2px 2px 0 ${c}`;

export const FONT = {
  display: "'Black Han Sans', sans-serif",
  body: "'DM Sans', sans-serif",
  pixel: "'Press Start 2P', monospace",
} as const;
```

- [ ] **Step 2: Write `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#0052C9',
          yellow: '#FEB81B',
          charcoal: '#1A202C',
          'page-bed': '#F4F7FF',
          'mid-blue': '#3A7FDE',
          sky: '#B0C8F0',
          amber: '#E0A000',
          red: '#D64545',
          green: '#1A7A4A',
          teal: '#0D9488',
        },
      },
      fontFamily: {
        display: ["'Black Han Sans'", 'sans-serif'],
        body: ["'DM Sans'", 'sans-serif'],
        pixel: ["'Press Start 2P'", 'monospace'],
      },
      borderRadius: { none: '0' },
      boxShadow: {
        px: '4px 4px 0 #1A202C',
        'px-sm': '2px 2px 0 #1A202C',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 3: Write `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: #F4F7FF; font-family: 'DM Sans', sans-serif; }
  button, input, textarea, select { border-radius: 0 !important; font-family: inherit; }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: #F4F7FF; }
  ::-webkit-scrollbar-thumb { background: #1A202C; border: 2px solid #F4F7FF; }
  ::-webkit-scrollbar-thumb:hover { background: #0052C9; }
}
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add lib/brand.ts tailwind.config.ts app/globals.css
git commit -m "feat(brand): port BRAND tokens + tailwind theme + zero-radius reset"
```

---

## Task 3: Env access + admin Supabase client + server client

**Files:**
- Create: `lib/env.ts`
- Create: `lib/supabase/admin.ts`
- Create: `lib/supabase/server.ts`
- Create: `.env.example`

- [ ] **Step 1: Write `lib/env.ts`**

```ts
const has = (k: string) => typeof process.env[k] === 'string' && process.env[k]!.length > 0;

export const ENV = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  USER_PORTAL_URL: process.env.USER_PORTAL_URL ?? '',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001',
};

export const SUPABASE_CONFIGURED =
  has('NEXT_PUBLIC_SUPABASE_URL') &&
  has('NEXT_PUBLIC_SUPABASE_ANON_KEY') &&
  has('SUPABASE_SERVICE_ROLE_KEY');

export const DEV_BYPASS = !SUPABASE_CONFIGURED && process.env.NODE_ENV !== 'production';
```

- [ ] **Step 2: Write `lib/supabase/admin.ts`** (server-only, bypasses RLS)

```ts
import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ENV, SUPABASE_CONFIGURED } from '@/lib/env';

let _client: SupabaseClient | null = null;

export function adminClient(): SupabaseClient {
  if (!SUPABASE_CONFIGURED) {
    throw new Error(
      'adminClient unavailable: SUPABASE env vars not set. See .env.example.',
    );
  }
  if (_client) return _client;
  _client = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}
```

- [ ] **Step 3: Write `lib/supabase/server.ts`** (RSC-friendly anon-key client)

```ts
import 'server-only';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const serverClient = () => createServerComponentClient({ cookies });
```

- [ ] **Step 4: Write `.env.example`**

```bash
# Supabase — required for production. Leave blank in dev to use DEV_BYPASS.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3001
USER_PORTAL_URL=http://localhost:3000

# Phase D/E (uncomment when wiring)
# STRIPE_SECRET_KEY=
# ANTHROPIC_API_KEY=
# RESEND_API_KEY=
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
git add lib/env.ts lib/supabase/admin.ts lib/supabase/server.ts .env.example
git commit -m "feat(supabase): admin + server clients with DEV_BYPASS gate"
```

---

## Task 4: Audit log helper

**Files:**
- Create: `lib/audit.ts`

- [ ] **Step 1: Write `lib/audit.ts`**

```ts
import 'server-only';
import { adminClient } from '@/lib/supabase/admin';
import { SUPABASE_CONFIGURED } from '@/lib/env';

export type AuditAction =
  | 'IMPERSONATE_USER' | 'IMPERSONATE_USER_END'
  | 'SUSPEND_ORG' | 'REACTIVATE_ORG' | 'DEACTIVATE_ORG'
  | 'TIER_OVERRIDE' | 'FORCE_LOGOUT_USER' | 'RESET_MFA'
  | 'TRANSFER_OWNERSHIP' | 'CCPA_ERASURE'
  | 'RATE_CARD_PUBLISH' | 'RATE_CARD_ROLLBACK'
  | 'NEWS_CARD_PUBLISH' | 'NEWS_CARD_RETIRE'
  | 'CONVERSATION_VIEW_START' | 'CONVERSATION_VIEW_END'
  | 'AI_KILL_SWITCH_TOGGLE' | 'AI_SUSPEND_ORG'
  | 'FEATURE_FLAG_CHANGE' | 'QUOTA_OVERRIDE'
  | 'COUPON_APPLIED' | 'SUBSCRIPTION_CANCELLED'
  | 'PAYMENT_RETRY' | 'REFUND_INITIATED'
  | 'ADMIN_CREATED' | 'ADMIN_DELETED'
  | 'TICKET_CREATED' | 'TICKET_REPLIED' | 'TICKET_STATUS_CHANGED';

export type AdminRole = 'super-admin' | 'support-admin' | 'billing-admin' | 'system';

export interface AuditEntry {
  action: AuditAction;
  actorId: string;
  actorRole: AdminRole;
  orgId?: string;
  resourceType: string;
  resourceId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
  ticketId?: string;
  ip?: string;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  if (!SUPABASE_CONFIGURED) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[audit:dev]', entry.action, entry.resourceId, entry.reason ?? '');
      return;
    }
    throw new Error('audit_log unavailable: Supabase not configured');
  }
  const { error } = await adminClient().from('audit_log').insert({
    action: entry.action,
    actor_user_id: entry.actorId,
    actor_role: entry.actorRole,
    org_id: entry.orgId,
    resource_type: entry.resourceType,
    resource_id: entry.resourceId,
    before_value: entry.before,
    after_value: entry.after,
    reason: entry.reason,
    ticket_id: entry.ticketId,
    ip_address: entry.ip,
  });
  if (error) throw new Error(`audit insert failed: ${error.message}`);
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add lib/audit.ts
git commit -m "feat(audit): logAudit() helper with full action enum"
```

---

## Task 5: Auth middleware (with DEV_BYPASS)

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Write `middleware.ts`**

```ts
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

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const hasTotp = (factors?.totp ?? []).length > 0;
  if (!hasTotp && !req.nextUrl.pathname.startsWith('/admin/setup-mfa')) {
    return NextResponse.redirect(new URL('/admin/setup-mfa', req.url));
  }

  res.headers.set('x-admin-role', admin.role);
  return res;
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat(auth): admin middleware with platform_admins+MFA gate, DEV_BYPASS for local"
```

---

## Task 6: UI primitives — Badge, Button, Card, Eyebrow, TabBar, TrendArrow

**Files:**
- Create: `components/ui/badge.tsx`
- Create: `components/ui/button.tsx`
- Create: `components/ui/card.tsx`
- Create: `components/ui/eyebrow.tsx`
- Create: `components/ui/tab-bar.tsx`
- Create: `components/ui/trend-arrow.tsx`

- [ ] **Step 1: Write `components/ui/badge.tsx`** (port `Admin Portal.html:60-68`)

```tsx
import { BRAND, pxSm } from '@/lib/brand';

const TIER = {
  calf: { label: 'CALF', bg: '#e5e7eb', color: BRAND.charcoal },
  cow: { label: 'COW', bg: BRAND.sky, color: BRAND.blue },
  bull: { label: 'BULL', bg: '#BBF7D0', color: '#166534' },
} as const;

const STATUS = {
  active: { label: 'ACTIVE', bg: '#BBF7D0', color: '#166534' },
  suspended: { label: 'SUSPENDED', bg: '#FEE2E2', color: '#991B1B' },
  deactivated: { label: 'DEACTIVATED', bg: '#e5e7eb', color: '#374151' },
  payment_failed: { label: 'FAILED', bg: '#FEF3C7', color: '#92400E' },
} as const;

const SEV = {
  critical: { label: 'CRITICAL', bg: '#D64545', color: '#fff' },
  high: { label: 'HIGH', bg: '#E0A000', color: '#fff' },
  medium: { label: 'MEDIUM', bg: '#0052C9', color: '#fff' },
  opportunity: { label: 'OPPORTUNITY', bg: '#1A7A4A', color: '#fff' },
  warning: { label: 'WARNING', bg: '#E0A000', color: '#fff' },
  low: { label: 'LOW', bg: '#e5e7eb', color: BRAND.charcoal },
} as const;

type TierValue = keyof typeof TIER;
type StatusValue = keyof typeof STATUS;
type SeverityValue = keyof typeof SEV;

export function Badge(
  props:
    | { type: 'tier'; value: TierValue }
    | { type: 'status'; value: StatusValue },
) {
  const cfg = props.type === 'tier' ? TIER[props.value] : STATUS[props.value];
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 9,
        padding: '3px 7px',
        background: cfg.bg,
        color: cfg.color,
        border: `2px solid ${BRAND.charcoal}`,
        boxShadow: pxSm(),
        letterSpacing: '0.04em',
      }}
    >
      {cfg.label}
    </span>
  );
}

export function SeverityBadge({ level }: { level: SeverityValue }) {
  const cfg = SEV[level];
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 8,
        padding: '3px 6px',
        background: cfg.bg,
        color: cfg.color,
        border: `2px solid ${BRAND.charcoal}`,
        letterSpacing: '0.03em',
      }}
    >
      {cfg.label}
    </span>
  );
}
```

- [ ] **Step 2: Write `components/ui/button.tsx`** (port `Admin Portal.html:69-75`)

```tsx
'use client';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { BRAND, px } from '@/lib/brand';

type Variant = 'primary' | 'blue' | 'ghost' | 'danger' | 'dark';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, CSSProperties> = {
  primary: { background: BRAND.yellow, color: BRAND.charcoal, boxShadow: px() },
  blue: { background: BRAND.blue, color: BRAND.white, boxShadow: px() },
  ghost: { background: 'transparent', color: BRAND.charcoal, boxShadow: px() },
  danger: { background: BRAND.red, color: BRAND.white, boxShadow: px() },
  dark: { background: BRAND.charcoal, color: BRAND.yellow, boxShadow: `4px 4px 0 ${BRAND.blue}` },
};

const sizePad: Record<Size, string> = { sm: '6px 10px', md: '8px 14px', lg: '14px 24px' };
const sizeFs: Record<Size, number> = { sm: 9, md: 10, lg: 13 };

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  style = {},
}: {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  onClick?: () => void;
  disabled?: boolean;
  style?: CSSProperties;
}) {
  const [hov, setHov] = useState(false);
  const v = variants[variant];
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: sizeFs[size],
        padding: sizePad[size],
        border: `3px solid ${BRAND.charcoal}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'box-shadow 0.08s, transform 0.08s',
        letterSpacing: '0.03em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        ...v,
        boxShadow: hov && !disabled ? 'none' : v.boxShadow,
        transform: hov && !disabled ? 'translate(2px, 2px)' : 'none',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 3: Write `components/ui/card.tsx`** (port `Admin Portal.html:79-82`)

```tsx
'use client';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { BRAND, px, pxSm } from '@/lib/brand';

export function Card({
  children,
  onClick,
  style = {},
}: {
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  const [hov, setHov] = useState(false);
  const interactive = !!onClick;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: BRAND.white,
        border: `3px solid ${BRAND.charcoal}`,
        boxShadow: hov && interactive ? pxSm() : px(),
        transform: hov && interactive ? 'translate(2px, 2px)' : 'none',
        transition: 'box-shadow 0.08s, transform 0.08s',
        cursor: interactive ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Write `components/ui/eyebrow.tsx`** (port `Admin Portal.html:76-78`)

```tsx
import type { CSSProperties, ReactNode } from 'react';
import { BRAND } from '@/lib/brand';

export function Eyebrow({
  children,
  style = {},
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 9,
        color: BRAND.blue,
        letterSpacing: '0.08em',
        display: 'block',
        marginBottom: 6,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 5: Write `components/ui/tab-bar.tsx`** (port `Admin Portal.html:86-88`)

```tsx
'use client';
import type { CSSProperties } from 'react';
import { BRAND } from '@/lib/brand';

export function TabBar({
  tabs,
  active,
  onSelect,
  style = {},
}: {
  tabs: string[];
  active: string;
  onSelect: (tab: string) => void;
  style?: CSSProperties;
}) {
  return (
    <div style={{ display: 'flex', borderBottom: `3px solid ${BRAND.charcoal}`, ...style }}>
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onSelect(t)}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9,
            padding: '10px 14px',
            border: 'none',
            borderRight: `2px solid ${BRAND.charcoal}`,
            borderBottom: active === t ? `3px solid ${BRAND.yellow}` : '3px solid transparent',
            background: active === t ? BRAND.pageBed : BRAND.white,
            color: active === t ? BRAND.blue : BRAND.charcoal,
            cursor: 'pointer',
            letterSpacing: '0.04em',
            marginBottom: -3,
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Write `components/ui/trend-arrow.tsx`** (port `Admin Portal.html:83-85`)

```tsx
import { BRAND } from '@/lib/brand';

export function TrendArrow({ value }: { value: number }) {
  return (
    <span style={{ color: value >= 0 ? BRAND.green : BRAND.red, fontSize: 18, lineHeight: 1 }}>
      {value >= 0 ? '▲' : '▼'}
    </span>
  );
}
```

- [ ] **Step 7: Typecheck**

Run: `npm run typecheck`
Expected: zero errors.

- [ ] **Step 8: Commit**

```bash
git add components/ui/
git commit -m "feat(ui): port Badge/Button/Card/Eyebrow/TabBar/TrendArrow primitives to TSX"
```

---

## Task 7: Sidebar + Topbar shell components

**Files:**
- Create: `components/shell/sidebar.tsx`
- Create: `components/shell/topbar.tsx`

- [ ] **Step 1: Write `components/shell/sidebar.tsx`** (port `Admin Portal.html:91-122`, add Tickets nav item from handoff §3)

```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BRAND } from '@/lib/brand';

const NAV = [
  { id: 'dashboard', href: '/admin', label: 'Dashboard', icon: '◈' },
  { id: 'customers', href: '/admin/customers', label: 'Customers', icon: '◉' },
  { id: 'revenue', href: '/admin/revenue', label: 'Revenue', icon: '◆' },
  { id: 'reference', href: '/admin/reference', label: 'Rate Cards', icon: '⊞' },
  { id: 'platform', href: '/admin/platform', label: 'Platform', icon: '⊙' },
  { id: 'audit', href: '/admin/audit', label: 'Audit Log', icon: '≡' },
  { id: 'security', href: '/admin/security', label: 'Security', icon: '⊕' },
  { id: 'tickets', href: '/admin/tickets', label: 'Tickets', icon: '✉' },
] as const;

export function Sidebar() {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside
      style={{
        width: collapsed ? 60 : 220,
        minHeight: '100vh',
        background: BRAND.charcoal,
        display: 'flex',
        flexDirection: 'column',
        borderRight: `3px solid ${BRAND.charcoal}`,
        transition: 'width 0.18s',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: collapsed ? '16px 10px' : '20px 18px',
          borderBottom: '3px solid rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minHeight: 72,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            flexShrink: 0,
            background: BRAND.blue,
            border: `2px solid ${BRAND.yellow}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            boxShadow: `2px 2px 0 ${BRAND.yellow}`,
          }}
        >
          🐄
        </div>
        {!collapsed && (
          <div>
            <div
              style={{
                fontFamily: "'Black Han Sans', sans-serif",
                fontSize: 13,
                color: BRAND.white,
                textTransform: 'uppercase',
                lineHeight: 1.1,
              }}
            >
              SHIPPING<br />COW
            </div>
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: BRAND.yellow }}>
              // ADMIN
            </span>
          </div>
        )}
      </div>
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {NAV.map((item) => {
          const active = path === item.href || (item.href !== '/admin' && path.startsWith(item.href));
          return (
            <Link
              key={item.id}
              href={item.href}
              title={collapsed ? item.label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '12px 0' : '11px 18px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: active ? BRAND.blue : 'transparent',
                borderLeft: active ? `3px solid ${BRAND.yellow}` : '3px solid transparent',
                textDecoration: 'none',
              }}
            >
              <span style={{ fontSize: 16, color: active ? BRAND.yellow : BRAND.sky, flexShrink: 0 }}>
                {item.icon}
              </span>
              {!collapsed && (
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    color: active ? BRAND.white : 'rgba(255,255,255,0.75)',
                    flex: 1,
                  }}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          padding: '10px',
          background: 'transparent',
          color: BRAND.sky,
          border: 'none',
          borderTop: '3px solid rgba(255,255,255,0.12)',
          cursor: 'pointer',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8,
        }}
      >
        {collapsed ? '»' : '«  COLLAPSE'}
      </button>
    </aside>
  );
}
```

- [ ] **Step 2: Write `components/shell/topbar.tsx`**

```tsx
'use client';
import { usePathname } from 'next/navigation';
import { BRAND } from '@/lib/brand';

const LABELS: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/customers': 'Customers',
  '/admin/revenue': 'Revenue',
  '/admin/reference': 'Rate Cards',
  '/admin/platform': 'Platform',
  '/admin/audit': 'Audit Log',
  '/admin/security': 'Security',
  '/admin/tickets': 'Tickets',
};

export function Topbar() {
  const path = usePathname();
  const label = LABELS[path] ?? 'Admin';
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return (
    <header
      style={{
        height: 60,
        background: BRAND.white,
        borderBottom: `3px solid ${BRAND.charcoal}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9,
            color: BRAND.blue,
            letterSpacing: '0.08em',
          }}
        >
          ADMIN /
        </span>
        <span
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 18,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 8,
              height: 8,
              background: BRAND.green,
              border: `1px solid ${BRAND.charcoal}`,
            }}
          />
          <span
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 8,
              color: BRAND.charcoal,
            }}
          >
            SYSTEM OK
          </span>
        </span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: BRAND.charcoal }}>
          {today}
        </span>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add components/shell/
git commit -m "feat(shell): port sidebar (8 nav items) + topbar (breadcrumb/status/date)"
```

---

## Task 8: Root layout + globals + login + 403

**Files:**
- Create: `app/layout.tsx`
- Create: `app/login/page.tsx`
- Create: `app/403/page.tsx`

- [ ] **Step 1: Write `app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShippingCow Admin',
  description: 'Internal admin portal for ShippingCow.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=DM+Sans:wght@400;500;700&family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Write `app/login/page.tsx`**

```tsx
import { BRAND } from '@/lib/brand';
import { SUPABASE_CONFIGURED } from '@/lib/env';

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
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
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 28,
            textTransform: 'uppercase',
            color: BRAND.charcoal,
            marginBottom: 12,
          }}
        >
          Admin Login
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.charcoal }}>
          {SUPABASE_CONFIGURED
            ? 'Supabase auth UI not yet wired (Phase A stub).'
            : 'DEV BYPASS active — Supabase env vars not set. Navigate directly to /admin.'}
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Write `app/403/page.tsx`**

```tsx
import { BRAND } from '@/lib/brand';

export default function ForbiddenPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          background: BRAND.white,
          border: `3px solid ${BRAND.red}`,
          boxShadow: `4px 4px 0 ${BRAND.red}`,
          padding: 32,
          maxWidth: 420,
        }}
      >
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            textTransform: 'uppercase',
            color: BRAND.red,
          }}
        >
          403 — Not Authorized
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.charcoal, marginTop: 12 }}>
          This account is not in <code>platform_admins</code>.
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/login/page.tsx app/403/page.tsx
git commit -m "feat(app): root layout + login stub + 403 page"
```

---

## Task 9: Admin layout + 8 placeholder pages + setup-mfa stub

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx`
- Create: `app/admin/customers/page.tsx`
- Create: `app/admin/revenue/page.tsx`
- Create: `app/admin/reference/page.tsx`
- Create: `app/admin/platform/page.tsx`
- Create: `app/admin/audit/page.tsx`
- Create: `app/admin/security/page.tsx`
- Create: `app/admin/tickets/page.tsx`
- Create: `app/admin/setup-mfa/page.tsx`

- [ ] **Step 1: Write `app/admin/layout.tsx`**

```tsx
import { Sidebar } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';
import { BRAND } from '@/lib/brand';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BRAND.pageBed }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar />
        <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `app/admin/page.tsx`** (Dashboard placeholder)

```tsx
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { BRAND } from '@/lib/brand';

export default function DashboardPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>// PHASE A SCAFFOLD</Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
          }}
        >
          Dashboard
        </h1>
      </div>
      <Card style={{ padding: 24 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.charcoal }}>
          Phase A scaffold. KPI bar, MRR chart, alert queue, health tiles wired in Phase D.
          See <code>docs/superpowers/plans/2026-05-06-phase-a-scaffold.md</code>.
        </p>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Write each remaining placeholder page** — same pattern as Step 2, but title and copy adapted per section. Create all 7 files (`customers`, `revenue`, `reference`, `platform`, `audit`, `security`, `tickets`) with this template, replacing `<TITLE>` and `<DESC>`:

```tsx
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { BRAND } from '@/lib/brand';

export default function Page() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>// PHASE A SCAFFOLD</Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
          }}
        >
          <TITLE>
        </h1>
      </div>
      <Card style={{ padding: 24 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.charcoal }}>
          <DESC>
        </p>
      </Card>
    </div>
  );
}
```

Per-page substitutions:

| File | `<TITLE>` | `<DESC>` |
|---|---|---|
| `customers/page.tsx` | `Customers` | `Org list + drawer wired in Phase C. See handoff §5.2.` |
| `revenue/page.tsx` | `Revenue` | `MRR funnel + failed payment queue wired in Phase D. See handoff §5.3.` |
| `reference/page.tsx` | `Rate Cards` | `Six reference tables + 4-step publish wired in Phase B. See handoff §5.4.` |
| `platform/page.tsx` | `Platform` | `Feature flags + AI kill switch + model pins wired in Phase E. See handoff §5.5.` |
| `audit/page.tsx` | `Audit Log` | `Append-only audit log UI wired in Phase E. See handoff §5.6.` |
| `security/page.tsx` | `Security` | `Suspicious sessions + CCPA workflow wired in Phase E. See handoff §5.7.` |
| `tickets/page.tsx` | `Tickets` | `Split-pane ticket UI wired in Phase C. See handoff §5.8.` |

- [ ] **Step 4: Write `app/admin/setup-mfa/page.tsx`**

```tsx
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { BRAND } from '@/lib/brand';

export default function SetupMfaPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>// REQUIRED</Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.red,
            textTransform: 'uppercase',
          }}
        >
          Set up MFA
        </h1>
      </div>
      <Card style={{ padding: 24 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.charcoal }}>
          Supabase TOTP enrollment UI wired in Phase A.2. All admin routes blocked until enrollment complete.
        </p>
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Run dev server and smoke-test**

Run: `npm run dev`
Expected: server starts on port 3001. In browser, `http://localhost:3001/admin` renders with sidebar (8 items) + topbar + Dashboard card. Clicking each nav item navigates to that section, active item highlighted yellow. No console errors.

- [ ] **Step 6: Stop dev server and commit**

Stop: Ctrl+C the dev server.

```bash
git add app/admin/
git commit -m "feat(admin): layout shell + 8 placeholder pages + setup-mfa stub"
```

---

## Task 10: Smoke-test API route

**Files:**
- Create: `app/api/admin/_ping/route.ts`

- [ ] **Step 1: Write `app/api/admin/_ping/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { SUPABASE_CONFIGURED, DEV_BYPASS } from '@/lib/env';

export async function GET() {
  return NextResponse.json({
    ok: true,
    supabaseConfigured: SUPABASE_CONFIGURED,
    devBypass: DEV_BYPASS,
    timestamp: new Date().toISOString(),
  });
}
```

- [ ] **Step 2: Smoke-test**

Run: `npm run dev` then `curl http://localhost:3001/api/admin/_ping`
Expected (dev, no env): `{"ok":true,"supabaseConfigured":false,"devBypass":true,"timestamp":"..."}`

- [ ] **Step 3: Stop dev server and commit**

```bash
git add app/api/admin/_ping/route.ts
git commit -m "feat(api): _ping route — env probe smoke test"
```

---

## Task 11: ESLint config + lint clean

**Files:**
- Create: `.eslintrc.json`

- [ ] **Step 1: Write `.eslintrc.json`**

```json
{
  "extends": "next/core-web-vitals",
  "ignorePatterns": [
    "Admin Portal.html",
    "tweaks-panel.jsx",
    "components/*.jsx",
    "userportal",
    "homepage",
    "landingpage",
    "brandguide",
    "uploads"
  ]
}
```

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add .eslintrc.json
git commit -m "chore(lint): eslint config, ignore prototype HTML/JSX sources"
```

---

## Task 12: CLAUDE.md (repo guidance)

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: Write `CLAUDE.md`**

````markdown
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
````

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md with architecture, commands, and conventions"
```

---

## Final verification

- [ ] **Run all gates**

```
npm run lint
npm run typecheck
npm run build
```

Expected:
- `lint` → no errors
- `typecheck` → no errors
- `build` → succeeds, all 11 routes (8 admin + login + 403 + setup-mfa) generated, plus `_ping` API route

- [ ] **Manual smoke**

Run: `npm run dev`. In browser:
- `http://localhost:3001/admin` → Dashboard placeholder, sidebar shows 8 items, Dashboard active (yellow indicator)
- Click each of the 8 nav items → route changes, active indicator follows, topbar title updates
- `http://localhost:3001/api/admin/_ping` → JSON `{ok:true, supabaseConfigured:false, devBypass:true, ...}`
- `http://localhost:3001/login` → "DEV BYPASS active" copy
- `http://localhost:3001/403` → red 403 card

Stop dev server.

- [ ] **Phase A gate (from handoff §11)**

The handoff Phase A gate says: "Founder logs into `admin.shippingcow.com`. Sees sidebar. Non-admin blocked at `/403`. Audit log table exists."

This plan delivers **partial Phase A** — login UI is a stub (Supabase auth UI not wired), audit_log *table* doesn't exist yet (no migrations in this plan), but the audit *helper* and middleware that consumes the table both exist. To satisfy the full gate, run the follow-up plan `2026-05-XX-phase-a-supabase-wiring.md` (not yet written) which provisions Supabase, applies migrations, seeds the founder admin row, and wires Supabase auth UI.

---

## Out of scope (deferred to later plans)

- Supabase project provisioning + DB migrations for `platform_admins`, `audit_log`, `feature_flags`, `model_pins`, `admin_notes`, `impersonation_sessions`, `rate_card_drafts`, `scheduled_publishes`, `support_tickets`, `ticket_messages`, plus column additions to `subscriptions`, `orgs`, `news_items`
- Real Supabase auth UI on `/login`
- TOTP enrollment UI on `/admin/setup-mfa`
- All 8 sections' real content (Dashboard KPIs, Customer drawer, Revenue funnel, Rate Card publish flow, Platform feature flags, Audit log table, Security workflows, Tickets thread)
- Stripe / Resend / Anthropic integrations
- Impersonation flow + apps/web banner
- IP allowlist (infra config, not app code)
- CSV export from audit log
- Test runner setup (Vitest + Playwright recommended for Phase B)
