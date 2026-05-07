import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    'SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL required.',
  );
  process.exit(1);
}

const effectiveFrom =
  process.env.SEED_EFFECTIVE_FROM ?? new Date().toISOString().slice(0, 10);
const supabase = createClient(url, key, { auth: { persistSession: false } });

type Row = Record<string, string>;

function read(path: string | undefined): Row[] | null {
  if (!path) return null;
  const text = readFileSync(path, 'utf8');
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Row[];
}

function getConflictKey(table: string): string {
  switch (table) {
    case 'zone_matrix':
      return 'origin_zip_prefix,dest_zip_prefix,effective_from';
    case 'our_carrier_rates':
    case 'carrier_retail_rates':
      return 'carrier,service,zone,weight_lb_min,effective_from';
    case 'our_warehousing_fees':
    case 'our_logistics_fees':
      return 'fee_type,effective_from';
    case 'category_benchmarks':
      return 'category,metric,effective_from';
    default:
      throw new Error(`unknown table ${table}`);
  }
}

async function ingest(
  table: string,
  rows: Row[] | null,
  mapper: (r: Row) => Record<string, unknown>,
) {
  if (!rows || rows.length === 0) {
    console.log(`[skip] ${table} — no input`);
    return;
  }
  const mapped = rows.map(mapper);
  const chunkSize = 1000;
  let inserted = 0;
  for (let i = 0; i < mapped.length; i += chunkSize) {
    const chunk = mapped.slice(i, i + chunkSize);
    const { error } = await supabase
      .from(table)
      .upsert(chunk, { onConflict: getConflictKey(table) });
    if (error) {
      console.error(`[error] ${table} chunk ${i}: ${error.message}`);
      process.exit(1);
    }
    inserted += chunk.length;
  }
  console.log(`[ok] ${table} — ${inserted} rows`);
}

async function main() {
  await ingest(
    'zone_matrix',
    read(process.env.SEED_ZONE_MATRIX_CSV),
    (r) => ({
      origin_zip_prefix: r.origin_zip_prefix,
      dest_zip_prefix: r.dest_zip_prefix,
      zone: parseInt(r.zone, 10),
      effective_from: effectiveFrom,
    }),
  );

  await ingest(
    'our_carrier_rates',
    read(process.env.SEED_OUR_CARRIER_RATES_CSV),
    (r) => ({
      carrier: r.carrier,
      service: r.service,
      zone: parseInt(r.zone, 10),
      weight_lb_min: Number(r.weight_lb_min),
      weight_lb_max: Number(r.weight_lb_max),
      rate_usd: Number(r.rate_usd),
      effective_from: effectiveFrom,
    }),
  );

  await ingest(
    'carrier_retail_rates',
    read(process.env.SEED_CARRIER_RETAIL_RATES_CSV),
    (r) => ({
      carrier: r.carrier,
      service: r.service,
      zone: parseInt(r.zone, 10),
      weight_lb_min: Number(r.weight_lb_min),
      weight_lb_max: Number(r.weight_lb_max),
      rate_usd: Number(r.rate_usd),
      effective_from: effectiveFrom,
    }),
  );

  await ingest(
    'our_warehousing_fees',
    read(process.env.SEED_WAREHOUSING_FEES_CSV),
    (r) => ({
      fee_type: r.fee_type,
      unit: r.unit,
      rate_usd: Number(r.rate_usd),
      effective_from: effectiveFrom,
    }),
  );

  await ingest(
    'our_logistics_fees',
    read(process.env.SEED_LOGISTICS_FEES_CSV),
    (r) => ({
      fee_type: r.fee_type,
      unit: r.unit,
      rate_usd: Number(r.rate_usd),
      effective_from: effectiveFrom,
    }),
  );

  await ingest(
    'category_benchmarks',
    read(process.env.SEED_CATEGORY_BENCHMARKS_CSV),
    (r) => ({
      category: r.category,
      metric: r.metric,
      value: Number(r.value),
      cohort_size: parseInt(r.cohort_size, 10),
      effective_from: effectiveFrom,
    }),
  );

  console.log('done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
