## Summary

<!-- 1-3 bullets: what changed, why. Reference plan phase if applicable. -->

## Scope

- [ ] Admin app (`app/admin/*`)
- [ ] User-portal (`app/(portal)/*`)
- [ ] Marketing routes (`app/(marketing)/*`)
- [ ] API routes (`app/api/*`)
- [ ] Lib helpers (`lib/*`)
- [ ] Migrations (`supabase/migrations/*`)
- [ ] Tests (`tests/*`)
- [ ] Brand / styling
- [ ] Docs / plans (`docs/*`)
- [ ] Config (`package.json`, `next.config.mjs`, etc)
- [ ] CI / `.github/*`

## Plan reference

<!-- e.g. "Phase 3 of docs/superpowers/plans/2026-05-10-user-portal-build.md" -->

## Test plan

- [ ] `npm run typecheck` clean
- [ ] `npm run build` green
- [ ] `npm test` green
- [ ] Manual smoke: <!-- describe what you tested in browser -->
- [ ] E2E if applicable: `npm run test:e2e -- <spec>`

## Audit log impact

<!-- Did this add new AuditAction types? Mutate any audit_log invariants? -->

## Brand / voice check (customer-facing)

- [ ] N/A — backend-only change
- [ ] Applied jayos `cow-voice` skill rules to all new customer-facing strings
- [ ] No banned vocab (`leverage`, `synergies`, etc per voice-guide.md)
- [ ] No Logistar references in customer-facing copy

## Migrations

- [ ] N/A — no migration in this PR
- [ ] Migration is idempotent (`IF NOT EXISTS`, `to_regclass` guards)
- [ ] Re-ran migration twice locally; second run = no-op
- [ ] Migration application order documented if cross-cutting

## Security

- [ ] No `lib/supabase/admin.ts` imports from `'use client'`
- [ ] Every successful mutation calls `logAudit(...)`
- [ ] No new secrets committed
- [ ] RLS policies tested if new table added

## Cross-repo impact (jayos)

- [ ] N/A
- [ ] Brand UI tokens changed → updated jayos `brand/visual-identity/ui-tokens.md`
- [ ] Voice rule changed → updated jayos `brand/voice-and-tone/voice-guide.md`
- [ ] Governance-class action added → updated jayos `.claude/skills/decision-log-entry/SKILL.md`
- [ ] HANDOFF.md needs update on next jayos session
