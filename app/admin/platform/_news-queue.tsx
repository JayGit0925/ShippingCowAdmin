'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BRAND } from '@/lib/brand';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Button } from '@/components/ui/button';

type NewsItem = {
  id: string;
  headline: string;
  approval_state: string;
  created_at: string;
  severity?: string | null;
  category?: string | null;
  impact?: string | null;
};

const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  critical: { bg: BRAND.red, text: BRAND.white },
  high: { bg: BRAND.amber, text: BRAND.charcoal },
  medium: { bg: BRAND.blue, text: BRAND.white },
  low: { bg: BRAND.sky, text: BRAND.charcoal },
};

function SeverityBadge({ level }: { level: string | null | undefined }) {
  const lvl = (level ?? 'medium').toLowerCase();
  const colors = SEVERITY_COLORS[lvl] ?? SEVERITY_COLORS.medium;
  return (
    <span
      style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 7,
        padding: '3px 6px',
        background: colors.bg,
        color: colors.text,
        border: `2px solid ${BRAND.charcoal}`,
      }}
    >
      {lvl.toUpperCase()}
    </span>
  );
}

export function NewsQueuePanel({ items }: { items: NewsItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function act(id: string, kind: 'approve' | 'reject') {
    setBusy(`${kind}:${id}`);
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/admin/platform/news/${id}/${kind}`, {
        method: 'POST',
      });
      if (res.status === 503) {
        setInfo('news_items table not present — wire user-portal repo first.');
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErr((data as { error?: string })?.error ?? `HTTP ${res.status}`);
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Eyebrow>{'// AI-GENERATED CARD REVIEW QUEUE'}</Eyebrow>
        <Button variant="blue" size="sm">
          + Create Manual Card
        </Button>
      </div>

      {info ? (
        <div
          style={{
            border: `3px solid ${BRAND.amber}`,
            color: BRAND.charcoal,
            background: BRAND.pageBed,
            padding: '8px 12px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
          }}
        >
          {info}
        </div>
      ) : null}
      {err ? (
        <div
          style={{
            border: `3px solid ${BRAND.red}`,
            color: BRAND.red,
            padding: '8px 12px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
          }}
        >
          {err}
        </div>
      ) : null}

      {items.length === 0 ? (
        <Card style={{ padding: 14 }}>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: BRAND.charcoal,
              margin: 0,
            }}
          >
            No pending news items.
          </p>
        </Card>
      ) : (
        items.map((item) => (
          <Card
            key={item.id}
            style={{ padding: 16, borderLeft: `4px solid ${BRAND.yellow}` }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ flex: 1 }}>
                {/* Severity + category badges */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <SeverityBadge level={item.severity} />
                  {item.category ? (
                    <span
                      style={{
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: 8,
                        padding: '3px 6px',
                        background: `${BRAND.sky}44`,
                        border: `2px solid ${BRAND.charcoal}`,
                        color: BRAND.blue,
                      }}
                    >
                      {item.category.toUpperCase()}
                    </span>
                  ) : null}
                </div>

                {/* Timestamp */}
                <Eyebrow style={{ fontSize: 8, marginBottom: 4 }}>
                  {new Date(item.created_at).toISOString().slice(0, 16).replace('T', ' ')}
                </Eyebrow>

                {/* Headline */}
                <div
                  style={{
                    fontFamily: "'Black Han Sans', sans-serif",
                    fontSize: 16,
                    color: BRAND.charcoal,
                    textTransform: 'uppercase',
                    lineHeight: 1.2,
                    marginBottom: 6,
                  }}
                >
                  {item.headline}
                </div>

                {/* Impact line */}
                {item.impact ? (
                  <div
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: 8,
                      color: BRAND.green,
                    }}
                  >
                    {'// IMPACT: '}
                    {item.impact}
                  </div>
                ) : null}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => act(item.id, 'approve')}
                  disabled={busy === `approve:${item.id}`}
                >
                  Approve
                </Button>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => act(item.id, 'reject')}
                  disabled={busy === `reject:${item.id}`}
                >
                  Reject
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
