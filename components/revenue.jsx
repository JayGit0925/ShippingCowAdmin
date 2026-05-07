
// Revenue & Billing Section

const FAILED_PAYMENTS = [
  { org: 'BluePeak Supplies', tier: 'cow', amount: 890, reason: 'Insufficient funds', retries: 2, lastAttempt: '2h ago', state: 'Grace' },
  { org: 'KitchenPro Direct', tier: 'cow', amount: 490, reason: 'Card expired', retries: 1, lastAttempt: '4h ago', state: 'Grace' },
  { org: 'Desert Dispatch', tier: 'calf', amount: 49, reason: 'Card declined', retries: 3, lastAttempt: '3d ago', state: 'Suspended' },
  { org: 'VaultPack LLC', tier: 'cow', amount: 640, reason: 'Do not honor', retries: 0, lastAttempt: '30m ago', state: 'Grace' },
  { org: 'GrainBelt Freight', tier: 'bull', amount: 1800, reason: 'Insufficient funds', retries: 2, lastAttempt: '1d ago', state: 'Grace' },
];

const REVENUE_METRICS = [
  { label: 'NEW MRR', value: '$21,800', trend: '+12.4%', color: '#1A7A4A' },
  { label: 'EXPANSION MRR', value: '$9,400', trend: '+8.1%', color: '#0D9488' },
  { label: 'CHURNED MRR', value: '-$4,000', trend: '+3.2%', color: '#D64545' },
  { label: 'NET MRR CHANGE', value: '+$27,200', trend: '+9.8%', color: '#0052C9' },
  { label: 'ARR', value: '$1.01M', trend: '+11.2%', color: '#0052C9' },
  { label: 'CALF→COW CONV.', value: '18.4%', trend: '+3.1%', color: '#1A7A4A' },
];

const FUNNEL_DATA = [
  { stage: 'Calf Signups', count: 143, pct: 100 },
  { stage: 'First Upload', count: 98, pct: 68.5 },
  { stage: 'Upgraded to Cow', count: 26, pct: 18.2 },
];

