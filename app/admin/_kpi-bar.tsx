import { BRAND } from '@/lib/brand';
import type { KpiResult } from '@/lib/metrics';

export function KpiBar({ kpis }: { kpis: KpiResult[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 12,
      }}
    >
      {kpis.map((k, i) => (
        <div
          key={i}
          style={{
            background: BRAND.white,
            border: `3px solid ${BRAND.charcoal}`,
            boxShadow: `4px 4px 0 ${BRAND.charcoal}`,
            padding: 14,
          }}
        >
          <div
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 9,
              color: BRAND.blue,
              letterSpacing: '0.04em',
              marginBottom: 6,
            }}
          >
            {k.label}
          </div>
          <div
            style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 24,
              color: k.degraded ? BRAND.amber : BRAND.charcoal,
              textTransform: 'uppercase',
            }}
          >
            {k.value}
          </div>
        </div>
      ))}
    </div>
  );
}
