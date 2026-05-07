import { notFound } from 'next/navigation';
import { Eyebrow } from '@/components/ui/eyebrow';
import { BRAND } from '@/lib/brand';
import { adminClient } from '@/lib/supabase/admin';
import { SUPABASE_CONFIGURED } from '@/lib/env';
import { TicketList, type TicketListItem } from '../_ticket-list';
import { Thread, type ThreadHeader, type ThreadMessage } from '../_thread';

export const dynamic = 'force-dynamic';

export default async function TicketThreadPage({
  params,
}: {
  params: { ticketId: string };
}) {
  if (!SUPABASE_CONFIGURED) notFound();
  const supabase = adminClient();
  const [headerRes, messagesRes, listRes] = await Promise.all([
    supabase
      .from('support_tickets')
      .select('id, subject, status, priority, org_id, assignee_user_id')
      .eq('id', params.ticketId)
      .single(),
    supabase
      .from('ticket_messages')
      .select('id, from_type, body, created_at, author_id')
      .eq('ticket_id', params.ticketId)
      .order('created_at', { ascending: true }),
    supabase
      .from('support_tickets')
      .select('id, subject, status, priority, org_id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(100),
  ]);
  if (headerRes.error || !headerRes.data) notFound();
  const header = headerRes.data as ThreadHeader;
  const messages = (messagesRes.data ?? []) as ThreadMessage[];
  const list = (listRes.data ?? []) as TicketListItem[];

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
        <TicketList rows={list} activeId={header.id} />
      </aside>
      <main style={{ flex: 1, overflow: 'auto', padding: '0 4px' }}>
        <Thread header={header} messages={messages} />
      </main>
    </div>
  );
}