function RevenueSection() {
  const { BRAND, pixelShadow, Badge, Btn, Eyebrow, Card, TrendArrow } = window;
  const [period, setPeriod] = React.useState('30d');

  return (
    <div style={{ padding: '28px', background: BRAND.pageBed, minHeight: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <Eyebrow>// 03 — REVENUE & BILLING</Eyebrow>
        <h1 style={{ fontFamily: "'Black Han Sans',sans-serif", fontSize: '32px', color: BRAND.charcoal, textTransform: 'uppercase', lineHeight: 1 }}>Revenue Overview</h1>
      </div>

      {/* Period selector */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
        {['30d','90d','12mo'].map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            fontFamily: "'Press Start 2P',monospace", fontSize: '9px', padding: '7px 14px',
            background: period === p ? BRAND.charcoal : BRAND.white,
            color: period === p ? BRAND.yellow : BRAND.charcoal,
            border: `3px solid ${BRAND.charcoal}`, cursor: 'pointer',
          }}>{p}</button>
        ))}
      </div>

      {/* Revenue metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '10px', marginBottom: '20px' }}>
        {REVENUE_METRICS.map((m, i) => (
          <Card key={i} style={{ padding: '14px', borderTop: `4px solid ${m.color}` }}>
            <Eyebrow style={{ fontSize: '8px', color: '#9CA3AF', marginBottom: '6px' }}>{m.label}</Eyebrow>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '18px', fontWeight: '700', color: m.color }}>{m.value}</div>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: '#9CA3AF', marginTop: '4px' }}>{m.trend}</div>
          </Card>
        ))}
      </div>

      {/* Funnel + Failed payments */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '16px', marginBottom: '20px' }}>
        {/* Conversion funnel */}
        <Card style={{ padding: '20px' }}>
          <Eyebrow style={{ marginBottom: '12px' }}>// CONVERSION FUNNEL</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {FUNNEL_DATA.map((f, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', fontWeight: '600' }}>{f.stage}</span>
                  <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '9px', color: BRAND.blue }}>{f.count}</span>
                </div>
                <div style={{ height: '28px', background: BRAND.pageBed, border: `2px solid ${BRAND.charcoal}`, position: 'relative' }}>
                  <div style={{ height: '100%', width: `${f.pct}%`, background: i === 0 ? BRAND.charcoal : i === 1 ? BRAND.blue : BRAND.yellow, transition: 'width 0.4s' }} />
                  <span style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: i === 2 ? BRAND.charcoal : '#9CA3AF' }}>{f.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Failed payments queue */}
        <Card style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', background: BRAND.charcoal, borderBottom: `3px solid ${BRAND.red}` }}>
            <Eyebrow style={{ color: BRAND.sky }}>// FAILED PAYMENT QUEUE</Eyebrow>
            <div style={{ fontFamily: "'Black Han Sans',sans-serif", fontSize: '16px', color: BRAND.white, textTransform: 'uppercase' }}>{FAILED_PAYMENTS.length} Orgs Need Attention</div>
          </div>
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.6fr 0.8fr 1.2fr 0.5fr 0.7fr 1.4fr', padding: '8px 14px', background: '#f9fafb', borderBottom: `2px solid ${BRAND.charcoal}` }}>
              {['ORG','TIER','AMOUNT','REASON','RETRIES','LAST','ACTIONS'].map(h => (
                <span key={h} style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '7px', color: '#9CA3AF' }}>{h}</span>
              ))}
            </div>
            {FAILED_PAYMENTS.map((fp, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.6fr 0.8fr 1.2fr 0.5fr 0.7fr 1.4fr', padding: '10px 14px', borderBottom: `1px solid ${BRAND.pageBed}`, alignItems: 'center' }}>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', fontWeight: '700' }}>{fp.org}</span>
                <Badge type="tier" value={fp.tier} />
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', fontWeight: '700', color: BRAND.red }}>${fp.amount}</span>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#6B7280' }}>{fp.reason}</span>
                <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '9px', color: fp.retries >= 2 ? BRAND.red : BRAND.amber }}>{fp.retries}</span>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#9CA3AF' }}>{fp.lastAttempt}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <Btn variant="primary" size="sm" style={{ fontSize: '7px', padding: '4px 6px' }}>Retry</Btn>
                  <Btn variant="ghost" size="sm" style={{ fontSize: '7px', padding: '4px 6px' }}>Extend</Btn>
                  <Btn variant="danger" size="sm" style={{ fontSize: '7px', padding: '4px 6px' }}>Suspend</Btn>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Dunning timeline */}
      <Card style={{ padding: '20px' }}>
        <Eyebrow style={{ marginBottom: '14px' }}>// DUNNING FLOW</Eyebrow>
        <div style={{ display: 'flex', gap: '0', position: 'relative' }}>
          {[
            { day: 'DAY 0', state: 'Failed', color: BRAND.red },
            { day: 'DAY +3', state: 'Retry 1', color: BRAND.amber },
            { day: 'DAY +8', state: 'Retry 2', color: BRAND.amber },
            { day: 'DAY +15', state: 'Grace', color: BRAND.blue },
            { day: 'DAY +22', state: 'Suspended', color: '#9CA3AF' },
            { day: 'DAY +52', state: 'Deactivated', color: BRAND.charcoal },
          ].map((step, i, arr) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              {i < arr.length - 1 && <div style={{ position: 'absolute', top: '14px', left: '50%', width: '100%', height: '3px', background: BRAND.charcoal, zIndex: 0 }} />}
              <div style={{ width: '28px', height: '28px', background: step.color, border: `3px solid ${BRAND.charcoal}`, zIndex: 1, position: 'relative', boxShadow: '2px 2px 0 #1A202C' }} />
              <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '7px', color: BRAND.blue, marginTop: '6px', textAlign: 'center' }}>{step.day}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', fontWeight: '700', textAlign: 'center' }}>{step.state}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { RevenueSection });
