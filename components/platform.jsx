
// Platform Controls Section

const MOCK_FLAGS = [
  { key: 'enable_mooovy_report_gen', desc: 'Generate AI QBR reports from Mooovy', enabled: true, tiers: ['bull'], rollout: 100, updated: '2d ago' },
  { key: 'enable_2node_simulator', desc: 'Two-node routing simulator on dashboard', enabled: true, tiers: ['cow','bull'], rollout: 100, updated: '5d ago' },
  { key: 'enable_insight_digest_email', desc: 'Daily insight digest email send', enabled: true, tiers: ['calf','cow','bull'], rollout: 100, updated: '10d ago' },
  { key: 'enable_silo_v2', desc: 'Silo v2 file manager with folder support', enabled: false, tiers: ['bull'], rollout: 0, updated: '1d ago' },
  { key: 'enable_am_chat', desc: 'In-app chat with account manager', enabled: false, tiers: ['bull'], rollout: 25, updated: '3d ago' },
  { key: 'enable_carrier_api_live', desc: 'Live carrier rate API (replaces static rates)', enabled: false, tiers: ['cow','bull'], rollout: 10, updated: '12h ago' },
];

const MOCK_CARDS = [
  { id: 'c1', headline: 'FedEx Ground GRI +5.9% effective Jun 2026', category: 'Carrier', severity: 'warning', impact: '+$0.62/shipment', generated: '2026-05-01 06:00', state: 'pending' },
  { id: 'c2', headline: 'USPS postal rate increase delayed until Q3', category: 'Carrier', severity: 'opportunity', impact: 'Saves ~$0.18/shipment', generated: '2026-05-01 06:00', state: 'pending' },
  { id: 'c3', headline: 'New tariff on Chinese goods — electronics +25%', category: 'Trade', severity: 'warning', impact: 'Category dependent', generated: '2026-04-30 06:00', state: 'approved' },
];

