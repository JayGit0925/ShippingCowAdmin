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
};

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
          <Card key={item.id} style={{ padding: 14 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <div>
                <Eyebrow>
                  {new Date(item.created_at).toISOString().slice(0, 16).replace('T', ' ')}
                </Eyebrow>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    color: BRAND.charcoal,
                    fontWeight: 600,
                  }}
                >
                  {item.headline}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => act(item.id, 'approve')}
                  disabled={busy === `approve:${item.id}`}
                >
                  Approve
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
