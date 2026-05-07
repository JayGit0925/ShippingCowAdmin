import { Eyebrow } from '@/components/ui/eyebrow';
import { BRAND } from '@/lib/brand';
import { fetchFailedPaymentQueue, fetchFunnel, fetchMrrSeries } from '@/lib/metrics';
import { Sparkline } from '@/components/ui/sparkline';
import { Funnel } from './_funnel';
import { FailedQueue } from './_failed-queue';

export const dynamic = 'force-dynamic';

export default async function RevenuePage() {
  const [funnel, queue, series] = await Promise.all([
    fetchFunnel(),
    fetchFailedPaymentQueue(),
    fetchMrrSeries(),
  ]);
  const points = series.map((s) => ({ x: s.month, y: s.new_mrr }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>{'// REVENUE'}</Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
          }}
        >
          Revenue
        </h1>
      </div>
      <Sparkline series={points} label="NEW MRR (12-MONTH TRAILING)" />
      <div>
        <Eyebrow>{'// CONVERSION FUNNEL (30D)'}</Eyebrow>
        <Funnel stages={funnel} />
      </div>
      <div>
        <Eyebrow>{'// FAILED PAYMENT QUEUE'}</Eyebrow>
        <FailedQueue rows={queue} />
      </div>
    </div>
  );
}
