# Migrations Applied Log

| Date | Migrations | Method | Project | Applied by |
|---|---|---|---|---|
| 2026-05-13 | 0001–0005 | Supabase MCP | aetvueyuaxbgszcisoci / shippingcow-admin-prod (us-east-1) | Claude Code |
| (applied between 2026-05-13 and 2026-05-16; logged 2026-05-16) | 0006 (quote_requests), 0007 (dm_tracking) | Supabase MCP | aetvueyuaxbgszcisoci | Claude Code — schema verified live via list_tables on 2026-05-16 |

## Notes

- Final prod project: `shippingcow-admin-prod` (aetvueyuaxbgszcisoci) — Jay's account, us-east-1.
- Prior project `ShippingCowv2` (ixfixeyfsrascvqwvkio) deleted.
- 0004 conditional ALTERs on `subscriptions`/`orgs` skipped (user-portal tables not present — expected).
- 0005 conditional ALTER on `news_items` skipped (same reason — expected).
- `mooovy_enabled` feature flag seeded ON.

## Vercel deploy state

- Production URL: https://shippingcow-admin.vercel.app
- Vercel project ID: prj_CkdfeN1Em0EjFUtncRn9u0Rkv5ue
- GitHub auto-deploy: wired 2026-05-13. `git push origin master` → auto-redeploy.
