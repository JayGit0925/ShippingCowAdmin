'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BRAND, px } from '@/lib/brand';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Button } from '@/components/ui/button';

const inputStyle = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  padding: '6px 10px',
  border: `3px solid ${BRAND.charcoal}`,
  background: BRAND.white,
  color: BRAND.charcoal,
  outline: 'none',
  borderRadius: 0,
  width: '100%',
};

const labelStyle = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 9,
  color: BRAND.charcoal,
  letterSpacing: '0.04em',
  display: 'block',
  marginBottom: 4,
};

type QuotaRow = {
  org_id: string;
  org_name: string;
  tier: string;
  mooovy_used: number;
  mooovy_limit: number;
  csv_used: number;
  csv_limit: number;
  silo_used_gb: number;
  silo_limit_gb: number;
  ai_suspended: boolean;
};

function UsageCell({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? used / limit : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8,
          color: pct > 0.8 ? BRAND.amber : '#374151',
        }}
      >
        {used}/{limit}
      </span>
      <div
        style={{
          height: 6,
          background: BRAND.pageBed,
          border: `1px solid ${BRAND.charcoal}`,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(pct * 100, 100)}%`,
            background: pct > 0.8 ? BRAND.amber : BRAND.green,
          }}
        />
      </div>
    </div>
  );
}

export function QuotaPanel({ quotas = [] }: { quotas?: QuotaRow[] }) {
  const router = useRouter();
  const [orgId, setOrgId] = useState('');
  const [mooovyTurns, setMooovyTurns] = useState('');
  const [csvParses, setCsvParses] = useState('');
  const [siloStorage, setSiloStorage] = useState('');
  const [aiSuspendedRaw, setAiSuspendedRaw] = useState(false);
  const [aiSuspendedTouched, setAiSuspendedTouched] = useState(false);
  const [reason, setReason] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setOk(null);
    if (!orgId.trim()) {
      setErr('org_id is required.');
      return;
    }

    const quotaOverride: Record<string, number> = {};
    const parseNum = (s: string): number | null => {
      const t = s.trim();
      if (!t) return null;
      const n = Number(t);
      return Number.isFinite(n) ? n : null;
    };
    const m = parseNum(mooovyTurns);
    if (m != null) quotaOverride.mooovy_turns = m;
    const c = parseNum(csvParses);
    if (c != null) quotaOverride.csv_parses = c;
    const s = parseNum(siloStorage);
    if (s != null) quotaOverride.silo_storage_gb = s;

    const body: Record<string, unknown> = {};
    if (Object.keys(quotaOverride).length > 0) body.quota_override = quotaOverride;
    if (aiSuspendedTouched) body.ai_suspended = aiSuspendedRaw;
    if (reason.trim()) body.reason = reason.trim();

    if (Object.keys(body).length === 0) {
      setErr('Provide at least one override, ai_suspended toggle, or reason.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/platform/quotas/${encodeURIComponent(orgId.trim())}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErr((data as { error?: string })?.error ?? `HTTP ${res.status}`);
        return;
      }
      setOk('Saved.');
      setOrgId('');
      setMooovyTurns('');
      setCsvParses('');
      setSiloStorage('');
      setReason('');
      setAiSuspendedTouched(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Quota table */}
      <div
        style={{
          border: `3px solid ${BRAND.charcoal}`,
          boxShadow: px(),
          background: BRAND.white,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 0.8fr 1.2fr 1.2fr 1.2fr 0.8fr 80px',
            padding: '8px 14px',
            background: BRAND.charcoal,
          }}
        >
          {['ORG', 'TIER', 'MOOOVY TURNS', 'CSV PARSES', 'SILO STORAGE', 'STATUS', 'ACTIONS'].map(
            (h) => (
              <span
                key={h}
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 8,
                  color: BRAND.sky,
                }}
              >
                {h}
              </span>
            ),
          )}
        </div>

        {/* Rows */}
        {quotas.length === 0 ? (
          <div
            style={{
              padding: 14,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: BRAND.charcoal,
            }}
          >
            No quota data. Database not connected or no orgs found.
          </div>
        ) : (
          quotas.map((row, i) => {
            const warn = row.ai_suspended ||
              row.mooovy_used / row.mooovy_limit > 0.8 ||
              row.csv_used / row.csv_limit > 0.8;
            return (
              <div
                key={row.org_id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 0.8fr 1.2fr 1.2fr 1.2fr 0.8fr 80px',
                  padding: '10px 14px',
                  borderBottom: `1px solid ${BRAND.pageBed}`,
                  alignItems: 'center',
                  background: i % 2 === 0 ? BRAND.white : BRAND.pageBed,
                }}
              >
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {row.org_name}
                </span>
                <span
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 8,
                    color: BRAND.blue,
                  }}
                >
                  {row.tier.toUpperCase()}
                </span>
                <UsageCell used={row.mooovy_used} limit={row.mooovy_limit} />
                <UsageCell used={row.csv_used} limit={row.csv_limit} />
                <span
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 8,
                    color: '#374151',
                  }}
                >
                  {row.silo_used_gb.toFixed(1)}/{row.silo_limit_gb} GB
                </span>
                <span
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 8,
                    color: warn ? BRAND.amber : BRAND.green,
                  }}
                >
                  {row.ai_suspended ? '// SUSP' : warn ? '// WARN' : '// OK'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setOrgId(row.org_id);
                    setShowForm(true);
                  }}
                >
                  Override
                </Button>
              </div>
            );
          })
        )}
      </div>

      {/* Override form */}
      {showForm ? (
        <Card style={{ padding: 18 }}>
          <Eyebrow>{'// PER-ORG QUOTA OVERRIDE'}</Eyebrow>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: BRAND.charcoal,
              marginTop: 6,
              marginBottom: 12,
            }}
          >
            Override an org&apos;s subscription quota or suspend AI for one tenant. Leave a field
            blank to skip it; only the fields you fill are sent.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={labelStyle}>ORG_ID</label>
              <input
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                placeholder="uuid"
                style={inputStyle}
              />
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 10,
              }}
            >
              <div>
                <label style={labelStyle}>MOOOVY TURNS</label>
                <input
                  type="number"
                  value={mooovyTurns}
                  onChange={(e) => setMooovyTurns(e.target.value)}
                  style={inputStyle}
                  min={0}
                />
              </div>
              <div>
                <label style={labelStyle}>CSV PARSES</label>
                <input
                  type="number"
                  value={csvParses}
                  onChange={(e) => setCsvParses(e.target.value)}
                  style={inputStyle}
                  min={0}
                />
              </div>
              <div>
                <label style={labelStyle}>SILO STORAGE GB</label>
                <input
                  type="number"
                  value={siloStorage}
                  onChange={(e) => setSiloStorage(e.target.value)}
                  style={inputStyle}
                  min={0}
                />
              </div>
            </div>
            <label
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 9,
                color: BRAND.charcoal,
                display: 'flex',
                gap: 6,
                alignItems: 'center',
                letterSpacing: '0.04em',
              }}
            >
              <input
                type="checkbox"
                checked={aiSuspendedRaw}
                onChange={(e) => {
                  setAiSuspendedRaw(e.target.checked);
                  setAiSuspendedTouched(true);
                }}
              />
              AI SUSPENDED
            </label>
            <div>
              <label style={labelStyle}>REASON</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                style={inputStyle}
                placeholder="Why are you adjusting quotas?"
              />
            </div>
            {err ? (
              <div
                style={{
                  border: `3px solid ${BRAND.red}`,
                  color: BRAND.red,
                  padding: '8px 12px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                }}
              >
                {err}
              </div>
            ) : null}
            {ok ? (
              <div
                style={{
                  border: `3px solid ${BRAND.green}`,
                  color: BRAND.green,
                  padding: '8px 12px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                }}
              >
                {ok}
              </div>
            ) : null}
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="blue" size="md" onClick={submit} disabled={busy}>
                Apply override
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setShowForm(false);
                  setErr(null);
                  setOk(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
            + Override Quota
          </Button>
        </div>
      )}
    </div>
  );
}
