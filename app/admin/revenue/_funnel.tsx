import { Card } from '@/components/ui/card';
import { BRAND } from '@/lib/brand';
import type { FunnelStages } from '@/lib/metrics';

export function Funnel({ stages }: { stages: FunnelStages }) {
  const items = [
    { label: 'CALF SIGNUPS', value: stages.calf_signups, color: BRAND.charcoal },
    { label: 'FIRST UPLOAD', value: stages.first_uploads, color: BRAND.blue },
    { label: 'UPGRADED TO COW', value: stages.upgraded_to_cow, color: BRAND.yellow },
  ];
  const base = Math.max(1, items[0].value);
  return (
    <Card style={{ padding: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((it, idx) => {
          const pct = Math.round((it.value / base) * 1000) / 10;
          const convPct =
            idx > 0
              ? Math.round((it.value / Math.max(1, items[idx - 1].value)) * 1000) / 10
              : null;
          return (
            <div key={it.label}>
              {convPct !== null && (
                <div
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 8,
                    color: BRAND.blue,
                    letterSpacing: '0.04em',
                    marginBottom: 6,
                    paddingLeft: 6,
                  }}
                >
                  ↓ {convPct}%
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {it.label}
                </span>
                <span
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 9,
                    color: BRAND.blue,
                  }}
                >
                  {it.value.toLocaleString()}
                </span>
              </div>
              <div
                style={{
                  height: 28,
                  background: BRAND.pageBed,
                  border: `2px solid ${BRAND.charcoal}`,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.max(2, pct)}%`,
                    background: it.color,
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: 6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 8,
                    color: '#9CA3AF',
                  }}
                >
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
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
