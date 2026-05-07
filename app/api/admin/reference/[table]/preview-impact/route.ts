import { NextResponse } from 'next/server';
import { findReferenceTable } from '@/lib/reference';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _req: Request,
  { params }: { params: { table: string } },
) {
  const meta = findReferenceTable(params.table);
  if (!meta) return NextResponse.json({ error: 'unknown table' }, { status: 404 });

  return NextResponse.json(
    {
      error: 'preview-impact not yet implemented',
      reason:
        'Recalculating historic shipment costs under proposed rates requires the shipments table, which is delivered in Phase C.',
      table: meta.table,
    },
    { status: 501 },
  );
}
