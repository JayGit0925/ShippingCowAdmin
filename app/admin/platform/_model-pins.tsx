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

type ModelRole = 'parser' | 'insight' | 'chat';

function asString(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

export function ModelPinsPanel({
  pins,
}: {
  pins: Array<Record<string, unknown>>;
}) {
  const router = useRouter();
  const [orgId, setOrgId] = useState('');
  const [role, setRole] = useState<ModelRole>('parser');
  const [modelString, setModelString] = useState('');
  const [expiry, setExpiry] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function createPin() {
    if (!modelString.trim()) {
      setErr('model_string is required.');
      return;
    }
    setBusy('__create__');
    setErr(null);
    try {
      const res = await fetch('/api/admin/platform/model-pins', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId.trim() || null,
          role,
          model_string: modelString.trim(),
          expiry: expiry || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErr((data as { error?: string })?.error ?? `HTTP ${res.status}`);
        return;
      }
      setOrgId('');
      setModelString('');
      setExpiry('');
      setShowForm(false);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function deletePin(pinId: string) {
    if (!confirm('Delete this pin?')) return;
    setBusy(pinId);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/platform/model-pins/${pinId}`, {
        method: 'DELETE',
      });
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
      <Card style={{ padding: 18 }}>
        <Eyebrow style={{ marginBottom: 12 }}>{'// MODEL VERSION PINS'}</Eyebrow>

        {/* Pins table */}
        <div
          style={{
            border: `3px solid ${BRAND.charcoal}`,
            background: BRAND.white,
            boxShadow: px(),
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 2fr 1fr 80px',
              padding: '8px 14px',
              background: BRAND.charcoal,
            }}
          >
            {['ORG (NULL=GLOBAL)', 'ROLE', 'MODEL STRING', 'PINNED BY', 'ACTIONS'].map((h) => (
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
            ))}
          </div>

          {/* Rows */}
          {pins.length === 0 ? (
            <div
              style={{
                padding: 14,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: BRAND.charcoal,
              }}
            >
              No model pins. Default routing applies.
            </div>
          ) : (
            pins.map((pin, i) => {
              const id = asString(pin.id) ?? '';
              const pinRole = asString(pin.role) ?? '';
              const model = asString(pin.model_string) ?? '';
              const orgIdVal = asString(pin.org_id);
              const pinnedBy = asString(pin.pinned_by) ?? asString(pin.updated_by) ?? '—';
              return (
                <div
                  key={id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 2fr 1fr 80px',
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
                      fontWeight: orgIdVal ? 400 : 700,
                    }}
                  >
                    {orgIdVal ?? '(global)'}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: 8,
                      color: BRAND.blue,
                    }}
                  >
                    {pinRole}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: 8,
                      color: '#374151',
                    }}
                  >
                    {model}
                  </span>
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      color: '#9CA3AF',
                    }}
                  >
                    {pinnedBy}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePin(id)}
                    disabled={busy === id || !id}
                  >
                    Unpin
                  </Button>
                </div>
              );
            })
          )}
        </div>

        {/* Add pin form */}
        {showForm ? (
          <div style={{ marginTop: 12 }}>
            <Eyebrow style={{ marginBottom: 8 }}>{'// ADD PIN'}</Eyebrow>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 10,
              }}
            >
              <div>
                <label style={labelStyle}>ORG_ID (blank = global)</label>
                <input
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  placeholder="uuid or blank"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>ROLE</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as ModelRole)}
                  style={inputStyle}
                >
                  <option value="parser">parser</option>
                  <option value="insight">insight</option>
                  <option value="chat">chat</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>MODEL_STRING</label>
                <input
                  value={modelString}
                  onChange={(e) => setModelString(e.target.value)}
                  placeholder="claude-..."
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>EXPIRY (optional)</label>
                <input
                  type="datetime-local"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
            {err ? (
              <div
                style={{
                  marginTop: 8,
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
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <Button
                variant="primary"
                size="sm"
                onClick={createPin}
                disabled={busy === '__create__'}
              >
                Save Pin
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setErr(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 10 }}>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
              + Add Pin
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
