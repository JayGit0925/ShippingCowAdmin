
// Audit Log Section

const ACTION_COLORS = {
  IMPERSONATE_USER: '#7C3AED',
  IMPERSONATE_USER_END: '#7C3AED',
  SUSPEND_ORG: '#D64545',
  REACTIVATE_ORG: '#1A7A4A',
  DEACTIVATE_ORG: '#D64545',
  TIER_OVERRIDE: '#0052C9',
  FORCE_LOGOUT_USER: '#E0A000',
  RATE_CARD_PUBLISH: '#0D9488',
  NEWS_CARD_PUBLISH: '#0D9488',
  NEWS_CARD_RETIRE: '#E0A000',
  AI_KILL_SWITCH_TOGGLE: '#D64545',
  FEATURE_FLAG_CHANGE: '#0052C9',
  QUOTA_OVERRIDE: '#0052C9',
  COUPON_APPLIED: '#1A7A4A',
  SUBSCRIPTION_CANCELLED: '#D64545',
  PAYMENT_RETRY: '#E0A000',
  CCPA_ERASURE: '#D64545',
  ADMIN_CREATED: '#1A7A4A',
};

const MOCK_AUDIT = [
  { id: 'a1', ts: '2026-05-01 14:22:08', actor: 'founder@shippingcow.com', role: 'super-admin', action: 'IMPERSONATE_USER', org: 'Titan Outdoor Gear', resource: 'user:jordan@titanoutdoor.com', reason: 'Support ticket', ip: '104.21.88.12' },
  { id: 'a2', ts: '2026-05-01 13:55:00', actor: 'founder@shippingcow.com', role: 'super-admin', action: 'RATE_CARD_PUBLISH', org: '—', resource: 'rate_card:our_carrier_rates', reason: 'FedEx Q2 2026 GRI +5.9%', ip: '104.21.88.12' },
  { id: 'a3', ts: '2026-05-01 11:10:44', actor: 'founder@shippingcow.com', role: 'super-admin', action: 'TIER_OVERRIDE', org: 'Titan Outdoor Gear', resource: 'org:o1', reason: 'Trial Bull upgrade — onboarding', ip: '104.21.88.12' },
  { id: 'a4', ts: '2026-04-30 16:02:11', actor: 'founder@shippingcow.com', role: 'super-admin', action: 'SUSPEND_ORG', org: 'LakeView Goods', resource: 'org:o8', reason: 'Non-payment after 22 days', ip: '104.21.88.12' },
  { id: 'a5', ts: '2026-04-30 09:18:35', actor: 'founder@shippingcow.com', role: 'super-admin', action: 'FEATURE_FLAG_CHANGE', org: '—', resource: 'flag:enable_carrier_api_live', reason: 'Rollout to 10% for A/B test', ip: '104.21.88.12' },
  { id: 'a6', ts: '2026-04-29 14:44:22', actor: 'founder@shippingcow.com', role: 'super-admin', action: 'NEWS_CARD_PUBLISH', org: '—', resource: 'news_card:c3', reason: 'Tariff update approved', ip: '104.21.88.12' },
  { id: 'a7', ts: '2026-04-28 10:31:09', actor: 'founder@shippingcow.com', role: 'super-admin', action: 'QUOTA_OVERRIDE', org: 'Titan Outdoor Gear', resource: 'org:o1', reason: 'Extra Mooovy turns during onboarding', ip: '104.21.88.12' },
  { id: 'a8', ts: '2026-04-27 15:20:55', actor: 'founder@shippingcow.com', role: 'super-admin', action: 'COUPON_APPLIED', org: 'Titan Outdoor Gear', resource: 'org:o1', reason: 'First Bull discount — BULL20', ip: '104.21.88.12' },
  { id: 'a9', ts: '2026-04-26 09:05:40', actor: 'founder@shippingcow.com', role: 'super-admin', action: 'PAYMENT_RETRY', org: 'BluePeak Supplies', resource: 'subscription:o2', reason: 'Manual retry after card update', ip: '104.21.88.12' },
  { id: 'a10', ts: '2026-04-25 11:14:18', actor: 'founder@shippingcow.com', role: 'super-admin', action: 'FORCE_LOGOUT_USER', org: 'Desert Dispatch', resource: 'user:user@desert.com', reason: 'Suspicious session detected', ip: '104.21.88.12' },
];

