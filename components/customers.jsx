
// Customers Section — Org list + Org Drawer with 5 tabs

const MOCK_ORGS = [
  { id: 'o1', name: 'Titan Outdoor Gear', tier: 'bull', mrr: 3200, members: 8, shipments: 1420, lastActive: '2m ago', status: 'active', zip: '94102', health: 87 },
  { id: 'o2', name: 'BluePeak Supplies', tier: 'cow', mrr: 890, members: 3, shipments: 342, lastActive: '1h ago', status: 'payment_failed', zip: '78201', health: 54 },
  { id: 'o3', name: 'HeavyLift Co.', tier: 'bull', mrr: 2800, members: 6, shipments: 980, lastActive: '30m ago', status: 'active', zip: '60601', health: 91 },
  { id: 'o4', name: 'KitchenPro Direct', tier: 'cow', mrr: 490, members: 2, shipments: 188, lastActive: '3h ago', status: 'payment_failed', zip: '30301', health: 42 },
  { id: 'o5', name: 'Coastal Freight', tier: 'cow', mrr: 640, members: 4, shipments: 0, lastActive: '32d ago', status: 'active', zip: '33101', health: 28 },
  { id: 'o6', name: 'RedRock Wholesale', tier: 'cow', mrr: 710, members: 3, shipments: 290, lastActive: '5d ago', status: 'active', zip: '85001', health: 61 },
  { id: 'o7', name: 'Summit Outdoors', tier: 'bull', mrr: 1900, members: 5, shipments: 720, lastActive: '12h ago', status: 'active', zip: '80201', health: 79 },
  { id: 'o8', name: 'LakeView Goods', tier: 'calf', mrr: 0, members: 1, shipments: 0, lastActive: '14d ago', status: 'suspended', zip: '55401', health: 15 },
  { id: 'o9', name: 'Prairie Box Co.', tier: 'calf', mrr: 0, members: 2, shipments: 14, lastActive: '2d ago', status: 'active', zip: '68501', health: 40 },
  { id: 'o10', name: 'Ironworks Supply', tier: 'cow', mrr: 550, members: 2, shipments: 201, lastActive: '8h ago', status: 'active', zip: '15201', health: 73 },
  { id: 'o11', name: 'NorthStar Cargo', tier: 'bull', mrr: 2100, members: 7, shipments: 880, lastActive: '1h ago', status: 'active', zip: '98101', health: 84 },
  { id: 'o12', name: 'Desert Dispatch', tier: 'calf', mrr: 0, members: 1, shipments: 2, lastActive: '20d ago', status: 'active', zip: '73101', health: 22 },
];

const MOCK_MEMBERS = [
  { name: 'Jordan Lee', email: 'jordan@titanoutdoor.com', role: 'owner', lastLogin: '2m ago', mfa: true, sessions: 2 },
  { name: 'Sam Rivera', email: 'sam@titanoutdoor.com', role: 'admin', lastLogin: '3h ago', mfa: true, sessions: 1 },
  { name: 'Alex Chen', email: 'alex@titanoutdoor.com', role: 'member', lastLogin: '1d ago', mfa: false, sessions: 0 },
];

const MOCK_ACTIVITY = [
  { ts: '2026-05-01 14:22', user: 'jordan@titanoutdoor.com', action: 'Uploaded file', detail: '1,842 rows · shipments_apr.csv' },
  { ts: '2026-05-01 14:18', user: 'jordan@titanoutdoor.com', action: 'Viewed Dashboard', detail: '' },
  { ts: '2026-05-01 11:03', user: 'sam@titanoutdoor.com', action: 'Asked Mooovy', detail: '"What are my top 5 zones by cost?"' },
  { ts: '2026-04-30 17:44', user: 'jordan@titanoutdoor.com', action: 'Downloaded report', detail: 'Monthly Summary · Apr 2026' },
  { ts: '2026-04-30 09:12', user: 'alex@titanoutdoor.com', action: 'Logged in', detail: 'IP 104.21.xx.xx · Chrome / macOS' },
  { ts: '2026-04-29 16:31', user: 'sam@titanoutdoor.com', action: 'Exported data', detail: 'carrier_breakdown.csv' },
];

