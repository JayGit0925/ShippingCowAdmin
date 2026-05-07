'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BRAND } from '@/lib/brand';
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
      <Card style={{ padding: 14 }}>
        <Eyebrow>{'// NEW PIN'}</Eyebrow>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 10,
            marginTop: 8,
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
        <div style={{ marginTop: 10 }}>
          <Button
            variant="primary"
            size="sm"
            onClick={createPin}
            disabled={busy === '__create__'}
          >
            Create pin
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
      {pins.length === 0 ? (
        <Card style={{ padding: 14 }}>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: BRAND.charcoal,
              margin: 0,
            }}
          >
            No model pins. Default routing applies.
          </p>
        </Card>
      ) : (
        pins.map((pin) => {
          const id = asString(pin.id) ?? '';
          const pinRole = asString(pin.role) ?? '';
          const model = asString(pin.model_string) ?? '';
          const scope = asString(pin.org_id);
          const exp = asString(pin.expiry);
          return (
            <Card key={id} style={{ padding: 14 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: 10,
                      color: BRAND.blue,
                      marginBottom: 6,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {pinRole.toUpperCase()} · {model}
                  </div>
                  <div
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      color: BRAND.charcoal,
                    }}
                  >
                    Scope:{' '}
                    {scope ? (
                      <code style={{ fontSize: 11 }}>{scope}</code>
                    ) : (
                      <strong style={{ color: BRAND.amber }}>GLOBAL</strong>
                    )}
                    {exp ? (
                      <>
                        {' · '}Expires:{' '}
                        <code style={{ fontSize: 11 }}>
                          {new Date(exp).toISOString().slice(0, 16).replace('T', ' ')}
                        </code>
                      </>
                    ) : null}
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => deletePin(id)}
                  disabled={busy === id || !id}
                >
                  Delete
                </Button>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
