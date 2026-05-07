import Link from 'next/link';
import type { Route } from 'next';
import { BRAND } from '@/lib/brand';

export type TicketListItem = {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  org_id: string;
  updated_at: string;
};

const priorityColor: Record<string, string> = {
  urgent: BRAND.red,
  high: BRAND.amber,
  normal: BRAND.charcoal,
  low: BRAND.sky,
};

export function TicketList({
  rows,
  activeId,
}: {
  rows: TicketListItem[];
  activeId: string | null;
}) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {rows.map((t) => (
        <li
          key={t.id}
          style={{
            borderBottom: `1px solid ${BRAND.sky}`,
            background: t.id === activeId ? BRAND.pageBed : BRAND.white,
          }}
        >
          <Link
            href={`/admin/tickets/${t.id}` as Route}
            style={{
              display: 'block',
              padding: '12px 14px',
              textDecoration: 'none',
              color: BRAND.charcoal,
            }}
          >
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              {t.subject}
            </div>
            <div
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 8,
                letterSpacing: '0.04em',
                color: priorityColor[t.priority] ?? BRAND.charcoal,
              }}
            >
              {t.status.toUpperCase()} · {t.priority.toUpperCase()} ·{' '}
              {new Date(t.updated_at).toISOString().slice(0, 10)}
            </div>
          </Link>
        </li>
      ))}
      {rows.length === 0 ? (
        <li
          style={{
            padding: 24,
            textAlign: 'center',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: BRAND.charcoal,
          }}
        >
          No tickets.
        </li>
      ) : null}
    </ul>
  );
}
