# Purpose — ShippingCow Admin Portal Wiki

**What this wiki is for:** Track build phase status, schema state, security invariants, and architectural decisions for the ShippingCow Admin Portal. The LLM maintains this wiki from code, migrations, and CLAUDE.md. Jay reads. LLM writes.

## Goals

1. **Always-current documentation** of what's built, what's pending, and what the blockers are — so any session can pick up Phase B/C/D/E work without re-reading the 200-page handoff doc.
2. Track migration state: which SQL files are applied to Supabase, which are pending.
3. Document security invariants so they're never accidentally violated during rapid Phase work.
4. Track the path from current Phase A state to launch-ready (Phase E complete by 2026-06-03).

## Key questions this wiki must be able to answer

1. What build phases are complete vs pending, and what are the Phase B/C/D/E entry criteria?
2. Which Supabase migrations (0001–0010+) are applied vs pending?
3. What are the critical security invariants that must never be violated (service key leak, audit log mutation, etc.)?
4. What env vars are required and what do they control?
5. What's the fastest path to a smoke-test-ready portal for Jay's Day 8–10 review?
6. What does the Admin Portal.html prototype say vs what's actually implemented in Next.js?

## Evolving thesis

The admin portal is an **internal-only surface** — never customer-facing. Its security posture is built on Supabase service-role + RLS bypass (admin client) + MFA-gated middleware. The build follows a strict phase sequence: Phase A (auth + shell) → B (reference data) → C (customers + tickets) → D (revenue + dashboard) → E (platform + audit + security). **Phases run sequentially; no Phase N+1 work before Phase N is smoke-tested.**

**What would change this:**
- If a Phase A security bug is found during Day 8–10 smoke test → freeze all Phase B work, fix first.
- If launch date moves up → compress Phase C/D/E scope to minimum viable admin surface.

## Research scope

- `app/` routes and their current implementation state.
- `supabase/migrations/` — which SQL files exist and their content.
- `lib/` — audit, brand, rate-calc, Supabase client wiring.
- `admin handoff v1(1).md` — primary spec, wins on conflicts.
- `CLAUDE.md` — behavioral rules and architecture summary.

## Role division

Jay owns all commits, smoke tests, and architectural decisions. LLM maintains the wiki from code reads and writes code on request. The wiki is read-only for Jay — he queries it, he doesn't write it.
