import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  let body: {
    name: string;
    company?: string;
    email: string;
    item_type?: string;
    weight_lbs?: number;
    origin_zip?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  if (!body.name?.trim() || !body.email?.trim()) {
    return NextResponse.json({ error: 'name and email required' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await supabase.from('quote_requests').insert({
    name: body.name.trim(),
    company: body.company?.trim() ?? null,
    email: body.email.trim(),
    item_type: body.item_type?.trim() ?? null,
    weight_lbs: body.weight_lbs ?? null,
    origin_zip: body.origin_zip?.trim() ?? null,
  });

  if (error) {
    console.error('quote_requests insert error:', error);
    return NextResponse.json({ error: 'failed to save' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
