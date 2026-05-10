# Environment Setup

Every developer's local `.env.local` (gitignored). Per-machine, per-collaborator.

## Required for admin to boot

```bash
NEXT_PUBLIC_SUPABASE_URL=https://kmioqhqqheyyllqifrli.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase dashboard → API>
SUPABASE_SERVICE_ROLE_KEY=<from supabase dashboard → API → service_role>
```

Where to get: https://supabase.com/dashboard/project/kmioqhqqheyyllqifrli/settings/api

## Optional / per-phase

| Var | Required by phase | Where to get | Cost |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | Phase 7 (signup + upgrade) | Stripe dashboard → Developers → API keys. Use TEST key for dev, LIVE key for production only. | Free until transactions |
| `STRIPE_WEBHOOK_SECRET` | Phase 7 | `stripe listen --forward-to localhost:3001/api/portal/billing/webhook` | Stripe CLI free |
| `STRIPE_PRICE_COW_FIRST_MONTH` | Phase 7 | Stripe dashboard → Products → Cow $99 first month → API ID | — |
| `STRIPE_PRICE_COW_RECURRING` | Phase 7 | Stripe dashboard → Products → Cow $499 recurring → API ID | — |
| `STRIPE_PRICE_BULL_RECURRING` | Phase 7 | Stripe dashboard → Products → Bull $999 recurring → API ID | — |
| `ANTHROPIC_API_KEY` | Phase 6 (Mooovy chat) | https://console.anthropic.com → Settings → API Keys. `sk-ant-...` format. | Pay-per-token, ~$3-15/MTok input |
| `RESEND_API_KEY` | Phase 7 (team invites) + Phase C admin (ticket reply email) | https://resend.com/api-keys. `re_...` format. | Free 100/day, $20/mo for 50K |
| `DEV_BYPASS` | Local dev only — bypass MFA + admin role check | Set to any truthy value during local development. NEVER set in production. | — |

## Dev-only / optional

| Var | Use | Default |
|---|---|---|
| `PLAYWRIGHT_BASE_URL` | E2E test target override | `http://localhost:3001` |
| `PLAYWRIGHT_NO_SERVER` | Skip auto-starting dev server in E2E tests | unset |
| `PYTHONIOENCODING` | Workflow YAML validation Windows fix | `utf-8` |

## First-time setup checklist (new collaborator, new machine)

1. **Clone both repos as siblings:**
   ```
   git clone https://github.com/JayGit0925/JayOS.git jayos
   git clone https://github.com/shippingcow/ShippingCowAdmin.git ShippingCowAdmin
   ```
   Keep them in the SAME parent dir. The relative path `..\ShippingCowAdmin` is referenced by jayos `scripts/sync-admin-handoff.ps1`.

2. **Move out of OneDrive / iCloud.** Cloud-synced folders can cause invisible file conflicts between machines that share the same cloud account. Local disk only.

3. **Install Node 23+** (admin uses Node 23 currently).

4. **Install dependencies:**
   ```
   cd ShippingCowAdmin
   npm install --legacy-peer-deps    # legacy-peer-deps required per HANDOFF eslint workaround
   npx playwright install chromium   # E2E browser binary
   ```

5. **Create `.env.local` in admin root.** Fill at minimum the Required block above. Add others as you reach the phase that needs them.

6. **Set up `gh` CLI:**
   ```
   gh auth login
   gh auth refresh -s workflow,delete_repo   # if you'll edit .github/workflows/ or delete repos
   ```

7. **Cofounder provisions you in admin DB** (per jayos `team/playbook/tools-and-access.md`):
   - Add row to jayos `team/playbook/tools-and-access.md` Admin portal roster table
   - Cofounder runs `INSERT INTO platform_admins ...` w/ your auth user UUID
   - You sign in to admin `/login`, enroll TOTP at `/admin/setup-mfa`
   - Cofounder flips `is_active=true`

8. **Verify setup:**
   ```
   cd ShippingCowAdmin
   npm run typecheck       # tsc --noEmit
   npm run build           # next build
   npm test                # vitest run --passWithNoTests
   npm run dev             # http://localhost:3001
   ```

## API key rotation

Per `corporate/policies/information-security-policy.md` in jayos:
- Quarterly rotation for production secrets
- Immediate rotation on collaborator departure
- Log rotation date in jayos `analytics/insights-log.md`

## Production secrets

Stored in deployment provider env (Vercel project settings → Environment Variables, or equivalent). NEVER in `.env.local` for production usage. Local `.env.local` is dev-only.

GitHub Actions workflow secrets stored separately in repo settings → Secrets and variables → Actions.

## Never commit

- `.env.local` (gitignored by default in Next.js, verified in `.gitignore`)
- `.env.production`
- `.env.development.local`
- Any file containing `sk-`, `re_`, `sk_live_`, `sk_test_`, `eyJ...` (JWT pattern) keys
