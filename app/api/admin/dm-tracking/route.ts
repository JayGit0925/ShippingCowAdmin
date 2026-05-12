import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET() {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from('dm_tracking')
    .select('id, created_at, prospect_name, prospect_store, reply_tone, notes')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'fetch failed' }, { status: 500 });
  return NextResponse.json({ count: data.length, replies: data });
}

export async function POST(request: Request) {
  let body: {
    prospect_name: string;
    prospect_store?: string;
    reply_tone?: 'positive' | 'neutral' | 'negative';
    notes?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  if (!body.prospect_name?.trim()) {
    return NextResponse.json({ error: 'prospect_name required' }, { status: 400 });
  }

  const supabase = adminClient();
  const { error } = await supabase.from('dm_tracking').insert({
    prospect_name: body.prospect_name.trim(),
    prospect_store: body.prospect_store?.trim() ?? null,
    reply_tone: body.reply_tone ?? null,
    notes: body.notes?.trim() ?? null,
  });

  if (error) return NextResponse.json({ error: 'insert failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
