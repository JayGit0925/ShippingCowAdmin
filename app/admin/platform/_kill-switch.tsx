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
  boxSizing: 'border-box' as const,
};

const labelStyle = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 9,
  color: BRAND.red,
  letterSpacing: '0.04em',
  display: 'block',
  marginBottom: 6,
};

export function KillSwitchPanel({
  current,
}: {
  current: { default_enabled: boolean } | null;
}) {
  const router = useRouter();
  const isEnabled = current?.default_enabled ?? false;
  const [aiOn, setAiOn] = useState(isEnabled);
  const [killModal, setKillModal] = useState(false);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitDisable() {
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
        body: JSON.stringify({ enabled: false, reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErr((data as { error?: string })?.error ?? `HTTP ${res.status}`);
        return;
      }
      setAiOn(false);
      setReason('');
      setKillModal(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function submitEnable() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/admin/platform/kill-switch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enabled: true, reason: 'Re-enabling Mooovy AI.' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErr((data as { error?: string })?.error ?? `HTTP ${res.status}`);
        return;
      }
      setAiOn(true);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Main status card */}
      <Card
        style={{
          padding: 20,
          border: `3px solid ${aiOn ? BRAND.green : BRAND.red}`,
          background: aiOn ? '#F0FFF4' : '#FEF2F2',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Eyebrow style={{ color: aiOn ? BRAND.green : BRAND.red }}>
              {'// MOOOVY AI — GLOBAL STATUS'}
            </Eyebrow>
            <div
              style={{
                fontFamily: "'Black Han Sans', sans-serif",
                fontSize: 20,
                color: BRAND.charcoal,
                textTransform: 'uppercase',
                margin: '4px 0',
              }}
            >
              {aiOn ? 'GLOBALLY ENABLED' : 'GLOBALLY DISABLED'}
            </div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: '#6B7280',
                marginTop: 4,
              }}
            >
              {aiOn
                ? 'All tenant Mooovy chats and insight generation are active.'
                : '⚠ All Mooovy requests returning static maintenance message.'}
            </div>
          </div>
          <Button
            variant={aiOn ? 'danger' : 'blue'}
            onClick={() => {
              if (aiOn) {
                setKillModal(true);
              } else {
                submitEnable();
              }
            }}
            disabled={busy}
          >
            {aiOn ? 'DISABLE AI' : 'ENABLE AI'}
          </Button>
        </div>
        {err ? (
          <div
            style={{
              marginTop: 12,
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
      </Card>

      {/* Disable confirmation modal */}
      {killModal ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(26,32,44,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Card
            style={{
              width: 440,
              padding: 28,
              background: BRAND.white,
              border: `3px solid ${BRAND.red}`,
              boxShadow: px(BRAND.red),
            }}
          >
            <Eyebrow style={{ color: BRAND.red }}>{'// EMERGENCY ACTION'}</Eyebrow>
            <div
              style={{
                fontFamily: "'Black Han Sans', sans-serif",
                fontSize: 22,
                color: BRAND.charcoal,
                textTransform: 'uppercase',
                margin: '8px 0 12px',
              }}
            >
              Disable Mooovy AI Globally?
            </div>
            <div
              style={{
                background: '#FEE2E2',
                border: `3px solid ${BRAND.red}`,
                padding: 12,
                marginBottom: 16,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: BRAND.charcoal,
              }}
            >
              All Mooovy chat requests will return a static unavailability message. This affects ALL
              tenants.
            </div>
            <label style={labelStyle}>{'// REASON (REQUIRED)'}</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Anthropic API outage, cost spike incident..."
              style={{ ...inputStyle, marginBottom: 16 }}
            />
            {err ? (
              <div
                style={{
                  border: `3px solid ${BRAND.red}`,
                  color: BRAND.red,
                  padding: '8px 12px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                {err}
              </div>
            ) : null}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button
                variant="ghost"
                onClick={() => {
                  setKillModal(false);
                  setReason('');
                  setErr(null);
                }}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={submitDisable} disabled={busy}>
                Confirm Disable
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
