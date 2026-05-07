import { Card } from '@/components/ui/card';
import { BRAND } from '@/lib/brand';
import type { FunnelStages } from '@/lib/metrics';

export function Funnel({ stages }: { stages: FunnelStages }) {
  const items = [
    { label: 'CALF SIGNUPS', value: stages.calf_signups, color: BRAND.blue },
    { label: 'FIRST UPLOAD', value: stages.first_uploads, color: BRAND.midBlue },
    { label: 'UPGRADED TO COW', value: stages.upgraded_to_cow, color: BRAND.green },
  ];
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <Card style={{ padding: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((it) => (
          <div key={it.label}>
            <div
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 9,
                color: BRAND.blue,
                letterSpacing: '0.04em',
                marginBottom: 4,
              }}
            >
              {it.label} — {it.value.toLocaleString()}
            </div>
            <div
              style={{
                width: `${Math.max(2, (it.value / max) * 100)}%`,
                background: it.color,
                color: BRAND.white,
                fontFamily: "'Black Han Sans', sans-serif",
                fontSize: 16,
                padding: '6px 10px',
                border: `3px solid ${BRAND.charcoal}`,
                boxShadow: `4px 4px 0 ${BRAND.charcoal}`,
                textTransform: 'uppercase',
              }}
            >
              {it.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      {stages.degraded ? (
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: BRAND.amber,
            marginTop: 12,
          }}
        >
          Funnel degraded — `subscription_events` table not present.
        </p>
      ) : null}
    </Card>
  );
}
