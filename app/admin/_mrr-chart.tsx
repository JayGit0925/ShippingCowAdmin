'use client';
import { useState } from 'react';
import { Sparkline } from '@/components/ui/sparkline';
import { BRAND } from '@/lib/brand';
import type { MrrSeriesPoint } from '@/lib/metrics';

type Period = '3MO' | '6MO' | '12MO';
const PERIODS: Period[] = ['3MO', '6MO', '12MO'];
const MONTHS: Record<Period, number> = { '3MO': 3, '6MO': 6, '12MO': 12 };

export function MrrChart({ series }: { series: MrrSeriesPoint[] }) {
  const [period, setPeriod] = useState<Period>('12MO');
  const slice = series.slice(-MONTHS[period]);
  const points = slice.map((s) => ({
    x: s.month,
    y: s.new_mrr + s.expansion_mrr - s.churned_mrr,
  }));
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 9,
              padding: '4px 10px',
              border: `2px solid ${BRAND.charcoal}`,
              background: period === p ? BRAND.charcoal : 'transparent',
              color: period === p ? BRAND.white : BRAND.charcoal,
              cursor: 'pointer',
              letterSpacing: '0.03em',
            }}
          >
            {p}
          </button>
        ))}
      </div>
      <Sparkline series={points} label="NET NEW MRR (12-MONTH TRAILING)" />
    </div>
  );
}
