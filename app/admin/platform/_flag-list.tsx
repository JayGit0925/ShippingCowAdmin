'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BRAND } from '@/lib/brand';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Button } from '@/components/ui/button';
import type { FeatureFlag } from '@/lib/feature-flags';

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

export function FlagList({ flags }: { flags: FeatureFlag[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');

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

  async function remove(flagKey: string) {
    if (!confirm(`Delete flag "${flagKey}"?`)) return;
    setBusy(flagKey);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/platform/flags/${flagKey}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErr((data as { error?: string })?.error ?? `HTTP ${res.status}`);
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card style={{ padding: 14 }}>
        <Eyebrow>{'// NEW FLAG'}</Eyebrow>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
          <input
            placeholder="snake_case_key"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            style={{ ...inputStyle, maxWidth: 280 }}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (newKey) {
                upsert({ flag_key: newKey, default_enabled: false });
                setNewKey('');
              }
            }}
          >
            Create
          </Button>
        </div>
      </Card>
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
      {flags.map((f) => (
        <Card key={f.flag_key} style={{ padding: 14 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 12,
              alignItems: 'start',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 10,
                  color: BRAND.blue,
                  marginBottom: 6,
                }}
              >
                {f.flag_key}
              </div>
              <textarea
                defaultValue={f.description ?? ''}
                onBlur={(e) =>
                  upsert({ flag_key: f.flag_key, description: e.target.value })
                }
                rows={2}
                style={{ ...inputStyle, marginBottom: 6 }}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <label
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 9,
                    color: BRAND.charcoal,
                    display: 'flex',
                    gap: 4,
                    alignItems: 'center',
                  }}
                >
                  <input
                    type="checkbox"
                    defaultChecked={f.default_enabled}
                    onChange={(e) =>
                      upsert({ flag_key: f.flag_key, default_enabled: e.target.checked })
                    }
                  />
                  DEFAULT
                </label>
                <label
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 9,
                    color: BRAND.charcoal,
                  }}
                >
                  ROLLOUT %
                  <input
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={f.rollout_pct}
                    onBlur={(e) =>
                      upsert({
                        flag_key: f.flag_key,
                        rollout_pct: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    style={{ ...inputStyle, width: 80, marginLeft: 6 }}
                  />
                </label>
                <label
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 9,
                    color: BRAND.charcoal,
                  }}
                >
                  TIERS (comma)
                  <input
                    defaultValue={f.enabled_tiers.join(',')}
                    onBlur={(e) =>
                      upsert({
                        flag_key: f.flag_key,
                        enabled_tiers: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    style={{ ...inputStyle, width: 160, marginLeft: 6 }}
                  />
                </label>
              </div>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => remove(f.flag_key)}
              disabled={busy === f.flag_key}
            >
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
