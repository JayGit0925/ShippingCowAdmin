
// Reference Data Section — Rate Card Editor

const REF_TABLES = [
  { key: 'zone_matrix', label: 'Zone Matrix', rows: 42180, updated: 'Jan 15, 2026', updater: 'founder@', status: 'live' },
  { key: 'our_carrier_rates', label: 'Our Carrier Rates', rows: 1240, updated: 'Apr 1, 2026', updater: 'founder@', status: 'draft' },
  { key: 'carrier_retail_rates', label: 'Carrier Retail Rates', rows: 1480, updated: 'Apr 1, 2026', updater: 'founder@', status: 'live' },
  { key: 'our_warehousing_fees', label: 'Warehousing Fees', rows: 24, updated: 'Feb 20, 2026', updater: 'founder@', status: 'live' },
  { key: 'our_logistics_fees', label: 'Logistics Fees', rows: 18, updated: 'Feb 20, 2026', updater: 'founder@', status: 'live' },
  { key: 'category_benchmarks', label: 'Category Benchmarks', rows: 96, updated: 'Mar 1, 2026', updater: 'founder@', status: 'live' },
];

const MOCK_RATE_ROWS = [
  { carrier: 'FedEx Ground', service: 'Ground', zone: 2, weight: '1–5 lb', rate: 8.42 },
  { carrier: 'FedEx Ground', service: 'Ground', zone: 3, weight: '1–5 lb', rate: 9.18 },
  { carrier: 'FedEx Ground', service: 'Ground', zone: 4, weight: '1–5 lb', rate: 10.54 },
  { carrier: 'UPS Ground', service: 'Ground', zone: 2, weight: '1–5 lb', rate: 8.61 },
  { carrier: 'UPS Ground', service: 'Ground', zone: 3, weight: '1–5 lb', rate: 9.34 },
  { carrier: 'UPS Ground', service: 'Ground', zone: 4, weight: '1–5 lb', rate: 10.72 },
  { carrier: 'FedEx Ground', service: 'Ground', zone: 2, weight: '6–10 lb', rate: 11.20 },
  { carrier: 'FedEx Ground', service: 'Ground', zone: 3, weight: '6–10 lb', rate: 12.88 },
];

