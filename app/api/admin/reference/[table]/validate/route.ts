import { NextResponse } from 'next/server';
import { findReferenceTable } from '@/lib/reference';
import { validateDraft } from '@/lib/reference-validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: { table: string } },
) {
  const meta = findReferenceTable(params.table);
  if (!meta) return NextResponse.json({ error: 'unknown table' }, { status: 404 });

  let payload: unknown;
  try {
    const body = await req.json();
    payload = (body as { payload?: unknown })?.payload;
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }
  if (payload == null) {
    return NextResponse.json({ error: 'payload required' }, { status: 400 });
  }

  const result = validateDraft(meta.table, payload);
  return NextResponse.json(result);
}
