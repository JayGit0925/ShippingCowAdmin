'use client';
import { useState, type CSSProperties } from 'react';
import { BRAND } from '@/lib/brand';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Button } from '@/components/ui/button';

type CcpaPreview = {
  org_id: string;
  org_name: string | null;
  members: number;
  shipments: number;
  conversations: number;
  files: number;
  notes: number;
  tickets: number;
  audit_entries_to_be_kept: number;
  upstream_missing: string[];
};

type CcpaOutcome = {
  deleted: Record<string, number>;
  skipped: string[];
  members_signed_out: number;
};

type Step = 'input' | 'preview' | 'confirm' | 'erasing' | 'done';

const inputStyle: CSSProperties = {
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

const labelStyle: CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 9,
  color: BRAND.charcoal,
  letterSpacing: '0.04em',
  display: 'block',
  marginBottom: 4,
  marginTop: 8,
};

const ERASURE_REASONS = ['User Request', 'Legal Order', 'Test Account'] as const;
type ErasureReason = (typeof ERASURE_REASONS)[number];

export function CcpaForm() {
  const [step, setStep] = useState<Step>('input');
  const [orgId, setOrgId] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState<ErasureReason>('User Request');
  const [ticketId, setTicketId] = useState('');
  const [preview, setPreview] = useState<CcpaPreview | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [outcome, setOutcome] = useState<CcpaOutcome | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setStep('input');
    setOrgId('');
    setEmail('');
    setReason('User Request');
    setTicketId('');
    setPreview(null);
    setConfirmText('');
    setOutcome(null);
    setErr(null);
    setBusy(false);
  }

  async function runPreview() {
    if (!orgId.trim()) {
      setErr('orgId required');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/admin/security/ccpa/preview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orgId: orgId.trim(), email: email.trim() || undefined }),
      });
      const data = (await res.json().catch(() => null)) as
        | (CcpaPreview & { error?: string })
        | null;
      if (!res.ok || !data) {
        setErr((data?.error as string | undefined) ?? `HTTP ${res.status}`);
        return;
      }
      setPreview(data);
      setStep('preview');
    } finally {
      setBusy(false);
    }
  }

  async function runErase() {
    if (!preview?.org_name) {
      setErr('org name unknown');
      return;
    }
    setBusy(true);
    setErr(null);
    setStep('erasing');
    try {
      const stripped = confirmText.startsWith('ERASE ')
        ? confirmText.slice('ERASE '.length)
        : confirmText;
      const res = await fetch('/api/admin/security/ccpa/erase', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          orgId: orgId.trim(),
          orgNameTyped: stripped,
          reason,
          email: email.trim() || undefined,
          ticketId: ticketId.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; outcome?: CcpaOutcome; error?: string }
        | null;
      if (!res.ok || !data?.ok || !data.outcome) {
        setErr(data?.error ?? `HTTP ${res.status}`);
        setStep('confirm');
        return;
      }
      setOutcome(data.outcome);
      setStep('done');
    } finally {
      setBusy(false);
    }
  }

  const expectedConfirm = preview?.org_name ? `ERASE ${preview.org_name}` : '';
  const confirmReady = expectedConfirm.length > 0 && confirmText === expectedConfirm;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {err ? (
        <div
          style={{
            border: `3px solid ${BRAND.red}`,
            color: BRAND.red,
            padding: '8px 12px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            background: BRAND.white,
          }}
        >
          {err}
        </div>
      ) : null}

      {step === 'input' ? (
        <>
          <div>
            <label style={labelStyle}>ORG ID</label>
            <input
              placeholder="uuid"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>REQUESTER EMAIL (OPTIONAL)</label>
            <input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>REASON</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ErasureReason)}
              style={inputStyle}
            >
              {ERASURE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>TICKET ID (OPTIONAL)</label>
            <input
              placeholder="ticket-1234"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <Button variant="primary" size="md" onClick={runPreview} disabled={busy}>
              {busy ? 'Loading…' : 'Preview cascade'}
            </Button>
          </div>
        </>
      ) : null}

      {step === 'preview' && preview ? (
        <>
          <Eyebrow>{`// PREVIEW: ${preview.org_name ?? '(unknown name)'}`}</Eyebrow>
          {preview.upstream_missing.length > 0 ? (
            <div
              style={{
                border: `3px solid ${BRAND.amber}`,
                background: '#FEF3C7',
                color: '#92400E',
                padding: '8px 12px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
              }}
            >
              <strong>Upstream tables missing:</strong>{' '}
              {preview.upstream_missing.join(', ')} — these will be skipped.
            </div>
          ) : null}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 8,
            }}
          >
            {[
              ['Members', preview.members],
              ['Shipments', preview.shipments],
              ['Conversations', preview.conversations],
              ['Files', preview.files],
              ['Notes', preview.notes],
              ['Tickets', preview.tickets],
              ['Audit (kept)', preview.audit_entries_to_be_kept],
            ].map(([label, value]) => (
              <div
                key={label as string}
                style={{
                  border: `3px solid ${BRAND.charcoal}`,
                  background: BRAND.white,
                  padding: 10,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 8,
                    color: BRAND.blue,
                    letterSpacing: '0.04em',
                    marginBottom: 4,
                  }}
                >
                  {label as string}
                </div>
                <div
                  style={{
                    fontFamily: "'Black Han Sans', sans-serif",
                    fontSize: 22,
                    color: BRAND.charcoal,
                  }}
                >
                  {String(value)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" size="sm" onClick={() => setStep('input')}>
              Back
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setConfirmText('');
                setStep('confirm');
              }}
              disabled={!preview.org_name}
            >
              Continue
            </Button>
          </div>
        </>
      ) : null}

      {step === 'confirm' && preview?.org_name ? (
        <>
          <Eyebrow>{'// TYPED CONFIRMATION'}</Eyebrow>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: BRAND.charcoal,
              margin: 0,
            }}
          >
            Type{' '}
            <code
              style={{
                fontSize: 13,
                background: BRAND.pageBed,
                border: `2px solid ${BRAND.charcoal}`,
                padding: '1px 6px',
              }}
            >
              ERASE {preview.org_name}
            </code>{' '}
            to confirm.
          </p>
          <input
            placeholder={`ERASE ${preview.org_name}`}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" size="sm" onClick={() => setStep('preview')}>
              Back
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={runErase}
              disabled={!confirmReady || busy}
            >
              Execute erasure
            </Button>
          </div>
        </>
      ) : null}

      {step === 'erasing' ? (
        <p
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 10,
            color: BRAND.blue,
            letterSpacing: '0.04em',
          }}
        >
          ERASING…
        </p>
      ) : null}

      {step === 'done' && outcome ? (
        <>
          <div
            style={{
              border: `3px solid ${BRAND.green}`,
              background: '#BBF7D0',
              color: '#166534',
              padding: '10px 12px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
            }}
          >
            <strong>Erasure complete.</strong> {outcome.members_signed_out} member(s) signed out.
          </div>
          <div>
            <Eyebrow>{'// DELETED COUNTS'}</Eyebrow>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: `3px solid ${BRAND.charcoal}`,
                background: BRAND.white,
              }}
            >
              <thead>
                <tr style={{ background: BRAND.pageBed, borderBottom: `3px solid ${BRAND.charcoal}` }}>
                  <th
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: 9,
                      color: BRAND.blue,
                      padding: '8px 12px',
                      textAlign: 'left',
                      letterSpacing: '0.04em',
                    }}
                  >
                    TABLE
                  </th>
                  <th
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: 9,
                      color: BRAND.blue,
                      padding: '8px 12px',
                      textAlign: 'right',
                      letterSpacing: '0.04em',
                    }}
                  >
                    ROWS
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(outcome.deleted).map(([table, count]) => (
                  <tr key={table} style={{ borderBottom: `1px solid ${BRAND.sky}` }}>
                    <td
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 13,
                        color: BRAND.charcoal,
                        padding: '6px 12px',
                      }}
                    >
                      {table}
                    </td>
                    <td
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 13,
                        color: BRAND.charcoal,
                        padding: '6px 12px',
                        textAlign: 'right',
                      }}
                    >
                      {count}
                    </td>
                  </tr>
                ))}
                {Object.keys(outcome.deleted).length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 13,
                        color: BRAND.charcoal,
                        padding: 12,
                        textAlign: 'center',
                      }}
                    >
                      No rows deleted.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {outcome.skipped.length > 0 ? (
            <div
              style={{
                border: `3px solid ${BRAND.amber}`,
                background: '#FEF3C7',
                color: '#92400E',
                padding: '8px 12px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
              }}
            >
              <strong>Skipped:</strong>
              <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
                {outcome.skipped.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div>
            <Button variant="primary" size="sm" onClick={reset}>
              Start new erasure
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
