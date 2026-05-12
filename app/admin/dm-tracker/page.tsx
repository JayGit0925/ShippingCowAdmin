import { createClient } from '@supabase/supabase-js';
import { BRAND, FONT, px } from '@/lib/brand';
import { Eyebrow } from '@/components/ui/eyebrow';
import { AddReplyForm } from './_add-reply-form';

export const dynamic = 'force-dynamic';

const ICP_TRIGGER = 5;

async function fetchReplies() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data } = await supabase
    .from('dm_tracking')
    .select('id, created_at, prospect_name, prospect_store, reply_tone, notes')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export default async function DmTrackerPage() {
  const replies = await fetchReplies();
  const count = replies.length;
  const remaining = Math.max(0, ICP_TRIGGER - count);
  const triggered = count >= ICP_TRIGGER;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>{'// DM TRACKER'}</Eyebrow>
        <h1 style={{ fontFamily: FONT.display, fontSize: 32, color: BRAND.charcoal, textTransform: 'uppercase', margin: 0 }}>
          Reply Log
        </h1>
      </div>

      <div style={{ border: `3px solid ${BRAND.charcoal}`, boxShadow: px(triggered ? BRAND.green : BRAND.blue), padding: 24, background: triggered ? '#f0faf4' : BRAND.white, maxWidth: 480 }}>
        <p style={{ fontFamily: FONT.pixel, fontSize: 9, opacity: 0.6, margin: '0 0 8px', letterSpacing: '0.04em' }}>ICP MINER TRIGGER</p>
        <p style={{ fontFamily: FONT.display, fontSize: 48, color: triggered ? BRAND.green : BRAND.charcoal, margin: 0 }}>
          {count} / {ICP_TRIGGER}
        </p>
        <p style={{ fontFamily: FONT.body, fontSize: 14, opacity: 0.7, margin: '8px 0 0' }}>
          {triggered
            ? 'Trigger reached — run: npm run icp-monitor'
            : `${remaining} more repl${remaining === 1 ? 'y' : 'ies'} to activate ICP miner`}
        </p>
      </div>

      <div style={{ border: `2px solid ${BRAND.charcoal}`, padding: 24, background: BRAND.white, maxWidth: 640 }}>
        <p style={{ fontFamily: FONT.pixel, fontSize: 9, opacity: 0.5, marginBottom: 16, letterSpacing: '0.04em' }}>LOG A REPLY</p>
        <AddReplyForm />
      </div>

      {replies.length > 0 && (
        <div style={{ border: `2px solid ${BRAND.charcoal}`, background: BRAND.white }}>
          <p style={{ fontFamily: FONT.pixel, fontSize: 9, opacity: 0.5, margin: '16px 16px 8px', letterSpacing: '0.04em' }}>
            REPLIES ({count})
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${BRAND.charcoal}` }}>
                {['Date', 'Prospect', 'Store', 'Tone', 'Notes'].map((h) => (
                  <th key={h} style={{ fontFamily: FONT.pixel, fontSize: 8, padding: '8px 16px', textAlign: 'left', opacity: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {replies.map((r: { id: string; created_at: string; prospect_name: string; prospect_store: string | null; reply_tone: string | null; notes: string | null }) => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${BRAND.sky}` }}>
                  <td style={{ fontFamily: FONT.body, fontSize: 13, padding: '10px 16px', opacity: 0.6 }}>
                    {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td style={{ fontFamily: FONT.body, fontSize: 14, padding: '10px 16px', fontWeight: 600 }}>{r.prospect_name}</td>
                  <td style={{ fontFamily: FONT.body, fontSize: 13, padding: '10px 16px', opacity: 0.7 }}>{r.prospect_store ?? '—'}</td>
                  <td style={{ fontFamily: FONT.body, fontSize: 13, padding: '10px 16px', color: r.reply_tone === 'positive' ? BRAND.green : r.reply_tone === 'negative' ? BRAND.red : BRAND.charcoal }}>
                    {r.reply_tone ?? '—'}
                  </td>
                  <td style={{ fontFamily: FONT.body, fontSize: 13, padding: '10px 16px', opacity: 0.7 }}>{r.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
