
// Command Dashboard — Section 1

function DashboardSection() {
  const { BRAND, pixelShadow, pixelShadowSm, Card, Badge, SeverityBadge, Btn, Eyebrow, TrendArrow } = window;
  const [mrrPeriod, setMrrPeriod] = React.useState('12mo');

  // Mock KPI data
  const kpis = [
    { label: 'MRR', value: '$84,200', trend: 12.4, sub: 'vs last month' },
    { label: 'ACTIVE ORGS', value: '1,247', trend: 8.1, sub: '30d growth' },
    { label: 'NEW SIGNUPS (30D)', value: '143', trend: -2.3, sub: 'vs prior 30d' },
    { label: 'CALF→COW (30D)', value: '18.4%', trend: 3.1, sub: 'conversion' },
    { label: 'CHURN RISK', value: '37', trend: -5.0, sub: '0 uploads / 30d' },
    { label: 'FAILED PAYMENTS', value: '12', trend: 4.2, sub: 'needs action' },
  ];

  // Mock MRR chart data
  const mrrData = [
    { month: 'Jun', new: 8200, expansion: 3100, churned: 1200 },
    { month: 'Jul', new: 9400, expansion: 3800, churned: 1500 },
    { month: 'Aug', new: 10100, expansion: 4200, churned: 1400 },
    { month: 'Sep', new: 11200, expansion: 4800, churned: 1800 },
    { month: 'Oct', new: 12400, expansion: 5200, churned: 2100 },
    { month: 'Nov', new: 13800, expansion: 5900, churned: 2300 },
    { month: 'Dec', new: 15200, expansion: 6400, churned: 2600 },
    { month: 'Jan', new: 16100, expansion: 7100, churned: 2800 },
    { month: 'Feb', new: 17400, expansion: 7600, churned: 3100 },
    { month: 'Mar', new: 18900, expansion: 8200, churned: 3400 },
    { month: 'Apr', new: 20200, expansion: 8900, churned: 3700 },
    { month: 'May', new: 21800, expansion: 9400, churned: 4000 },
  ];

  const alerts = [
    { type: 'New Bull onboarding request', org: 'Titan Outdoor Gear', severity: 'critical', time: '2m ago' },
    { type: 'Payment failure', org: 'BluePeak Supplies', severity: 'critical', time: '14m ago' },
    { type: 'AM assignment SLA breach', org: 'HeavyLift Co.', severity: 'critical', time: '1h ago' },
    { type: 'Payment failure, 2nd retry', org: 'KitchenPro Direct', severity: 'high', time: '2h ago' },
    { type: 'Churn risk', org: 'Coastal Freight', severity: 'high', time: '4h ago' },
    { type: 'Org health score drop', org: 'RedRock Wholesale', severity: 'high', time: '6h ago' },
    { type: 'AI cost spike', org: 'Summit Outdoors', severity: 'medium', time: '8h ago' },
    { type: 'Suspended, no resolution', org: 'LakeView Goods', severity: 'medium', time: '3d ago' },
  ];

  const healthTiles = [
    { label: 'MOOOVY API', value: '99.2%', sub: 'p50: 380ms · p95: 920ms', status: 'ok' },
    { label: 'AI SPEND TODAY', value: '$42.80', sub: '61% of $70 daily budget', status: 'ok' },
    { label: 'EDGE FN ERRORS', value: '3 errors', sub: '0.04% rate / last 1h', status: 'warn' },
    { label: 'STRIPE WEBHOOKS', value: 'Healthy', sub: '1,284 delivered / 24h', status: 'ok' },
  ];

  // Mini sparkline renderer
  const maxVal = Math.max(...mrrData.map(d => d.new + d.expansion));
  const chartH = 120;
  const chartW = 480;
  const periods = { '3mo': 3, '6mo': 6, '12mo': 12 };
  const visibleData = mrrData.slice(-periods[mrrPeriod]);

  const toPoints = (data, key, color) => {
    const pts = data.map((d, i) => {
      const x = (i / (data.length - 1)) * (chartW - 40) + 20;
      const y = chartH - 20 - (d[key] / maxVal) * (chartH - 30);
      return `${x},${y}`;
    }).join(' ');
    return pts;
  };

  return (
    <div style={{ padding: '28px', background: BRAND.pageBed, minHeight: '100%' }}>
      <div style={{ marginBottom: '24px' }}>
        <Eyebrow>// 01 — COMMAND DASHBOARD</Eyebrow>
        <h1 style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: '32px', color: BRAND.charcoal, textTransform: 'uppercase', lineHeight: 1 }}>
          Platform Overview
        </h1>
      </div>

      {/* KPI Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {kpis.map((kpi, i) => (
          <Card key={i} style={{ padding: '16px 14px' }}>
            <Eyebrow style={{ fontSize: '8px', marginBottom: '8px', color: '#6B7280' }}>{kpi.label}</Eyebrow>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '24px', fontWeight: '700', color: BRAND.charcoal, lineHeight: 1.1 }}>{kpi.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
              <TrendArrow value={kpi.trend} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#6B7280' }}>{kpi.sub}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts + Alerts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '16px', marginBottom: '16px' }}>

        {/* MRR Chart */}
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <Eyebrow>// MRR TREND</Eyebrow>
              <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: '18px', color: BRAND.charcoal, textTransform: 'uppercase' }}>Revenue Chart</div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {['3mo','6mo','12mo'].map(p => (
                <button key={p} onClick={() => setMrrPeriod(p)} style={{
                  fontFamily: "'Press Start 2P', monospace", fontSize: '8px', padding: '5px 8px',
                  background: mrrPeriod === p ? BRAND.blue : BRAND.white,
                  color: mrrPeriod === p ? BRAND.white : BRAND.charcoal,
                  border: `2px solid ${BRAND.charcoal}`, cursor: 'pointer',
                }}>{p}</button>
              ))}
            </div>
          </div>

          {/* SVG chart */}
          <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} style={{ overflow: 'visible' }}>
            {/* Grid lines */}
            {[0.25,0.5,0.75,1].map(f => (
              <line key={f} x1="20" y1={chartH - 20 - f*(chartH-30)} x2={chartW-20} y2={chartH - 20 - f*(chartH-30)}
                stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,3" />
            ))}
            {/* New MRR line */}
            <polyline points={toPoints(visibleData, 'new')} fill="none" stroke={BRAND.green} strokeWidth="2.5" />
            {/* Expansion line */}
            <polyline points={toPoints(visibleData, 'expansion')} fill="none" stroke={BRAND.teal} strokeWidth="2.5" />
            {/* Churned line */}
            <polyline points={toPoints(visibleData, 'churned')} fill="none" stroke={BRAND.red} strokeWidth="2.5" />
            {/* X labels */}
            {visibleData.map((d, i) => (
              <text key={i} x={(i / (visibleData.length - 1)) * (chartW-40)+20} y={chartH-4}
                textAnchor="middle" fontSize="9" fontFamily="'Press Start 2P', monospace" fill="#9CA3AF">{d.month}</text>
            ))}
          </svg>

          <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
            {[['New MRR', BRAND.green], ['Expansion', BRAND.teal], ['Churned', BRAND.red]].map(([lbl, clr]) => (
              <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '16px', height: '3px', background: clr }}></div>
                <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#6B7280' }}>{lbl}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Alerts Panel */}
        <Card style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 16px 12px', borderBottom: `3px solid ${BRAND.charcoal}`, background: BRAND.charcoal }}>
            <Eyebrow style={{ color: BRAND.sky }}>// ALERT QUEUE</Eyebrow>
            <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: '16px', color: BRAND.white, textTransform: 'uppercase' }}>
              {alerts.length} Active Alerts
            </div>
          </div>
          <div style={{ overflow: 'auto', maxHeight: '340px' }}>
            {alerts.map((a, i) => (
              <div key={i} style={{
                padding: '10px 14px',
                borderBottom: `2px solid ${BRAND.pageBed}`,
                display: 'flex', flexDirection: 'column', gap: '4px',
                background: i % 2 === 0 ? BRAND.white : BRAND.pageBed,
                cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = BRAND.sky + '44'}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? BRAND.white : BRAND.pageBed}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <SeverityBadge level={a.severity} />
                  <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#9CA3AF' }}>{a.time}</span>
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: BRAND.charcoal }}>{a.type}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280' }}>{a.org}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Platform Health Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {healthTiles.map((tile, i) => (
          <Card key={i} style={{ padding: '16px', borderLeft: `4px solid ${tile.status === 'ok' ? BRAND.green : BRAND.amber}` }}>
            <Eyebrow style={{ fontSize: '8px', color: '#6B7280' }}>{tile.label}</Eyebrow>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '22px', fontWeight: '700', color: BRAND.charcoal, margin: '4px 0' }}>{tile.value}</div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#9CA3AF', lineHeight: 1.6 }}>{tile.sub}</div>
            <div style={{ marginTop: '8px', width: '8px', height: '8px', background: tile.status === 'ok' ? BRAND.green : BRAND.amber, border: `2px solid ${BRAND.charcoal}` }}></div>
          </Card>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { DashboardSection });