function OrgDrawer({ org, onClose }) {
  const { BRAND, pixelShadow, Badge, Btn, Eyebrow, Card, TabBar } = window;
  const [tab, setTab] = React.useState('OVERVIEW');
  const [impersonateOpen, setImpersonateOpen] = React.useState(false);
  const [suspendOpen, setSuspendOpen] = React.useState(false);
  const [notes, setNotes] = React.useState('First Bull onboarding call scheduled May 3. Prefers FedEx Ground. High volume Q4.');

  const tabs = ['OVERVIEW', 'MEMBERS', 'ACTIVITY', 'BILLING', 'AUDIT'];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end',
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(26,32,44,0.5)' }} />

      {/* Drawer */}
      <div style={{
        width: '720px', background: BRAND.pageBed,
        borderLeft: `4px solid ${BRAND.charcoal}`,
        display: 'flex', flexDirection: 'column',
        boxShadow: `-8px 0 0 ${BRAND.charcoal}`,
        overflow: 'hidden',
      }}>
        {/* Drawer header */}
        <div style={{
          background: BRAND.charcoal, padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `3px solid ${BRAND.yellow}`,
        }}>
          <div>
            <Eyebrow style={{ color: BRAND.sky }}>// ORG DETAIL</Eyebrow>
            <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: '22px', color: BRAND.white, textTransform: 'uppercase' }}>{org.name}</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <Badge type="tier" value={org.tier} />
              <Badge type="status" value={org.status} />
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: `2px solid rgba(255,255,255,0.3)`,
            color: BRAND.white, fontSize: '18px', width: '36px', height: '36px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Tabs */}
        <TabBar tabs={tabs} active={tab} onSelect={setTab} style={{ background: BRAND.white, borderBottom: `3px solid ${BRAND.charcoal}` }} />

        {/* Tab content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>

          {tab === 'OVERVIEW' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Quick stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
                {[
                  { l: 'MRR', v: `$${org.mrr.toLocaleString()}` },
                  { l: 'MEMBERS', v: org.members },
                  { l: 'SHIPMENTS (30D)', v: org.shipments.toLocaleString() },
                  { l: 'HEALTH SCORE', v: org.health + '/100' },
                ].map(s => (
                  <Card key={s.l} style={{ padding: '12px' }}>
                    <Eyebrow style={{ fontSize: '8px', color: '#9CA3AF', marginBottom: '4px' }}>{s.l}</Eyebrow>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '20px', fontWeight: '700', color: BRAND.charcoal }}>{s.v}</div>
                  </Card>
                ))}
              </div>

              {/* Org info */}
              <Card style={{ padding: '16px' }}>
                <Eyebrow style={{ marginBottom: '12px' }}>// ORG INFO</Eyebrow>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    ['Created', 'Jan 12, 2025'],
                    ['Origin ZIP', org.zip],
                    ['Platforms', 'Shopify, Amazon'],
                    ['Billing cycle', 'Monthly'],
                    ['Stripe ID', 'cus_Pq8xR2...'],
                    ['Last active', org.lastActive],
                  ].map(([k,v]) => (
                    <div key={k} style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                      <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: '#9CA3AF', minWidth: '80px' }}>{k}</span>
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: BRAND.charcoal }}>{v}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Admin notes */}
              <Card style={{ padding: '16px' }}>
                <Eyebrow style={{ marginBottom: '8px' }}>// INTERNAL NOTES</Eyebrow>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{
                  width: '100%', minHeight: '80px', fontFamily: "'DM Sans',sans-serif", fontSize: '13px',
                  border: `2px solid ${BRAND.charcoal}`, padding: '8px', background: BRAND.pageBed,
                  resize: 'vertical', color: BRAND.charcoal, outline: 'none', boxSizing: 'border-box',
                }} />
                <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: '#9CA3AF', marginTop: '4px' }}>// AUTO-SAVED · VISIBLE TO ALL ADMINS</div>
              </Card>

              {/* Quick actions */}
              <div>
                <Eyebrow style={{ marginBottom: '10px' }}>// QUICK ACTIONS</Eyebrow>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <Btn variant="blue" size="sm" onClick={() => setImpersonateOpen(true)}>Impersonate Owner</Btn>
                  <Btn variant="ghost" size="sm" onClick={() => setSuspendOpen(true)}>Suspend Org</Btn>
                  <Btn variant="ghost" size="sm">Override Tier</Btn>
                  <Btn variant="ghost" size="sm">Force Logout All</Btn>
                  <Btn variant="danger" size="sm">CCPA Erasure</Btn>
                </div>
              </div>
            </div>
          )}

          {tab === 'MEMBERS' && (
            <div>
              <Eyebrow style={{ marginBottom: '12px' }}>// ORG MEMBERS</Eyebrow>
              <div style={{ border: `3px solid ${BRAND.charcoal}`, background: BRAND.white }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 80px 60px 120px', padding: '8px 14px', borderBottom: `2px solid ${BRAND.charcoal}`, background: BRAND.charcoal }}>
                  {['NAME','EMAIL','ROLE','LAST LOGIN','MFA','ACTIONS'].map(h => (
                    <span key={h} style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: BRAND.sky }}>{h}</span>
                  ))}
                </div>
                {MOCK_MEMBERS.map((m, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 80px 60px 120px', padding: '12px 14px', borderBottom: `1px solid ${BRAND.pageBed}`, alignItems: 'center' }}>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', fontWeight: '600' }}>{m.name}</span>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#6B7280' }}>{m.email}</span>
                    <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: m.role === 'owner' ? BRAND.blue : BRAND.charcoal }}>{m.role.toUpperCase()}</span>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#6B7280' }}>{m.lastLogin}</span>
                    <span style={{
                      fontFamily: "'Press Start 2P',monospace", fontSize: '8px',
                      color: m.mfa ? BRAND.green : BRAND.red,
                    }}>{m.mfa ? 'ON' : 'OFF'}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <Btn variant="ghost" size="sm" style={{ fontSize: '8px', padding: '4px 6px' }}>Impersonate</Btn>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'ACTIVITY' && (
            <div>
              <Eyebrow style={{ marginBottom: '12px' }}>// ACTIVITY LOG</Eyebrow>
              <div style={{ border: `3px solid ${BRAND.charcoal}`, background: BRAND.white }}>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px 1fr', padding: '8px 14px', borderBottom: `2px solid ${BRAND.charcoal}`, background: BRAND.charcoal }}>
                  {['TIMESTAMP','USER','ACTION','DETAIL'].map(h => (
                    <span key={h} style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: BRAND.sky }}>{h}</span>
                  ))}
                </div>
                {MOCK_ACTIVITY.map((a, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px 1fr', padding: '10px 14px', borderBottom: `1px solid ${BRAND.pageBed}`, alignItems: 'center', background: i % 2 === 0 ? BRAND.white : BRAND.pageBed }}>
                    <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: '#9CA3AF', lineHeight: 1.6 }}>{a.ts}</span>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#6B7280' }}>{a.user}</span>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', fontWeight: '600' }}>{a.action}</span>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#6B7280' }}>{a.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'BILLING' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Eyebrow>// BILLING & PAYMENTS</Eyebrow>
              <Card style={{ padding: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    ['Plan', 'Bull — $3,200/mo'],
                    ['Status', org.status === 'payment_failed' ? '⚠ PAYMENT FAILED' : 'Active'],
                    ['Next renewal', 'Jun 1, 2026'],
                    ['Stripe ID', 'cus_Pq8xR2Ab9dKL'],
                    ['Payment method', 'Visa ···· 4242 exp 09/27'],
                    ['Active coupons', 'None'],
                  ].map(([k,v]) => (
                    <div key={k}>
                      <Eyebrow style={{ fontSize: '8px', color: '#9CA3AF', marginBottom: '2px' }}>{k}</Eyebrow>
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '14px', color: org.status === 'payment_failed' && k === 'Status' ? BRAND.red : BRAND.charcoal, fontWeight: '600' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card style={{ padding: '16px' }}>
                <Eyebrow style={{ marginBottom: '10px' }}>// INVOICE HISTORY</Eyebrow>
                {[
                  { date: 'May 1, 2026', amount: '$3,200', status: 'failed' },
                  { date: 'Apr 1, 2026', amount: '$3,200', status: 'paid' },
                  { date: 'Mar 1, 2026', amount: '$3,200', status: 'paid' },
                ].map((inv, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${BRAND.pageBed}` }}>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px' }}>{inv.date}</span>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', fontWeight: '700' }}>{inv.amount}</span>
                    <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: inv.status === 'paid' ? BRAND.green : BRAND.red }}>{inv.status.toUpperCase()}</span>
                    <Btn variant="ghost" size="sm" style={{ fontSize: '8px', padding: '4px 7px' }}>PDF</Btn>
                  </div>
                ))}
              </Card>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Btn variant="primary" size="sm">Retry Payment</Btn>
                <Btn variant="ghost" size="sm">Apply Coupon</Btn>
                <Btn variant="ghost" size="sm">Pause Sub</Btn>
                <Btn variant="danger" size="sm">Cancel Sub</Btn>
              </div>
            </div>
          )}

          {tab === 'AUDIT' && (
            <div>
              <Eyebrow style={{ marginBottom: '12px' }}>// ADMIN ACTIONS ON THIS ORG</Eyebrow>
              <div style={{ border: `3px solid ${BRAND.charcoal}`, background: BRAND.white }}>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 120px 1fr 1fr', padding: '8px 14px', borderBottom: `2px solid ${BRAND.charcoal}`, background: BRAND.charcoal }}>
                  {['TIMESTAMP','ADMIN','ACTION','DETAIL'].map(h => (
                    <span key={h} style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: BRAND.sky }}>{h}</span>
                  ))}
                </div>
                {[
                  { ts: '2026-05-01 10:14', admin: 'founder@', action: 'IMPERSONATE_USER', detail: 'Target: jordan@titanoutdoor.com' },
                  { ts: '2026-04-15 09:32', admin: 'founder@', action: 'TIER_OVERRIDE', detail: 'Cow → Bull (trial 30d)' },
                  { ts: '2026-03-01 14:01', admin: 'founder@', action: 'COUPON_APPLIED', detail: 'BULL20 — 20% off, 3mo' },
                ].map((a, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 120px 1fr 1fr', padding: '10px 14px', borderBottom: `1px solid ${BRAND.pageBed}`, alignItems: 'center', background: i % 2 === 0 ? BRAND.white : BRAND.pageBed }}>
                    <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: '#9CA3AF', lineHeight: 1.6 }}>{a.ts}</span>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#6B7280' }}>{a.admin}</span>
                    <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: BRAND.blue }}>{a.action}</span>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#6B7280' }}>{a.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Impersonate modal */}
      {impersonateOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(26,32,44,0.7)' }}>
          <Card style={{ width: '480px', padding: '28px', background: BRAND.white }}>
            <Eyebrow>// IMPERSONATION</Eyebrow>
            <div style={{ fontFamily: "'Black Han Sans',sans-serif", fontSize: '20px', color: BRAND.charcoal, textTransform: 'uppercase', margin: '8px 0 16px' }}>Start Admin Session</div>
            <div style={{ background: '#FEF3C7', border: `3px solid ${BRAND.amber}`, padding: '12px', marginBottom: '16px', fontFamily: "'DM Sans',sans-serif", fontSize: '13px' }}>
              ⚠ You will be logged in as <strong>jordan@titanoutdoor.com</strong> in a new tab. This session will last 60 minutes max. The action is being recorded.
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Eyebrow style={{ marginBottom: '6px' }}>// REASON (REQUIRED)</Eyebrow>
              <select style={{ width: '100%', fontFamily: "'DM Sans',sans-serif", fontSize: '13px', padding: '8px', border: `3px solid ${BRAND.charcoal}` }}>
                <option>Support ticket</option>
                <option>Bug investigation</option>
                <option>Account setup assistance</option>
                <option>Sales demo</option>
                <option>Other</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Btn variant="ghost" onClick={() => setImpersonateOpen(false)}>Cancel</Btn>
              <Btn variant="blue" onClick={() => setImpersonateOpen(false)}>Start Session →</Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function CustomersSection() {
  const { BRAND, pixelShadow, Badge, Btn, Eyebrow, Card, Input } = window;
  const [search, setSearch] = React.useState('');
  const [tierFilter, setTierFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [selectedOrg, setSelectedOrg] = React.useState(null);
  const [sortCol, setSortCol] = React.useState('mrr');
  const [sortDir, setSortDir] = React.useState(-1);

  const filtered = MOCK_ORGS.filter(o => {
    const matchSearch = !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.zip.includes(search);
    const matchTier = tierFilter === 'all' || o.tier === tierFilter;
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchTier && matchStatus;
  }).sort((a, b) => sortDir * (a[sortCol] > b[sortCol] ? 1 : -1));

  const cols = [
    { key: 'name', label: 'ORG NAME', flex: 2 },
    { key: 'tier', label: 'TIER', flex: 0.6 },
    { key: 'mrr', label: 'MRR', flex: 0.8 },
    { key: 'members', label: 'MEMBERS', flex: 0.6 },
    { key: 'shipments', label: 'SHIPMENTS (30D)', flex: 1 },
    { key: 'lastActive', label: 'LAST ACTIVE', flex: 0.8 },
    { key: 'status', label: 'STATUS', flex: 0.8 },
    { key: '_actions', label: 'ACTIONS', flex: 1.2 },
  ];

  return (
    <div style={{ padding: '28px', background: BRAND.pageBed, minHeight: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <Eyebrow>// 02 — CUSTOMERS</Eyebrow>
        <h1 style={{ fontFamily: "'Black Han Sans',sans-serif", fontSize: '32px', color: BRAND.charcoal, textTransform: 'uppercase', lineHeight: 1 }}>Orgs & Users</h1>
      </div>

      {/* Filters */}
      <Card style={{ padding: '14px 16px', marginBottom: '16px', background: BRAND.white }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search org name, email, ZIP..."
            style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', padding: '8px 12px', border: `3px solid ${BRAND.charcoal}`, flex: '1 1 200px', outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: '4px' }}>
            <Eyebrow style={{ alignSelf: 'center', marginBottom: 0, marginRight: '6px' }}>TIER:</Eyebrow>
            {['all','calf','cow','bull'].map(t => (
              <button key={t} onClick={() => setTierFilter(t)} style={{
                fontFamily: "'Press Start 2P',monospace", fontSize: '8px', padding: '6px 10px',
                background: tierFilter === t ? BRAND.charcoal : BRAND.white,
                color: tierFilter === t ? BRAND.yellow : BRAND.charcoal,
                border: `2px solid ${BRAND.charcoal}`, cursor: 'pointer',
              }}>{t.toUpperCase()}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <Eyebrow style={{ alignSelf: 'center', marginBottom: 0, marginRight: '6px' }}>STATUS:</Eyebrow>
            {['all','active','suspended','payment_failed'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                fontFamily: "'Press Start 2P',monospace", fontSize: '8px', padding: '6px 10px',
                background: statusFilter === s ? BRAND.charcoal : BRAND.white,
                color: statusFilter === s ? BRAND.yellow : BRAND.charcoal,
                border: `2px solid ${BRAND.charcoal}`, cursor: 'pointer',
              }}>{s.replace('_',' ').toUpperCase()}</button>
            ))}
          </div>
          <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: '#9CA3AF', marginLeft: 'auto' }}>{filtered.length} ORGS</div>
        </div>
      </Card>

      {/* Table */}
      <div style={{ border: `3px solid ${BRAND.charcoal}`, boxShadow: pixelShadow(), background: BRAND.white }}>
        {/* Header */}
        <div style={{ display: 'flex', padding: '10px 14px', background: BRAND.charcoal, borderBottom: `2px solid ${BRAND.charcoal}` }}>
          {cols.map(c => (
            <div key={c.key} style={{ flex: c.flex, fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: BRAND.sky, cursor: c.key !== '_actions' ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => { if (c.key !== '_actions') { setSortCol(c.key); setSortDir(sortCol === c.key ? -sortDir : -1); } }}>
              {c.label}{sortCol === c.key && (sortDir === -1 ? ' ↓' : ' ↑')}
            </div>
          ))}
        </div>

        {/* Rows */}
        {filtered.map((org, i) => (
          <div key={org.id}
            style={{ display: 'flex', padding: '12px 14px', borderBottom: `1px solid ${BRAND.pageBed}`, alignItems: 'center', background: i % 2 === 0 ? BRAND.white : BRAND.pageBed, cursor: 'pointer', transition: 'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background = BRAND.sky + '33'}
            onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? BRAND.white : BRAND.pageBed}
          >
            <div style={{ flex: 2 }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '14px', fontWeight: '700', color: BRAND.charcoal }}>{org.name}</div>
              <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: '#9CA3AF' }}>ZIP {org.zip}</div>
            </div>
            <div style={{ flex: 0.6 }}><Badge type="tier" value={org.tier} /></div>
            <div style={{ flex: 0.8, fontFamily: "'DM Sans',sans-serif", fontSize: '14px', fontWeight: '700' }}>{org.mrr > 0 ? '$'+org.mrr.toLocaleString() : '—'}</div>
            <div style={{ flex: 0.6, fontFamily: "'DM Sans',sans-serif", fontSize: '13px' }}>{org.members}</div>
            <div style={{ flex: 1, fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: org.shipments === 0 ? BRAND.red : BRAND.charcoal }}>{org.shipments.toLocaleString()}</div>
            <div style={{ flex: 0.8, fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#6B7280' }}>{org.lastActive}</div>
            <div style={{ flex: 0.8 }}><Badge type="status" value={org.status === 'payment_failed' ? 'payment_failed' : org.status} /></div>
            <div style={{ flex: 1.2, display: 'flex', gap: '4px' }}>
              <Btn variant="blue" size="sm" onClick={() => setSelectedOrg(org)}>View</Btn>
              <Btn variant="ghost" size="sm">Suspend</Btn>
            </div>
          </div>
        ))}
      </div>

      {selectedOrg && <OrgDrawer org={selectedOrg} onClose={() => setSelectedOrg(null)} />}
    </div>
  );
}

Object.assign(window, { CustomersSection });