function PlatformSection() {
  const { BRAND, pixelShadow, Btn, Eyebrow, Card, SeverityBadge, TabBar } = window;
  const [tab, setTab] = React.useState('FLAGS');
  const [flags, setFlags] = React.useState(MOCK_FLAGS.map(f => ({ ...f })));
  const [aiEnabled, setAiEnabled] = React.useState(true);
  const [killSwitchModal, setKillSwitchModal] = React.useState(false);
  const [cards, setCards] = React.useState(MOCK_CARDS.map(c => ({ ...c })));

  const toggleFlag = (key) => {
    setFlags(prev => prev.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f));
  };

  const ToggleSwitch = ({ on, onChange, disabled }) => (
    <div onClick={disabled ? undefined : onChange} style={{
      width: '44px', height: '24px', background: on ? BRAND.blue : '#e5e7eb',
      border: `3px solid ${BRAND.charcoal}`, cursor: disabled ? 'not-allowed' : 'pointer',
      position: 'relative', flexShrink: 0, transition: 'background 0.15s',
    }}>
      <div style={{
        position: 'absolute', top: '1px', left: on ? '19px' : '1px',
        width: '16px', height: '16px', background: BRAND.white,
        border: `2px solid ${BRAND.charcoal}`, transition: 'left 0.15s',
      }} />
    </div>
  );

  return (
    <div style={{ padding: '28px', background: BRAND.pageBed, minHeight: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <Eyebrow>// 05 — PLATFORM CONTROLS</Eyebrow>
        <h1 style={{ fontFamily: "'Black Han Sans',sans-serif", fontSize: '32px', color: BRAND.charcoal, textTransform: 'uppercase', lineHeight: 1 }}>Platform Controls</h1>
      </div>

      <TabBar tabs={['FLAGS', 'AI OPS', 'INSIGHT FEED', 'QUOTAS', 'EMAIL TEMPLATES']} active={tab} onSelect={setTab} style={{ marginBottom: '20px', background: BRAND.white }} />

      {tab === 'FLAGS' && (
        <div>
          {/* Kill switch */}
          <Card style={{ padding: '16px', marginBottom: '16px', borderLeft: `5px solid ${BRAND.red}`, background: !aiEnabled ? '#FEE2E2' : BRAND.white }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Eyebrow style={{ fontSize: '8px', color: BRAND.red }}>// GLOBAL KILL SWITCH</Eyebrow>
                <div style={{ fontFamily: "'Black Han Sans',sans-serif", fontSize: '16px', color: BRAND.charcoal, textTransform: 'uppercase' }}>Disable All Experimental Features</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Overrides all feature flags to false globally. Use during incidents only.</div>
              </div>
              <Btn variant="danger" size="sm">KILL ALL</Btn>
            </div>
          </Card>

          {/* Feature flag table */}
          <div style={{ border: `3px solid ${BRAND.charcoal}`, boxShadow: pixelShadow(), background: BRAND.white }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 60px 1fr 60px 80px', padding: '8px 14px', background: BRAND.charcoal }}>
              {['FLAG KEY','DESCRIPTION','ON/OFF','TIERS','ROLLOUT','UPDATED'].map(h => (
                <span key={h} style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: BRAND.sky }}>{h}</span>
              ))}
            </div>
            {flags.map((f, i) => (
              <div key={f.key} style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 60px 1fr 60px 80px', padding: '12px 14px', borderBottom: `1px solid ${BRAND.pageBed}`, alignItems: 'center', background: i % 2 === 0 ? BRAND.white : BRAND.pageBed }}>
                <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: BRAND.blue }}>{f.key}</span>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: '#374151' }}>{f.desc}</span>
                <ToggleSwitch on={f.enabled} onChange={() => toggleFlag(f.key)} />
                <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                  {f.tiers.map(t => (
                    <span key={t} style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '7px', padding: '2px 4px', background: BRAND.sky + '44', border: `1px solid ${BRAND.charcoal}`, color: BRAND.blue }}>{t}</span>
                  ))}
                </div>
                <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '9px', color: f.rollout === 100 ? BRAND.green : BRAND.amber }}>{f.rollout}%</span>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#9CA3AF' }}>{f.updated}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <Btn variant="blue" size="sm">+ New Flag</Btn>
          </div>
        </div>
      )}

      {tab === 'AI OPS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Global AI kill switch */}
          <Card style={{ padding: '20px', border: `3px solid ${aiEnabled ? BRAND.green : BRAND.red}`, background: aiEnabled ? '#F0FFF4' : '#FEF2F2' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Eyebrow style={{ color: aiEnabled ? BRAND.green : BRAND.red }}>// MOOOVY AI — GLOBAL STATUS</Eyebrow>
                <div style={{ fontFamily: "'Black Han Sans',sans-serif", fontSize: '20px', color: BRAND.charcoal, textTransform: 'uppercase' }}>
                  {aiEnabled ? 'GLOBALLY ENABLED' : 'GLOBALLY DISABLED'}
                </div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                  {aiEnabled ? 'All tenant Mooovy chats and insight generation are active.' : '⚠ All Mooovy requests returning static maintenance message.'}
                </div>
              </div>
              <Btn variant={aiEnabled ? 'danger' : 'blue'} onClick={() => { if (aiEnabled) setKillSwitchModal(true); else setAiEnabled(true); }}>
                {aiEnabled ? '🔴 DISABLE AI' : '🟢 ENABLE AI'}
              </Btn>
            </div>
          </Card>

          {/* Model version pinning */}
          <Card style={{ padding: '18px' }}>
            <Eyebrow style={{ marginBottom: '12px' }}>// MODEL VERSION PINS</Eyebrow>
            <div style={{ border: `3px solid ${BRAND.charcoal}`, background: BRAND.white }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 1fr', padding: '8px 14px', background: BRAND.charcoal }}>
                {['ORG (NULL=GLOBAL)','ROLE','MODEL STRING','PINNED BY'].map(h => (
                  <span key={h} style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: BRAND.sky }}>{h}</span>
                ))}
              </div>
              {[
                { org: '(global)', role: 'chat', model: 'claude-sonnet-4-20250514', by: 'founder@' },
                { org: 'Titan Outdoor Gear', role: 'insight', model: 'claude-haiku-4-5', by: 'founder@' },
              ].map((p, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 1fr', padding: '10px 14px', borderBottom: `1px solid ${BRAND.pageBed}`, alignItems: 'center', background: i % 2 === 0 ? BRAND.white : BRAND.pageBed }}>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', fontWeight: p.org === '(global)' ? '700' : '400' }}>{p.org}</span>
                  <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: BRAND.blue }}>{p.role}</span>
                  <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: '#374151' }}>{p.model}</span>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#9CA3AF' }}>{p.by}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '10px' }}>
              <Btn variant="ghost" size="sm">+ Add Pin</Btn>
            </div>
          </Card>
        </div>
      )}

      {tab === 'INSIGHT FEED' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Eyebrow>// AI-GENERATED CARD REVIEW QUEUE</Eyebrow>
            <Btn variant="blue" size="sm">+ Create Manual Card</Btn>
          </div>
          {cards.filter(c => c.state === 'pending').map(card => (
            <Card key={card.id} style={{ padding: '16px', borderLeft: `4px solid ${BRAND.yellow}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                    <SeverityBadge level={card.severity} />
                    <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', padding: '3px 6px', background: BRAND.sky + '44', border: `2px solid ${BRAND.charcoal}`, color: BRAND.blue }}>{card.category.toUpperCase()}</span>
                  </div>
                  <div style={{ fontFamily: "'Black Han Sans',sans-serif", fontSize: '16px', color: BRAND.charcoal, textTransform: 'uppercase', lineHeight: 1.2, marginBottom: '6px' }}>{card.headline}</div>
                  {card.impact && <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: BRAND.green }}>// IMPACT: {card.impact}</div>}
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#9CA3AF', marginTop: '6px' }}>Generated {card.generated}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <Btn variant="primary" size="sm" onClick={() => setCards(prev => prev.map(c => c.id === card.id ? { ...c, state: 'approved' } : c))}>Approve</Btn>
                  <Btn variant="ghost" size="sm">Edit</Btn>
                  <Btn variant="danger" size="sm" onClick={() => setCards(prev => prev.map(c => c.id === card.id ? { ...c, state: 'rejected' } : c))}>Reject</Btn>
                </div>
              </div>
            </Card>
          ))}
          {cards.filter(c => c.state !== 'pending').length > 0 && (
            <div>
              <Eyebrow style={{ marginBottom: '10px' }}>// PUBLISHED CARDS</Eyebrow>
              {cards.filter(c => c.state === 'approved').map(card => (
                <Card key={card.id} style={{ padding: '12px 16px', marginBottom: '8px', opacity: 0.85 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', fontWeight: '600' }}>{card.headline}</span>
                    <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: BRAND.green }}>// LIVE</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'QUOTAS' && (
        <div>
          <div style={{ border: `3px solid ${BRAND.charcoal}`, boxShadow: pixelShadow(), background: BRAND.white }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1.2fr 1.2fr 1.2fr 0.8fr', padding: '8px 14px', background: BRAND.charcoal }}>
              {['ORG','TIER','MOOOVY TURNS','CSV PARSES','SILO STORAGE','STATUS'].map(h => (
                <span key={h} style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: BRAND.sky }}>{h}</span>
              ))}
            </div>
            {[
              { org: 'Titan Outdoor Gear', tier: 'bull', mooovy: [280,300], csv: [4,5], silo: [4.2,50], status: 'warning' },
              { org: 'HeavyLift Co.', tier: 'bull', mooovy: [190,300], csv: [3,5], silo: [2.1,50], status: 'ok' },
              { org: 'BluePeak Supplies', tier: 'cow', mooovy: [45,100], csv: [2,3], silo: [0.8,5], status: 'ok' },
              { org: 'Coastal Freight', tier: 'cow', mooovy: [8,100], csv: [0,3], silo: [0.1,5], status: 'ok' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1.2fr 1.2fr 1.2fr 0.8fr', padding: '10px 14px', borderBottom: `1px solid ${BRAND.pageBed}`, alignItems: 'center', background: i % 2 === 0 ? BRAND.white : BRAND.pageBed }}>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', fontWeight: '700' }}>{row.org}</span>
                <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: BRAND.blue }}>{row.tier.toUpperCase()}</span>
                {[row.mooovy, row.csv].map(([used, limit], j) => {
                  const pct = used/limit;
                  return (
                    <div key={j} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: pct > 0.8 ? BRAND.amber : '#374151' }}>{used}/{limit}</span>
                      <div style={{ height: '6px', background: BRAND.pageBed, border: `1px solid ${BRAND.charcoal}` }}>
                        <div style={{ height: '100%', width: `${pct*100}%`, background: pct > 0.8 ? BRAND.amber : BRAND.green }} />
                      </div>
                    </div>
                  );
                })}
                <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: '#374151' }}>{row.silo[0]} / {row.silo[1]} GB</span>
                <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: row.status === 'ok' ? BRAND.green : BRAND.amber }}>{row.status === 'ok' ? '// OK' : '// WARN'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'EMAIL TEMPLATES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {['Welcome', 'Upgrade confirmation', 'Payment failed', 'Payment retry', 'Suspension warning', 'Daily insight digest'].map((tmpl, i) => (
            <Card key={i} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '14px', fontWeight: '700' }}>{tmpl}</div>
                <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: '#9CA3AF', marginTop: '3px' }}>Last edited: {['3d ago','3d ago','1d ago','1d ago','5d ago','2d ago'][i]} · founder@</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <Btn variant="ghost" size="sm">Preview</Btn>
                <Btn variant="blue" size="sm">Edit</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* AI kill switch modal */}
      {killSwitchModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(26,32,44,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Card style={{ width: '440px', padding: '28px', background: BRAND.white, borderColor: BRAND.red }}>
            <Eyebrow style={{ color: BRAND.red }}>// EMERGENCY ACTION</Eyebrow>
            <div style={{ fontFamily: "'Black Han Sans',sans-serif", fontSize: '22px', color: BRAND.charcoal, textTransform: 'uppercase', margin: '8px 0 12px' }}>Disable Mooovy AI Globally?</div>
            <div style={{ background: '#FEE2E2', border: `3px solid ${BRAND.red}`, padding: '12px', marginBottom: '16px', fontFamily: "'DM Sans',sans-serif", fontSize: '13px' }}>
              All Mooovy chat requests will immediately return a static unavailability message. Insight generation will pause. This affects ALL tenants.
            </div>
            <label style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '9px', color: BRAND.red, display: 'block', marginBottom: '6px' }}>// REASON (REQUIRED)</label>
            <input placeholder="e.g. Anthropic API outage, cost spike incident..." style={{ width: '100%', fontFamily: "'DM Sans',sans-serif", fontSize: '13px', padding: '8px', border: `3px solid ${BRAND.charcoal}`, boxSizing: 'border-box', marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => setKillSwitchModal(false)}>Cancel</Btn>
              <Btn variant="danger" onClick={() => { setAiEnabled(false); setKillSwitchModal(false); }}>Confirm Disable</Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { PlatformSection });
