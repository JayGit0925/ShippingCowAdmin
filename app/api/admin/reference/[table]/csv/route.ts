import { NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { adminClient } from '@/lib/supabase/admin';
import {
  findReferenceTable,
  type ReferenceTableName,
} from '@/lib/reference';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';
import { validateDraft } from '@/lib/reference-validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RawRow = Record<string, string>;

function coerceRow(table: ReferenceTableName, r: RawRow): Record<string, unknown> {
  const today = new Date().toISOString().slice(0, 10);
  switch (table) {
    case 'zone_matrix':
      return {
        origin_zip_prefix: r.origin_zip_prefix,
        dest_zip_prefix: r.dest_zip_prefix,
        zone: parseInt(r.zone, 10),
        effective_from: r.effective_from || today,
      };
    case 'our_carrier_rates':
    case 'carrier_retail_rates':
      return {
        carrier: r.carrier,
        service: r.service,
        zone: parseInt(r.zone, 10),
        weight_lb_min: Number(r.weight_lb_min),
        weight_lb_max: Number(r.weight_lb_max),
        rate_usd: Number(r.rate_usd),
        effective_from: r.effective_from || today,
      };
    case 'our_warehousing_fees':
    case 'our_logistics_fees':
      return {
        fee_type: r.fee_type,
        unit: r.unit,
        rate_usd: Number(r.rate_usd),
        effective_from: r.effective_from || today,
      };
    case 'category_benchmarks':
      return {
        category: r.category,
        metric: r.metric,
        value: Number(r.value),
        cohort_size: parseInt(r.cohort_size, 10),
        effective_from: r.effective_from || today,
      };
  }
}

export async function POST(
  req: Request,
  { params }: { params: { table: string } },
) {
  const meta = findReferenceTable(params.table);
  if (!meta) return NextResponse.json({ error: 'unknown table' }, { status: 404 });

  let ctx;
  try {
    ctx = await getAdminContext(req);
  } catch (resp) {
    if (resp instanceof Response) return resp;
    throw resp;
  }

  const text = await req.text();
  if (!text || text.trim().length === 0) {
    return NextResponse.json({ error: 'CSV body required' }, { status: 400 });
  }

  let rows: RawRow[];
  try {
    rows = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as RawRow[];
  } catch (ex) {
    return NextResponse.json(
      { error: ex instanceof Error ? ex.message : 'csv parse failed' },
      { status: 400 },
    );
  }

  const payload = rows.map((r) => coerceRow(meta.table, r));
  const validation = validateDraft(meta.table, payload);

  const supabase = adminClient();
  const { data, error } = await supabase
    .from('rate_card_drafts')
    .insert({
      table_name: meta.table,
      draft_payload: payload,
      validation_result: validation,
      status: 'draft',
      created_by: ctx.actorId,
    })
    .select('id')
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'draft insert failed' },
      { status: 500 },
    );
  }

  await logAudit({
    action: 'RATE_CARD_CSV_IMPORT',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    resourceType: meta.table,
    resourceId: data.id,
    after: { rowCount: payload.length, valid: validation.ok },
    ip: ctx.ip ?? undefined,
  });

  return NextResponse.json({
    ok: true,
    draftId: data.id,
    rowCount: payload.length,
    validation,
  });
}
