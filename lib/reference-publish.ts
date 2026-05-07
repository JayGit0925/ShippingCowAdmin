import 'server-only';
import { adminClient } from '@/lib/supabase/admin';
import type { ReferenceTableName } from '@/lib/reference';

type Row = Record<string, unknown>;

function businessKeyFields(table: ReferenceTableName): string[] {
  switch (table) {
    case 'zone_matrix':
      return ['origin_zip_prefix', 'dest_zip_prefix'];
    case 'our_carrier_rates':
    case 'carrier_retail_rates':
      return ['carrier', 'service', 'zone', 'weight_lb_min'];
    case 'our_warehousing_fees':
    case 'our_logistics_fees':
      return ['fee_type'];
    case 'category_benchmarks':
      return ['category', 'metric'];
  }
}

export type PublishOutcome = {
  newRows: number;
  superseded: number;
  mvRefreshed: boolean;
  mvError: string | null;
};

export async function applyDraftAsPublished(
  table: ReferenceTableName,
  rows: Row[],
): Promise<PublishOutcome> {
  if (rows.length === 0) {
    throw new Error('Empty draft cannot be published');
  }
  const supabase = adminClient();
  const keyFields = businessKeyFields(table);

  let supersededTotal = 0;
  for (const row of rows) {
    const eff = row.effective_from as string;
    const yesterday = priorDay(eff);

    let q = supabase
      .from(table)
      .update({ effective_to: yesterday }, { count: 'exact' })
      .is('effective_to', null)
      .lt('effective_from', eff);
    for (const f of keyFields) {
      q = q.eq(f, row[f] as string | number);
    }
    const { count, error } = await q;
    if (error) {
      throw new Error(`supersede failed (${table}): ${error.message}`);
    }
    supersededTotal += count ?? 0;
  }

  const { error: insertErr } = await supabase.from(table).insert(rows);
  if (insertErr) {
    throw new Error(`insert failed (${table}): ${insertErr.message}`);
  }

  let mvRefreshed = false;
  let mvError: string | null = null;
  try {
    const rpcRes = await supabase.rpc('refresh_mv_org_cost_summary');
    if (rpcRes.error) {
      mvError = rpcRes.error.message;
    } else {
      mvRefreshed = true;
    }
  } catch (ex) {
    mvError = ex instanceof Error ? ex.message : 'mv refresh threw';
  }

  return {
    newRows: rows.length,
    superseded: supersededTotal,
    mvRefreshed,
    mvError,
  };
}

function priorDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
