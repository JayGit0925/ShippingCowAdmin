import { Card } from '@/components/ui/card';
import { BRAND } from '@/lib/brand';
import type { FunnelStages } from '@/lib/metrics';

const STEPS: { key: keyof Omit<FunnelStages, 'degraded'>; label: string; color: string }[] = [
  { key: 'visits',   label: 'VISITS',   color: BRAND.charcoal },
  { key: 'quotes',   label: 'QUOTES',   color: BRAND.blue },
  { key: 'trials',   label: 'TRIALS',   color: BRAND.yellow },
  { key: 'paid',     label: 'PAID',     color: '#10B981' },
  { key: 'expanded', label: 'EXPANDED', color: BRAND.amber },
];

export function Funnel({ stages }: { stages: FunnelStages }) {
  const base = Math.max(1, stages.visits);
  return (
    <Card style={{ padding: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {STEPS.map((step, idx) => {
          const value = stages[step.key];
          const barPct = Math.round((value / base) * 1000) / 10;
          const prevValue = idx > 0 ? stages[STEPS[idx - 1].key] : null;
          const convPct =
            prevValue !== null
              ? Math.round((value / Math.max(1, prevValue)) * 1000) / 10
              : null;
          return (
            <div key={step.key}>
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
                  {step.label}
                </span>
                <span
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 9,
                    color: BRAND.blue,
                  }}
                >
                  {value.toLocaleString()}
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
                    width: `${Math.max(2, barPct)}%`,
                    background: step.color,
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
                  {barPct}%
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
