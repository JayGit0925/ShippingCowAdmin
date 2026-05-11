# Migrations Applied Log

| Date | Migrations | Method | Applied by |
|---|---|---|---|
| 2026-05-13 | 0001–0005 | Supabase MCP (project: ixfixeyfsrascvqwvkio / ShippingCowv2) | Claude Code |

## Notes

- Switched from cofounder's project `kmioqhqqheyyllqifrli` to Jay's own `ShippingCowv2` for direct MCP access.
- 0004 conditional ALTERs on `subscriptions`/`orgs` skipped (user-portal tables not present in this project — expected).
- 0005 conditional ALTER on `news_items` skipped (same reason — expected).
- `mooovy_enabled` feature flag seeded ON.