function AuditSection() {
  const { BRAND, pixelShadow, Btn, Eyebrow, Card } = window;
  const [search, setSearch] = React.useState('');
  const [actionFilter, setActionFilter] = React.useState('all');
  const [expanded, setExpanded] = React.useState(null);

  const actionTypes = ['all', 'IMPERSONATE_USER', 'SUSPEND_ORG', 'RATE_CARD_PUBLISH', 'TIER_OVERRIDE', 'FEATURE_FLAG_CHANGE', 'CCPA_ERASURE'];

  const filtered = MOCK_AUDIT.filter(a => {
    const matchSearch = !search || a.org.toLowerCase().includes(search.toLowerCase()) || a.action.includes(search.toUpperCase()) || a.actor.includes(search);
    const matchAction = actionFilter === 'all' || a.action === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div style={{ padding: '28px', background: BRAND.pageBed, minHeight: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <Eyebrow>// 06 — AUDIT LOG</Eyebrow>
        <h1 style={{ fontFamily: "'Black Han Sans',sans-serif", fontSize: '32px', color: BRAND.charcoal, textTransform: 'uppercase', lineHeight: 1 }}>Audit Log</h1>
      </div>

      {/* Immutability notice */}
      <div style={{ background: BRAND.charcoal, padding: '10px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', border: `3px solid ${BRAND.yellow}` }}>
        <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '9px', color: BRAND.yellow }}>// APPEND-ONLY</span>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: BRAND.white }}>No admin can edit or delete audit entries. Retained for 7 years minimum.</span>
      </div>

      {/* Filters */}
      <Card style={{ padding: '12px 16px', marginBottom: '14px', background: BRAND.white }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search actor, org, action..."
            style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', padding: '7px 12px', border: `3px solid ${BRAND.charcoal}`, flex: '1 1 200px', outline: 'none' }}
          />
          <select
            value={actionFilter} onChange={e => setActionFilter(e.target.value)}
            style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', padding: '7px 10px', border: `3px solid ${BRAND.charcoal}`, background: BRAND.white, cursor: 'pointer' }}
          >
            {actionTypes.map(t => <option key={t} value={t}>{t === 'all' ? 'ALL ACTIONS' : t}</option>)}
          </select>
          <Btn variant="ghost" size="sm">Export CSV</Btn>
          <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: '#9CA3AF' }}>{filtered.length} ENTRIES</span>
        </div>
      </Card>

      {/* Audit table */}
      <div style={{ border: `3px solid ${BRAND.charcoal}`, boxShadow: pixelShadow(), background: BRAND.white }}>
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1.5fr 1.8fr 1.5fr 1fr', padding: '8px 14px', background: BRAND.charcoal }}>
          {['TIMESTAMP','ACTOR','ACTION','ORG / RESOURCE','IP'].map(h => (
            <span key={h} style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: BRAND.sky }}>{h}</span>
          ))}
        </div>

        {filtered.map((entry, i) => {
          const isExpanded = expanded === entry.id;
          const actionColor = ACTION_COLORS[entry.action] || BRAND.charcoal;
          return (
            <div key={entry.id}>
              <div
                onClick={() => setExpanded(isExpanded ? null : entry.id)}
                style={{
                  display: 'grid', gridTemplateColumns: '160px 1.5fr 1.8fr 1.5fr 1fr',
                  padding: '10px 14px', borderBottom: `1px solid ${BRAND.pageBed}`,
                  alignItems: 'center', cursor: 'pointer',
                  background: isExpanded ? BRAND.sky + '22' : i % 2 === 0 ? BRAND.white : BRAND.pageBed,
                }}
                onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = BRAND.sky + '22'; }}
                onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = i % 2 === 0 ? BRAND.white : BRAND.pageBed; }}
              >
                <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: '#9CA3AF', lineHeight: 1.6 }}>{entry.ts}</span>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#6B7280' }}>{entry.actor}</span>
                <span style={{
                  fontFamily: "'Press Start 2P',monospace", fontSize: '8px',
                  color: actionColor,
                  background: actionColor + '18',
                  padding: '3px 6px',
                  display: 'inline-block',
                  border: `1px solid ${actionColor}44`,
                }}>{entry.action}</span>
                <div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', fontWeight: '600' }}>{entry.org}</div>
                  <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '7px', color: '#9CA3AF' }}>{entry.resource}</div>
                </div>
                <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '7px', color: '#9CA3AF' }}>{entry.ip}</span>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{ padding: '14px 20px', background: BRAND.pageBed, borderBottom: `2px solid ${BRAND.charcoal}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <Eyebrow style={{ fontSize: '8px', marginBottom: '6px' }}>// REASON</Eyebrow>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', background: BRAND.white, border: `2px solid ${BRAND.charcoal}`, padding: '8px 10px' }}>{entry.reason}</div>
                  </div>
                  <div>
                    <Eyebrow style={{ fontSize: '8px', marginBottom: '6px' }}>// BEFORE VALUE</Eyebrow>
                    <pre style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '7px', background: BRAND.white, border: `2px solid ${BRAND.charcoal}`, padding: '8px 10px', color: BRAND.red, lineHeight: 1.8, overflow: 'auto' }}>{`{ "tier": "cow",\n  "status": "active" }`}</pre>
                  </div>
                  <div>
                    <Eyebrow style={{ fontSize: '8px', marginBottom: '6px' }}>// AFTER VALUE</Eyebrow>
                    <pre style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '7px', background: BRAND.white, border: `2px solid ${BRAND.charcoal}`, padding: '8px 10px', color: BRAND.green, lineHeight: 1.8, overflow: 'auto' }}>{`{ "tier": "bull",\n  "status": "active",\n  "expires_at": "2026-06-01" }`}</pre>
                  </div>
                  <div>
                    <Eyebrow style={{ fontSize: '8px', marginBottom: '6px' }}>// ACTOR ROLE</Eyebrow>
                    <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '9px', background: BRAND.white, border: `2px solid ${BRAND.charcoal}`, padding: '8px 10px', color: BRAND.blue }}>{entry.role}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Security section — simplified
function SecuritySection() {
  const { BRAND, pixelShadow, Btn, Eyebrow, Card } = window;

  const suspiciousSessions = [
    { user: 'alex@titanoutdoor.com', org: 'Titan Outdoor Gear', event: 'New country login', detail: 'Germany (DE) — first time seen', ts: '2026-05-01 03:14', severity: 'high' },
    { user: 'owner@bluepeak.com', org: 'BluePeak Supplies', event: 'Impossible travel', detail: 'NYC → London in 45 min', ts: '2026-04-30 22:08', severity: 'critical' },
  ];

  return (
    <div style={{ padding: '28px', background: BRAND.pageBed, minHeight: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <Eyebrow>// 07 — SECURITY & COMPLIANCE</Eyebrow>
        <h1 style={{ fontFamily: "'Black Han Sans',sans-serif", fontSize: '32px', color: BRAND.charcoal, textTransform: 'uppercase', lineHeight: 1 }}>Security & Compliance</h1>
      </div>

      {/* Suspicious sessions */}
      <Card style={{ padding: '0', marginBottom: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', background: BRAND.charcoal, borderBottom: `3px solid ${BRAND.red}` }}>
          <Eyebrow style={{ color: BRAND.sky }}>// SUSPICIOUS SESSIONS</Eyebrow>
          <div style={{ fontFamily: "'Black Han Sans',sans-serif", fontSize: '16px', color: BRAND.white, textTransform: 'uppercase' }}>{suspiciousSessions.length} Flagged Sessions</div>
        </div>
        {suspiciousSessions.map((s, i) => (
          <div key={i} style={{ padding: '14px 18px', borderBottom: `1px solid ${BRAND.pageBed}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: i % 2 === 0 ? BRAND.white : BRAND.pageBed }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', padding: '3px 6px', background: s.severity === 'critical' ? BRAND.red : BRAND.amber, color: BRAND.white, border: `2px solid ${BRAND.charcoal}` }}>{s.severity.toUpperCase()}</span>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', fontWeight: '700' }}>{s.event}</span>
              </div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: '#6B7280' }}>{s.user} · {s.org}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#9CA3AF' }}>{s.detail} · {s.ts}</div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <Btn variant="ghost" size="sm">Flag</Btn>
              <Btn variant="danger" size="sm">Force Logout</Btn>
              <Btn variant="blue" size="sm">Notify User</Btn>
            </div>
          </div>
        ))}
      </Card>

      {/* CCPA / Admin user management side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Card style={{ padding: '18px' }}>
          <Eyebrow style={{ marginBottom: '10px' }}>// CCPA / GDPR ERASURE</Eyebrow>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: '#6B7280', marginBottom: '14px' }}>Submit a guided data erasure for any org. Requires typed confirmation. Irreversible.</div>
          <Btn variant="danger">Start Erasure Workflow →</Btn>
        </Card>

        <Card style={{ padding: '18px' }}>
          <Eyebrow style={{ marginBottom: '10px' }}>// ADMIN USER MANAGEMENT</Eyebrow>
          {[
            { email: 'founder@shippingcow.com', role: 'super-admin', active: true },
          ].map((admin, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${BRAND.pageBed}` }}>
              <div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', fontWeight: '700' }}>{admin.email}</div>
                <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: BRAND.blue }}>{admin.role}</div>
              </div>
              <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: BRAND.green }}>// ACTIVE</span>
            </div>
          ))}
          <Btn variant="blue" size="sm" style={{ marginTop: '12px' }}>+ Add Admin</Btn>
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { AuditSection, SecuritySection });
