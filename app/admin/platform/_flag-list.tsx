'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BRAND, px } from '@/lib/brand';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Button } from '@/components/ui/button';
import type { FeatureFlag } from '@/lib/feature-flags';

const Toggle = ({ on, onChange }: { on: boolean; onChange: () => void }) => (
  <div
    onClick={onChange}
    style={{
      width: 44,
      height: 24,
      background: on ? BRAND.blue : '#e5e7eb',
      border: `3px solid ${BRAND.charcoal}`,
      cursor: 'pointer',
      position: 'relative',
      transition: 'background 0.15s',
      flexShrink: 0,
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: 1,
        left: on ? 19 : 1,
        width: 16,
        height: 16,
        background: BRAND.white,
        border: `2px solid ${BRAND.charcoal}`,
        transition: 'left 0.15s',
      }}
    />
  </div>
);

export function FlagList({ flags }: { flags: FeatureFlag[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showNewFlag, setShowNewFlag] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [killBusy, setKillBusy] = useState(false);

  async function upsert(flag: Partial<FeatureFlag> & { flag_key: string }) {
    setBusy(flag.flag_key);
    setErr(null);
    try {
      const res = await fetch('/api/admin/platform/flags', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(flag),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErr((data as { error?: string })?.error ?? `HTTP ${res.status}`);
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function killAll() {
    if (!confirm('Disable ALL experimental feature flags globally? This cannot be undone without re-enabling each flag.')) return;
    setKillBusy(true);
    setErr(null);
    try {
      for (const f of flags) {
        if (f.default_enabled) {
          await fetch('/api/admin/platform/flags', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ flag_key: f.flag_key, default_enabled: false }),
          });
        }
      }
      router.refresh();
    } finally {
      setKillBusy(false);
    }
  }

  async function createFlag() {
    if (!newKey.trim()) return;
    await upsert({ flag_key: newKey.trim(), default_enabled: false });
    setNewKey('');
    setShowNewFlag(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Kill All banner */}
      <div
        style={{
          padding: '14px 16px',
          border: `3px solid ${BRAND.red}`,
          borderLeft: `5px solid ${BRAND.red}`,
          background: BRAND.white,
          boxShadow: px(),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <Eyebrow style={{ fontSize: 8, color: BRAND.red }}>{'// GLOBAL KILL SWITCH'}</Eyebrow>
          <div
            style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 16,
              color: BRAND.charcoal,
              textTransform: 'uppercase',
            }}
          >
            Disable All Experimental Features
          </div>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: '#6B7280',
              marginTop: 2,
            }}
          >
            Overrides all feature flags to false globally.
          </div>
        </div>
        <Button variant="danger" size="sm" onClick={killAll} disabled={killBusy}>
          KILL ALL
        </Button>
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

      {/* Flags table */}
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
            gridTemplateColumns: '2fr 3fr 60px 1fr 60px 1fr 80px',
            padding: '8px 14px',
            background: BRAND.charcoal,
          }}
        >
          {['FLAG KEY', 'DESCRIPTION', 'ON/OFF', 'TIERS', 'ROLLOUT', 'UPDATED', 'ACTIONS'].map(
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
        {flags.length === 0 ? (
          <div
            style={{
              padding: '14px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: BRAND.charcoal,
            }}
          >
            No flags found.
          </div>
        ) : (
          flags.map((f, i) => (
            <div
              key={f.flag_key}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 3fr 60px 1fr 60px 1fr 80px',
                padding: '12px 14px',
                borderBottom: `1px solid ${BRAND.pageBed}`,
                alignItems: 'center',
                background: i % 2 === 0 ? BRAND.white : BRAND.pageBed,
              }}
            >
              <span
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 8,
                  color: BRAND.blue,
                }}
              >
                {f.flag_key}
              </span>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: '#374151',
                }}
              >
                {f.description ?? '—'}
              </span>
              <Toggle
                on={f.default_enabled}
                onChange={() =>
                  upsert({ flag_key: f.flag_key, default_enabled: !f.default_enabled })
                }
              />
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {(f.enabled_tiers ?? []).map((t) => (
                  <span
                    key={t}
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: 7,
                      padding: '2px 4px',
                      background: `${BRAND.sky}44`,
                      border: `1px solid ${BRAND.charcoal}`,
                      color: BRAND.blue,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <span
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 9,
                  color: f.rollout_pct === 100 ? BRAND.green : BRAND.amber,
                }}
              >
                {f.rollout_pct}%
              </span>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  color: '#9CA3AF',
                }}
              >
                {f.updated_at ? new Date(f.updated_at).toLocaleDateString() : '—'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  upsert({ flag_key: f.flag_key, default_enabled: !f.default_enabled })
                }
                disabled={busy === f.flag_key}
              >
                Toggle
              </Button>
            </div>
          ))
        )}
      </div>

      {/* New flag form */}
      {showNewFlag ? (
        <Card style={{ padding: 14 }}>
          <Eyebrow>{'// NEW FLAG'}</Eyebrow>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
            <input
              placeholder="snake_case_key"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createFlag()}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                padding: '6px 10px',
                border: `3px solid ${BRAND.charcoal}`,
                background: BRAND.white,
                color: BRAND.charcoal,
                outline: 'none',
                borderRadius: 0,
                maxWidth: 280,
              }}
            />
            <Button variant="primary" size="sm" onClick={createFlag} disabled={busy === newKey}>
              Create
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowNewFlag(false); setNewKey(''); }}>
              Cancel
            </Button>
          </div>
        </Card>
      ) : null}

      <div style={{ marginTop: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="blue" size="sm" onClick={() => setShowNewFlag(true)}>
          + New Flag
        </Button>
      </div>
    </div>
  );
}
