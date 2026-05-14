# Schema — ShippingCow Admin Portal Wiki

> Conventions for how this wiki is maintained. LLM follows these during every ingest and query.

## Page types

| Type | Directory | Used for |
|---|---|---|
| `concept` | `wiki/concepts/` | Architecture patterns, security rules, workflows |
| `source` | `wiki/sources/` | Summaries of source files (handoff doc, migrations, lib files) |
| `entity` | `wiki/entities/` | Routes, tables, environment variables, team roles |
| `query` | `wiki/queries/` | Saved debugging sessions and architectural decisions |

## YAML frontmatter (all pages)

```yaml
---
title: <page title>
type: concept | source | entity | query
sources: []
tags: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

## Wikilinks

Use `[[page-name]]` for cross-references. Link to `[[security-invariants]]` liberally — it's the most important page in this wiki.

## Log format

`## [YYYY-MM-DD] <operation> | <title>` — operations: `ingest`, `query`, `lint`, `build-check`.

## Lint checklist (run before each phase start)

- [ ] Route inventory matches current `app/` directory
- [ ] Migration inventory matches current `supabase/migrations/`
- [ ] Security invariants page is current with `CLAUDE.md`
- [ ] Build phase page reflects actual implementation state (not just what CLAUDE.md says)
- [ ] Env vars page reflects current `.env.example`
