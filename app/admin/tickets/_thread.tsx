import type { Route } from 'next';
import { BRAND } from '@/lib/brand';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/eyebrow';
import { ReplyForm } from './_reply-form';

export type ThreadMessage = {
  id: string;
  from_type: 'user' | 'admin' | 'note';
  body: string;
  created_at: string;
  author_id: string | null;
};

export type ThreadHeader = {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  org_id: string;
  assignee_user_id: string | null;
};

const fromTypeColor: Record<string, string> = {
  user: BRAND.blue,
  admin: BRAND.green,
  note: BRAND.amber,
};

export function Thread({
  header,
  messages,
}: {
  header: ThreadHeader;
  messages: ThreadMessage[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Eyebrow>{`#${header.id.slice(0, 8).toUpperCase()}`}</Eyebrow>
        <form
          action={`/api/admin/tickets/${header.id}/status` as Route}
          method="post"
          style={{ display: 'flex', gap: 6, alignItems: 'center' }}
        >
          <select
            name="status"
            defaultValue={header.status}
            style={selectStyle}
          >
            <option value="open">open</option>
            <option value="in_progress">in_progress</option>
            <option value="resolved">resolved</option>
          </select>
          <Button variant="ghost" size="sm">Set</Button>
        </form>
        <form
          action={`/api/admin/tickets/${header.id}/priority` as Route}
          method="post"
          style={{ display: 'flex', gap: 6, alignItems: 'center' }}
        >
          <select
            name="priority"
            defaultValue={header.priority}
            style={selectStyle}
          >
            <option value="urgent">urgent</option>
            <option value="high">high</option>
            <option value="normal">normal</option>
            <option value="low">low</option>
          </select>
          <Button variant="ghost" size="sm">Set</Button>
        </form>
      </div>

      <h2
        style={{
          fontFamily: "'Black Han Sans', sans-serif",
          fontSize: 22,
          color: BRAND.charcoal,
          textTransform: 'uppercase',
          marginTop: 0,
        }}
      >
        {header.subject}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m) => (
          <Card key={m.id} style={{ padding: 14 }}>
            <div
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 8,
                color: fromTypeColor[m.from_type] ?? BRAND.charcoal,
                letterSpacing: '0.04em',
                marginBottom: 6,
              }}
            >
              {m.from_type.toUpperCase()} ·{' '}
              {new Date(m.created_at).toISOString().slice(0, 16).replace('T', ' ')}
            </div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: BRAND.charcoal,
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.body}
            </div>
          </Card>
        ))}
        {messages.length === 0 ? (
          <Card style={{ padding: 14 }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.charcoal }}>
              No messages yet.
            </p>
          </Card>
        ) : null}
      </div>

      <Card style={{ padding: 14 }}>
        <ReplyForm ticketId={header.id} />
      </Card>
    </div>
  );
}

const selectStyle: import('react').CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  padding: '4px 8px',
  border: `2px solid ${BRAND.charcoal}`,
  background: BRAND.white,
  color: BRAND.charcoal,
  outline: 'none',
  borderRadius: 0,
};