function EditorModal({ table, onClose }) {
  const { BRAND, pixelShadow, Btn, Eyebrow, Card, TabBar } = window;
  const [step, setStep] = React.useState(1); // 1=Edit, 2=Validate, 3=Preview, 4=Publish
  const [rows, setRows] = React.useState(MOCK_RATE_ROWS.map(r => ({ ...r })));
  const [publishNote, setPublishNote] = React.useState('');
  const [validated, setValidated] = React.useState(false);
  const [published, setPublished] = React.useState(false);

  const steps = ['EDIT', 'VALIDATE', 'PREVIEW IMPACT', 'PUBLISH'];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(26,32,44,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '900px', maxHeight: '90vh', background: BRAND.pageBed, border: `4px solid ${BRAND.charcoal}`, boxShadow: `8px 8px 0 ${BRAND.charcoal}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '18px 24px', background: BRAND.charcoal, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Eyebrow style={{ color: BRAND.sky }}>// REFERENCE DATA EDITOR</Eyebrow>
            <div style={{ fontFamily: "'Black Han Sans',sans-serif", fontSize: '18px', color: BRAND.white, textTransform: 'uppercase' }}>{table.label}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: `2px solid rgba(255,255,255,0.3)`, color: BRAND.white, fontSize: '18px', width: '36px', height: '36px', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Step tabs */}
        <div style={{ display: 'flex', background: BRAND.white, borderBottom: `3px solid ${BRAND.charcoal}` }}>
          {steps.map((s, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <div key={s} onClick={() => setStep(stepNum)} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 20px', cursor: 'pointer', flex: 1, justifyContent: 'center',
                borderBottom: isActive ? `3px solid ${BRAND.yellow}` : '3px solid transparent',
                background: isActive ? BRAND.pageBed : BRAND.white,
                marginBottom: '-3px',
              }}>
                <span style={{
                  width: '20px', height: '20px', background: isDone ? BRAND.green : isActive ? BRAND.blue : '#e5e7eb',
                  border: `2px solid ${BRAND.charcoal}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Press Start 2P',monospace", fontSize: '8px',
                  color: isDone || isActive ? BRAND.white : BRAND.charcoal, flexShrink: 0,
                }}>{isDone ? '✓' : stepNum}</span>
                <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: isActive ? BRAND.blue : '#9CA3AF' }}>{s}</span>
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>

          {step === 1 && (
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <Btn variant="ghost" size="sm">Import CSV</Btn>
                <Btn variant="ghost" size="sm">Discard Draft</Btn>
                <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: BRAND.amber, alignSelf: 'center', marginLeft: 'auto' }}>// UNSAVED DRAFT</span>
              </div>
              <div style={{ border: `3px solid ${BRAND.charcoal}`, background: BRAND.white }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.5fr 1fr 1fr', padding: '8px 12px', background: BRAND.charcoal }}>
                  {['CARRIER','SERVICE','ZONE','WEIGHT BAND','RATE ($)'].map(h => (
                    <span key={h} style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: BRAND.sky }}>{h}</span>
                  ))}
                </div>
                {rows.map((row, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.5fr 1fr 1fr', padding: '8px 12px', borderBottom: `1px solid ${BRAND.pageBed}`, alignItems: 'center', background: i % 2 === 0 ? BRAND.white : BRAND.pageBed }}>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px' }}>{row.carrier}</span>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px' }}>{row.service}</span>
                    <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '9px', color: BRAND.blue }}>{row.zone}</span>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px' }}>{row.weight}</span>
                    <input
                      value={row.rate}
                      onChange={e => { const newRows = [...rows]; newRows[i] = { ...row, rate: e.target.value }; setRows(newRows); }}
                      style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', fontWeight: '700', padding: '4px 8px', border: `2px solid ${BRAND.charcoal}`, width: '80px', background: BRAND.pageBed, outline: 'none' }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <Btn variant="blue" onClick={() => setStep(2)}>Run Validation →</Btn>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ background: BRAND.white, border: `3px solid ${BRAND.charcoal}`, padding: '24px', textAlign: 'center', marginBottom: '16px' }}>
                {!validated ? (
                  <div>
                    <div style={{ fontFamily: "'Black Han Sans',sans-serif", fontSize: '22px', color: BRAND.charcoal, textTransform: 'uppercase', marginBottom: '16px' }}>Run Validation</div>
                    <Btn variant="blue" onClick={() => setValidated(true)}>▶ Run Validation</Btn>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '20px' }}>
                      {[{ label: 'ROWS CHECKED', val: rows.length, color: BRAND.charcoal }, { label: 'ERRORS', val: 0, color: BRAND.green }, { label: 'WARNINGS', val: 1, color: BRAND.amber }].map(s => (
                        <Card key={s.label} style={{ padding: '16px 24px' }}>
                          <Eyebrow style={{ fontSize: '8px', color: '#9CA3AF' }}>{s.label}</Eyebrow>
                          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '32px', fontWeight: '700', color: s.color }}>{s.val}</div>
                        </Card>
                      ))}
                    </div>
                    <div style={{ background: '#FEF3C7', border: `3px solid ${BRAND.amber}`, padding: '12px', marginBottom: '16px', textAlign: 'left' }}>
                      <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: BRAND.amber }}>// WARNING</span>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', marginTop: '6px' }}>FedEx Ground Zone 4, 6–10 lb rate ($12.88) is 8% above prior version. Confirm this is intentional (GRI increase).</div>
                    </div>
                  </div>
                )}
              </div>
              {validated && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <Btn variant="ghost" onClick={() => setStep(1)}>← Back to Edit</Btn>
                  <Btn variant="blue" onClick={() => setStep(3)}>Preview Impact →</Btn>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ marginBottom: '12px' }}>
                <Eyebrow>// IMPACT PREVIEW — TOP 5 ORGS BY VOLUME</Eyebrow>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>Dry-run query: how would these rates change dashboard metrics for your highest-volume orgs?</div>
              </div>
              <div style={{ border: `3px solid ${BRAND.charcoal}`, background: BRAND.white }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 0.8fr', padding: '8px 14px', background: BRAND.charcoal }}>
                  {['ORG','CURR AVG/SHIP','NEW AVG/SHIP','DELTA $','DELTA %'].map(h => (
                    <span key={h} style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: BRAND.sky }}>{h}</span>
                  ))}
                </div>
                {[
                  ['Titan Outdoor Gear', '$14.22', '$14.84', '+$0.62', '+4.4%'],
                  ['HeavyLift Co.', '$12.80', '$13.37', '+$0.57', '+4.5%'],
                  ['Summit Outdoors', '$15.44', '$16.10', '+$0.66', '+4.3%'],
                  ['NorthStar Cargo', '$13.91', '$14.52', '+$0.61', '+4.4%'],
                  ['Ironworks Supply', '$11.20', '$11.69', '+$0.49', '+4.4%'],
                ].map(([org, curr, next, delta, pct], i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 0.8fr', padding: '10px 14px', borderBottom: `1px solid ${BRAND.pageBed}`, alignItems: 'center', background: i % 2 === 0 ? BRAND.white : BRAND.pageBed }}>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', fontWeight: '700' }}>{org}</span>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px' }}>{curr}</span>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px' }}>{next}</span>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: BRAND.red, fontWeight: '700' }}>{delta}</span>
                    <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '9px', color: BRAND.red }}>{pct}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <Btn variant="ghost" onClick={() => setStep(2)}>← Back</Btn>
                <Btn variant="blue" onClick={() => setStep(4)}>Proceed to Publish →</Btn>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              {!published ? (
                <Card style={{ padding: '24px', background: BRAND.white }}>
                  <Eyebrow style={{ marginBottom: '8px' }}>// PUBLISH RATE CARD</Eyebrow>
                  <div style={{ background: '#FEE2E2', border: `3px solid ${BRAND.red}`, padding: '12px', marginBottom: '16px', fontFamily: "'DM Sans',sans-serif", fontSize: '13px' }}>
                    ⚠ Publishing will immediately update all user dashboards. Materialized views will refresh within 10 minutes.
                  </div>
                  <label style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '9px', color: BRAND.blue, display: 'block', marginBottom: '6px' }}>// PUBLISH NOTE (REQUIRED)</label>
                  <textarea
                    value={publishNote} onChange={e => setPublishNote(e.target.value)}
                    placeholder="e.g. FedEx Ground Q2 2026 GRI +5.9%..."
                    style={{ width: '100%', minHeight: '80px', fontFamily: "'DM Sans',sans-serif", fontSize: '13px', border: `3px solid ${BRAND.charcoal}`, padding: '10px', background: BRAND.pageBed, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <Btn variant="ghost" onClick={() => setStep(3)}>← Back</Btn>
                    <Btn variant="dark" disabled={!publishNote.trim()} onClick={() => setPublished(true)}>🚀 PUBLISH NOW</Btn>
                  </div>
                </Card>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                  <div style={{ fontFamily: "'Black Han Sans',sans-serif", fontSize: '24px', color: BRAND.green, textTransform: 'uppercase', marginBottom: '8px' }}>Rate Card Published</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '14px', color: '#6B7280' }}>Materialized views refreshing — all org dashboards will update within 10 minutes.</div>
                  <Btn variant="blue" style={{ marginTop: '20px' }} onClick={onClose}>Done</Btn>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReferenceSection() {
  const { BRAND, pixelShadow, Btn, Eyebrow, Card } = window;
  const [editingTable, setEditingTable] = React.useState(null);

  return (
    <div style={{ padding: '28px', background: BRAND.pageBed, minHeight: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <Eyebrow>// 04 — REFERENCE DATA</Eyebrow>
        <h1 style={{ fontFamily: "'Black Han Sans',sans-serif", fontSize: '32px', color: BRAND.charcoal, textTransform: 'uppercase', lineHeight: 1 }}>Rate Card Editor</h1>
      </div>

      <div style={{ background: '#FEF3C7', border: `3px solid ${BRAND.amber}`, padding: '12px 16px', marginBottom: '20px', fontFamily: "'DM Sans',sans-serif", fontSize: '13px', boxShadow: `3px 3px 0 ${BRAND.charcoal}` }}>
        ⚠ <strong>Handle with care.</strong> Reference data powers every user dashboard. Treat publishes as production deployments: Edit → Validate → Preview Impact → Publish.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '24px' }}>
        {REF_TABLES.map(t => (
          <Card key={t.key} style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div style={{ fontFamily: "'Black Han Sans',sans-serif", fontSize: '15px', color: BRAND.charcoal, textTransform: 'uppercase', lineHeight: 1.2 }}>{t.label}</div>
              <span style={{
                fontFamily: "'Press Start 2P',monospace", fontSize: '8px', padding: '3px 7px',
                background: t.status === 'live' ? BRAND.green : BRAND.amber,
                color: BRAND.white, border: `2px solid ${BRAND.charcoal}`,
              }}>{t.status === 'live' ? '// LIVE' : '// DRAFT'}</span>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
              <div>
                <Eyebrow style={{ fontSize: '7px', color: '#9CA3AF', marginBottom: '2px' }}>ROWS</Eyebrow>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '16px', fontWeight: '700', color: BRAND.charcoal }}>{t.rows.toLocaleString()}</div>
              </div>
              <div>
                <Eyebrow style={{ fontSize: '7px', color: '#9CA3AF', marginBottom: '2px' }}>UPDATED</Eyebrow>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: '#6B7280' }}>{t.updated}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <Btn variant="blue" size="sm" onClick={() => setEditingTable(t)}>Edit →</Btn>
              <Btn variant="ghost" size="sm">History</Btn>
            </div>
          </Card>
        ))}
      </div>

      {/* Upcoming publishes */}
      <Card style={{ padding: '18px' }}>
        <Eyebrow style={{ marginBottom: '10px' }}>// SCHEDULED PUBLISHES</Eyebrow>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: '#9CA3AF' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${BRAND.pageBed}` }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: '600', fontSize: '14px' }}>Our Carrier Rates</span>
            <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: BRAND.blue }}>Effective Jun 1, 2026 · 00:00 ET</span>
            <Btn variant="danger" size="sm">Cancel</Btn>
          </div>
          <div style={{ padding: '12px 0', color: '#9CA3AF', fontFamily: "'Press Start 2P',monospace", fontSize: '9px' }}>// NO OTHER SCHEDULED PUBLISHES</div>
        </div>
      </Card>

      {editingTable && <EditorModal table={editingTable} onClose={() => setEditingTable(null)} />}
    </div>
  );
}

Object.assign(window, { ReferenceSection });
