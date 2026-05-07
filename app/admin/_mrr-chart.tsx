import { Sparkline } from '@/components/ui/sparkline';
import type { MrrSeriesPoint } from '@/lib/metrics';

export function MrrChart({ series }: { series: MrrSeriesPoint[] }) {
  const points = series.map((s) => ({
    x: s.month,
    y: s.new_mrr + s.expansion_mrr - s.churned_mrr,
  }));
  return <Sparkline series={points} label="NET NEW MRR (12-MONTH TRAILING)" />;
}
