import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { BRAND } from '@/lib/brand';
import { adminClient } from '@/lib/supabase/admin';
import { SUPABASE_CONFIGURED } from '@/lib/env';
import { TicketList, type TicketListItem } from './_ticket-list';

export const dynamic = 'force-dynamic';

export default async function TicketsIndexPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (!SUPABASE_CONFIGURED) {
    return (
      <Card style={{ padding: 24 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
          Supabase not configured.
        </p>
      </Card>
    );
  }
  const supabase = adminClient();
  const status = typeof searchParams.status === 'string' ? searchParams.status : null;
  let q = supabase
    .from('support_tickets')
    .select('id, subject, status, priority, org_id, updated_at')
    .order('updated_at', { ascending: false })
    .limit(100);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  const rows = ((error ? [] : data) ?? []) as TicketListItem[];

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 140px)' }}>
      <aside
        style={{
          width: 360,
          flexShrink: 0,
          background: BRAND.white,
          border: `3px solid ${BRAND.charcoal}`,
          boxShadow: `4px 4px 0 ${BRAND.charcoal}`,
          overflow: 'auto',
        }}
      >
        <div
          style={{
            padding: '10px 14px',
            borderBottom: `3px solid ${BRAND.charcoal}`,
            background: BRAND.pageBed,
          }}
        >
          <Eyebrow style={{ marginBottom: 0 }}>{'// TICKETS'}</Eyebrow>
        </div>
        <TicketList rows={rows} activeId={null} />
      </aside>
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Card style={{ padding: 24 }}>
          <p
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.charcoal }}
          >
            Select a ticket on the left.
          </p>
        </Card>
      </main>
    </div>
  );
}
