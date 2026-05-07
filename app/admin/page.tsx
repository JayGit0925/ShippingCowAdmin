import { Eyebrow } from '@/components/ui/eyebrow';
import { BRAND } from '@/lib/brand';
import {
  fetchActiveOrgs,
  fetchCalfToCowRate,
  fetchChurnRisk,
  fetchFailedPayments,
  fetchMrr,
  fetchMrrSeries,
  fetchSignups30d,
} from '@/lib/metrics';
import { KpiBar } from './_kpi-bar';
import { MrrChart } from './_mrr-chart';
import { AlertQueue } from './_alert-queue';
import { HealthTiles } from './_health-tiles';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [mrr, active, signups, conv, churn, failed, mrrSeries] = await Promise.all([
    fetchMrr(),
    fetchActiveOrgs(),
    fetchSignups30d(),
    fetchCalfToCowRate(),
    fetchChurnRisk(),
    fetchFailedPayments(),
    fetchMrrSeries(),
  ]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>{'// DASHBOARD'}</Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
          }}
        >
          Operations
        </h1>
      </div>
      <KpiBar kpis={[mrr, active, signups, conv, churn, failed]} />
      <MrrChart series={mrrSeries} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <Eyebrow>{'// ALERTS'}</Eyebrow>
          <AlertQueue />
        </div>
        <div>
          <Eyebrow>{'// PLATFORM HEALTH'}</Eyebrow>
          <HealthTiles />
        </div>
      </div>
    </div>
  );
}
