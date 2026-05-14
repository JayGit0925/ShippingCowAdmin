# Index — ShippingCow Admin Portal Wiki

> Content catalog. LLM reads this first when answering queries.

## Concepts

- [[build-phases]] — Phase A–E structure, what's complete vs pending, phase entry criteria.
- [[security-invariants]] — Service-role key rules, audit log append-only guarantee, MFA requirement, RLS posture.
- [[auth-flow]] — Middleware chain: Supabase session → platform_admins row → MFA factor presence.
- [[reference-data-publish]] — Rate table lifecycle: draft → validation → publish → supersession.

## Sources

- [[admin-handoff]] — Summary of `admin handoff v1(1).md` (primary spec). Wins on conflicts.
- [[database-schema]] — Tables, RLS posture, migration inventory (0001–0007).

## Entities

- [[routes]] — All app routes, their purpose, and current implementation status.
- [[lib-inventory]] — Library files in `lib/`, what each exports and who uses it.

## Queries

*(empty — add debugging sessions, architectural decisions, and phase gate reviews)*
