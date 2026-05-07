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
  marginBottom: 6,
};

const bodyStyle = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  color: BRAND.charcoal,
};

export function KillSwitchPanel({
  current,
}: {
  current: { default_enabled: boolean } | null;
}) {
  const router = useRouter();
  const isEnabled = current?.default_enabled ?? false;
  const [enabled, setEnabled] = useState(isEnabled);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!reason.trim()) {
      setErr('Reason is required.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/admin/platform/kill-switch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enabled, reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErr((data as { error?: string })?.error ?? `HTTP ${res.status}`);
        return;
      }
      setReason('');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      style={{
        padding: 18,
        border: `3px solid ${isEnabled ? BRAND.charcoal : BRAND.red}`,
      }}
    >
      <Eyebrow>{'// AI KILL SWITCH'}</Eyebrow>
      <p style={{ ...bodyStyle, marginTop: 6, marginBottom: 12 }}>
        Current state:{' '}
        <strong style={{ color: isEnabled ? BRAND.green : BRAND.red }}>
          {isEnabled ? 'ENABLED' : 'DISABLED'}
        </strong>
        . When disabled, all Mooovy endpoints in the user portal return a static maintenance
        message and skip Anthropic calls.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label style={labelStyle}>REASON (required)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            style={inputStyle}
            placeholder="Why are you toggling the kill switch?"
          />
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
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          ENABLE MOOOVY
        </label>
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
        <div>
          <Button variant="blue" size="md" onClick={submit} disabled={busy}>
            Submit
          </Button>
        </div>
      </div>
    </Card>
  );
}
