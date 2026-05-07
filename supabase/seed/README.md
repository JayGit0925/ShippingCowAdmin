# Seed scripts

Run after migrations apply.

## Inputs

Set these env vars (in `.env.local` or shell) before running:

- `SEED_ZONE_MATRIX_CSV` — path to zone matrix CSV. Headers: `origin_zip_prefix,dest_zip_prefix,zone`.
- `SEED_OUR_CARRIER_RATES_CSV` — headers: `carrier,service,zone,weight_lb_min,weight_lb_max,rate_usd`.
- `SEED_CARRIER_RETAIL_RATES_CSV` — same headers as above.
- `SEED_WAREHOUSING_FEES_CSV` — headers: `fee_type,unit,rate_usd`.
- `SEED_LOGISTICS_FEES_CSV` — same as above.
- `SEED_CATEGORY_BENCHMARKS_CSV` — headers: `category,metric,value,cohort_size`.
- `SEED_EFFECTIVE_FROM` — date string `YYYY-MM-DD` to assign to every seeded row's `effective_from`. Default: today.

Any unset env var is skipped — the corresponding table is not seeded. Re-running the script with the same inputs is a no-op (the unique constraints on `(business_key, effective_from)` deduplicate via upsert).

## Run

```bash
npm run seed:ingest
```

## Removal

To wipe all seeded data and re-run, drop and recreate the schema in the Supabase Dashboard (`DROP TABLE` the relevant tables, re-apply `0002_reference_tables.sql`), then re-run the seed.
