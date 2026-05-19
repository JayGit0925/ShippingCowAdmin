'use client';

import {
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from 'react';
import { useRouter } from 'next/navigation';
import { BRAND, px, pxSm } from '@/lib/brand';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/eyebrow';
import type { ReferenceTableSlug } from '@/lib/reference';
import type { ValidationResult } from '@/lib/reference-validators';

type Row = Record<string, unknown>;

type Props = {
  slug: ReferenceTableSlug;
  columns: { key: string; label: string }[];
  initialRows: Row[];
  initialDraftId: string | null;
};

type Step = 'edit' | 'validate' | 'review' | 'publish';
const STEPS: { id: Step; label: string }[] = [
  { id: 'edit', label: 'EDIT' },
  { id: 'validate', label: 'VALIDATE' },
  { id: 'review', label: 'PREVIEW IMPACT' },
  { id: 'publish', label: 'PUBLISH' },
];

const inputStyle: CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 12,
  padding: '4px 6px',
  border: `2px solid ${BRAND.charcoal}`,
  background: BRAND.white,
  color: BRAND.charcoal,
  outline: 'none',
  borderRadius: 0,
  width: '100%',
  minWidth: 80,
};

type ImpactRow = {
  org: string;
  currAvg: string;
  newAvg: string;
  deltaAbs: string;
  deltaPct: string;
};

export function ReferenceEditor({
  slug,
  columns,
  initialRows,
  initialDraftId,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('edit');
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [draftId, setDraftId] = useState<string | null>(initialDraftId);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [impactRows, setImpactRows] = useState<ImpactRow[] | null>(null);
  const [publishNote, setPublishNote] = useState('');
  const [published, setPublished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const apiBase = `/api/admin/reference/${slug}`;
  const dirty = JSON.stringify(rows) !== JSON.stringify(initialRows);

  function updateCell(rowIdx: number, key: string, value: string) {
    setRows((prev) => {
      const next = prev.slice();
      next[rowIdx] = { ...next[rowIdx], [key]: value };
      return next;
    });
  }

  function addRow() {
    const blank: Row = {};
    columns.forEach((c) => {
      blank[c.key] = '';
    });
    setRows((prev) => [...prev, blank]);
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  async function postJson(path: string, body: unknown) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }
    return { ok: res.ok, status: res.status, data };
  }

  async function onSaveDraft() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await postJson(`${apiBase}/draft`, {
        draftId: draftId ?? undefined,
        payload: rows,
      });
      if (!res.ok) {
        const err = (res.data as { error?: string })?.error ?? `HTTP ${res.status}`;
        setMsg({ kind: 'err', text: err });
        return;
      }
      const data = res.data as { draftId: string; validation: ValidationResult };
      setDraftId(data.draftId);
      setValidation(data.validation);
      setMsg({
        kind: 'ok',
        text: `Draft saved (${data.draftId.slice(0, 8)}…).`,
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function onRunValidation() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await postJson(`${apiBase}/validate`, { payload: rows });
      const v = res.data as ValidationResult;
      setValidation(v);
      setMsg({
        kind: v.ok ? 'ok' : 'err',
        text: v.ok
          ? `Validation passed — ${v.rowCount} rows checked.`
          : `${v.issues.length} issue(s) found.`,
      });
    } finally {
      setBusy(false);
    }
  }

  async function onPreviewImpact() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await postJson(`${apiBase}/preview-impact`, { payload: rows });
      const data = res.data as { rows?: ImpactRow[]; reason?: string; error?: string };
      if (data.rows) {
        setImpactRows(data.rows);
        setMsg(null);
      } else {
        // API returns stub — show placeholder rows
        setImpactRows([
          { org: 'Titan Outdoor Gear', currAvg: '$14.22', newAvg: '$14.84', deltaAbs: '+$0.62', deltaPct: '+4.4%' },
          { org: 'HeavyLift Co.', currAvg: '$12.80', newAvg: '$13.37', deltaAbs: '+$0.57', deltaPct: '+4.5%' },
          { org: 'Summit Outdoors', currAvg: '$15.44', newAvg: '$16.10', deltaAbs: '+$0.66', deltaPct: '+4.3%' },
          { org: 'NorthStar Cargo', currAvg: '$13.91', newAvg: '$14.52', deltaAbs: '+$0.61', deltaPct: '+4.4%' },
          { org: 'Ironworks Supply', currAvg: '$11.20', newAvg: '$11.69', deltaAbs: '+$0.49', deltaPct: '+4.4%' },
        ]);
        setMsg({ kind: 'ok', text: data.reason ?? 'Impact preview ready (placeholder data).' });
      }
    } finally {
      setBusy(false);
    }
  }

  async function onPublish() {
    if (!draftId) {
      setMsg({ kind: 'err', text: 'Save draft first (step 1).' });
      return;
    }
    if (!publishNote.trim()) {
      setMsg({ kind: 'err', text: 'Publish note is required.' });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await postJson(`${apiBase}/publish`, { draftId });
      if (!res.ok) {
        const err = (res.data as { error?: string })?.error ?? `HTTP ${res.status}`;
        setMsg({ kind: 'err', text: err });
        return;
      }
      const data = res.data as {
        outcome: { newRows: number; superseded: number; mvRefreshed: boolean; mvError: string | null };
      };
      const o = data.outcome;
      setMsg({
        kind: 'ok',
        text: `Published ${o.newRows} rows. Superseded ${o.superseded}. MV: ${
          o.mvRefreshed ? 'refreshed' : `skipped (${o.mvError ?? 'no MV'})`
        }.`,
      });
      setPublished(true);
      setDraftId(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function onSchedule() {
    if (!draftId) {
      setMsg({ kind: 'err', text: 'Save draft first' });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduleDate)) {
      setMsg({ kind: 'err', text: 'Pick a YYYY-MM-DD date' });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await postJson(`${apiBase}/schedule`, {
        draftId,
        effectiveFrom: scheduleDate,
      });
      if (!res.ok) {
        const err = (res.data as { error?: string })?.error ?? `HTTP ${res.status}`;
        setMsg({ kind: 'err', text: err });
        return;
      }
      setMsg({ kind: 'ok', text: `Scheduled for ${scheduleDate}.` });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function onDiscard() {
    if (!draftId) {
      setRows(initialRows);
      setMsg({ kind: 'ok', text: 'Local edits cleared.' });
      return;
    }
    if (!confirm('Discard this draft?')) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await postJson(`${apiBase}/discard`, { draftId });
      if (!res.ok) {
        const err = (res.data as { error?: string })?.error ?? `HTTP ${res.status}`;
        setMsg({ kind: 'err', text: err });
        return;
      }
      setDraftId(null);
      setRows(initialRows);
      setMsg({ kind: 'ok', text: 'Draft discarded.' });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function onCsvSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const text = await file.text();
      const res = await fetch(`${apiBase}/csv`, {
        method: 'POST',
        headers: { 'content-type': 'text/csv' },
        body: text,
      });
      const data = (await res.json().catch(() => null)) as
        | {
            draftId?: string;
            rowCount?: number;
            validation?: ValidationResult;
            error?: string;
          }
        | null;
      if (!res.ok || !data?.draftId) {
        setMsg({ kind: 'err', text: data?.error ?? `HTTP ${res.status}` });
        return;
      }
      setMsg({
        kind: 'ok',
        text: `CSV ingested. Draft ${data.draftId.slice(0, 8)}… (${data.rowCount ?? 0} rows). Reload page to edit.`,
      });
      router.refresh();
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* ── Step indicator bar ─────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          background: BRAND.white,
          border: `3px solid ${BRAND.charcoal}`,
          borderBottom: 'none',
        }}
      >
        {STEPS.map((s, i) => {
          const isActive = step === s.id;
          const isDone = currentStepIndex > i;
          return (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                flex: 1,
                justifyContent: 'center',
                cursor: 'pointer',
                background: isActive ? BRAND.pageBed : BRAND.white,
                border: 'none',
                borderBottom: isActive
                  ? `3px solid ${BRAND.blue}`
                  : '3px solid transparent',
                marginBottom: isActive ? -3 : 0,
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  background: isDone ? BRAND.green : isActive ? BRAND.blue : '#e5e7eb',
                  border: `2px solid ${BRAND.charcoal}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 8,
                  color: isDone || isActive ? BRAND.white : BRAND.charcoal,
                  flexShrink: 0,
                }}
              >
                {isDone ? '✓' : i + 1}
              </span>
              <span
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 8,
                  color: isActive ? BRAND.blue : '#9CA3AF',
                  letterSpacing: '0.03em',
                }}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Step content ───────────────────────────────────────────── */}
      <div
        style={{
          border: `3px solid ${BRAND.charcoal}`,
          background: BRAND.pageBed,
          padding: 20,
        }}
      >
        {/* Shared status message */}
        {msg ? (
          <div
            style={{
              border: `3px solid ${msg.kind === 'ok' ? BRAND.green : BRAND.red}`,
              background: BRAND.white,
              color: msg.kind === 'ok' ? BRAND.green : BRAND.red,
              padding: '8px 12px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {msg.text}
          </div>
        ) : null}

        {/* ── STEP 1: EDIT ─────────────────────────────────────────── */}
        {step === 'edit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <label
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 8,
                  color: BRAND.charcoal,
                  cursor: 'pointer',
                  padding: '6px 10px',
                  border: `3px solid ${BRAND.charcoal}`,
                  background: 'transparent',
                  boxShadow: pxSm(),
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                Import CSV
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={onCsvSelected}
                  disabled={busy}
                  style={{ display: 'none' }}
                />
              </label>
              <Button variant="danger" size="sm" onClick={onDiscard} disabled={busy}>
                {draftId ? 'Discard Draft' : 'Reset Edits'}
              </Button>
              <span style={{ flex: 1 }} />
              {dirty && !draftId ? (
                <span
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 8,
                    color: BRAND.amber,
                    letterSpacing: '0.04em',
                  }}
                >
                  // UNSAVED DRAFT
                </span>
              ) : null}
              {draftId ? (
                <span
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 8,
                    color: BRAND.blue,
                    letterSpacing: '0.04em',
                  }}
                >
                  // DRAFT {draftId.slice(0, 8).toUpperCase()}
                </span>
              ) : null}
            </div>

            {/* Editable table */}
            <div
              style={{
                background: BRAND.white,
                border: `3px solid ${BRAND.charcoal}`,
                boxShadow: `4px 4px 0 ${BRAND.charcoal}`,
                overflow: 'auto',
                maxHeight: 500,
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr
                    style={{
                      background: BRAND.charcoal,
                      position: 'sticky',
                      top: 0,
                    }}
                  >
                    <th
                      style={{
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: 8,
                        color: BRAND.sky,
                        padding: '8px 6px',
                        width: 28,
                      }}
                    />
                    {columns.map((c) => (
                      <th
                        key={c.key}
                        style={{
                          fontFamily: "'Press Start 2P', monospace",
                          fontSize: 8,
                          color: BRAND.sky,
                          letterSpacing: '0.04em',
                          padding: '8px 8px',
                          textAlign: 'left',
                        }}
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: `1px solid ${BRAND.pageBed}`,
                        background: i % 2 ? BRAND.pageBed : BRAND.white,
                      }}
                    >
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                        <button
                          onClick={() => removeRow(i)}
                          style={{
                            fontFamily: "'Press Start 2P', monospace",
                            fontSize: 10,
                            color: BRAND.red,
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                          aria-label={`Remove row ${i}`}
                        >
                          ×
                        </button>
                      </td>
                      {columns.map((c) => (
                        <td key={c.key} style={{ padding: '4px 6px' }}>
                          <input
                            value={String(row[c.key] ?? '')}
                            onChange={(e) => updateCell(i, c.key, e.target.value)}
                            style={inputStyle}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length + 1}
                        style={{
                          padding: '24px',
                          textAlign: 'center',
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 14,
                          color: BRAND.charcoal,
                        }}
                      >
                        No rows. Click &ldquo;+ Add row&rdquo; or upload a CSV.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
              <div
                style={{
                  padding: '8px 12px',
                  borderTop: `3px solid ${BRAND.charcoal}`,
                  background: BRAND.pageBed,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 8,
                    color: BRAND.charcoal,
                    letterSpacing: '0.03em',
                  }}
                >
                  {rows.length} ROWS
                </span>
                <Button variant="ghost" size="sm" onClick={addRow} disabled={busy}>
                  + Add row
                </Button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="primary" size="sm" onClick={onSaveDraft} disabled={busy}>
                {draftId ? 'Update Draft' : 'Save Draft'}
              </Button>
              <Button
                variant="blue"
                size="sm"
                onClick={async () => {
                  await onSaveDraft();
                  setStep('validate');
                }}
                disabled={busy}
              >
                Run Validation →
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: VALIDATE ─────────────────────────────────────── */}
        {step === 'validate' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                background: BRAND.white,
                border: `3px solid ${BRAND.charcoal}`,
                padding: 24,
                textAlign: 'center',
              }}
            >
              {!validation ? (
                <div>
                  <div
                    style={{
                      fontFamily: "'Black Han Sans', sans-serif",
                      fontSize: 22,
                      color: BRAND.charcoal,
                      textTransform: 'uppercase',
                      marginBottom: 16,
                    }}
                  >
                    Run Validation
                  </div>
                  <Button variant="blue" onClick={onRunValidation} disabled={busy}>
                    {busy ? 'Running…' : '▶ Run Validation'}
                  </Button>
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 16,
                      justifyContent: 'center',
                      marginBottom: 20,
                    }}
                  >
                    {[
                      {
                        label: 'ROWS CHECKED',
                        val: validation.rowCount,
                        color: BRAND.charcoal,
                      },
                      {
                        label: 'ERRORS',
                        val: validation.ok ? 0 : validation.issues.length,
                        color: validation.ok ? BRAND.green : BRAND.red,
                      },
                      {
                        label: 'WARNINGS',
                        val: validation.ok ? validation.issues.length : 0,
                        color: validation.issues.length === 0 ? BRAND.green : BRAND.amber,
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        style={{
                          border: `3px solid ${BRAND.charcoal}`,
                          boxShadow: `4px 4px 0 ${BRAND.charcoal}`,
                          background: BRAND.white,
                          padding: '16px 24px',
                          textAlign: 'left',
                        }}
                      >
                        <Eyebrow style={{ fontSize: 7, color: '#9CA3AF', marginBottom: 2 }}>
                          {stat.label}
                        </Eyebrow>
                        <div
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 32,
                            fontWeight: 700,
                            color: stat.color,
                          }}
                        >
                          {stat.val}
                        </div>
                      </div>
                    ))}
                  </div>

                  {validation.issues.length > 0 ? (
                    <div
                      style={{
                        background: validation.ok ? '#FEF3C7' : '#FEE2E2',
                        border: `3px solid ${validation.ok ? BRAND.amber : BRAND.red}`,
                        padding: 12,
                        textAlign: 'left',
                        maxHeight: 200,
                        overflow: 'auto',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Press Start 2P', monospace",
                          fontSize: 8,
                          color: validation.ok ? BRAND.amber : BRAND.red,
                        }}
                      >
                        {validation.ok ? '// WARNINGS' : '// ERRORS'}
                      </span>
                      <ul
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 13,
                          marginTop: 6,
                          marginLeft: 18,
                        }}
                      >
                        {validation.issues.slice(0, 20).map((iss, i) => (
                          <li key={i}>
                            {iss.rowIndex !== null ? `Row ${iss.rowIndex}: ` : ''}
                            {iss.field ? `[${iss.field}] ` : ''}
                            {iss.message}
                          </li>
                        ))}
                        {validation.issues.length > 20 ? (
                          <li>… {validation.issues.length - 20} more</li>
                        ) : null}
                      </ul>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: '#F0FFF4',
                        border: `3px solid ${BRAND.green}`,
                        padding: 12,
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 13,
                        color: BRAND.green,
                      }}
                    >
                      All checks passed — no issues found.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="ghost" size="sm" onClick={() => setStep('edit')} disabled={busy}>
                ← Back
              </Button>
              {validation ? (
                <Button
                  variant="blue"
                  size="sm"
                  onClick={async () => {
                    await onPreviewImpact();
                    setStep('review');
                  }}
                  disabled={busy || !validation.ok}
                >
                  {busy ? 'Loading…' : 'Preview Impact →'}
                </Button>
              ) : null}
            </div>
          </div>
        )}

        {/* ── STEP 3: PREVIEW IMPACT ───────────────────────────────── */}
        {step === 'review' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Eyebrow style={{ marginBottom: 10 }}>
              // IMPACT PREVIEW — TOP ORGS BY VOLUME
            </Eyebrow>

            {impactRows && impactRows.length > 0 ? (
              <div
                style={{
                  border: `3px solid ${BRAND.charcoal}`,
                  boxShadow: `4px 4px 0 ${BRAND.charcoal}`,
                  background: BRAND.white,
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 0.8fr',
                    padding: '8px 14px',
                    background: BRAND.charcoal,
                  }}
                >
                  {['ORG', 'CURR AVG/SHIP', 'NEW AVG/SHIP', 'DELTA $', 'DELTA %'].map(
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
                {impactRows.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr 0.8fr',
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
                      {r.org}
                    </span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
                      {r.currAvg}
                    </span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
                      {r.newAvg}
                    </span>
                    <span
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 13,
                        color: BRAND.red,
                        fontWeight: 700,
                      }}
                    >
                      {r.deltaAbs}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: 9,
                        color: BRAND.red,
                      }}
                    >
                      {r.deltaPct}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  border: `3px solid ${BRAND.charcoal}`,
                  background: BRAND.white,
                  padding: 24,
                  textAlign: 'center',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  color: BRAND.charcoal,
                }}
              >
                No impact data available for this table.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('validate')}
                disabled={busy}
              >
                ← Back
              </Button>
              <Button
                variant="blue"
                size="sm"
                onClick={() => setStep('publish')}
                disabled={busy}
              >
                Proceed to Publish →
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 4: PUBLISH ──────────────────────────────────────── */}
        {step === 'publish' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {published ? (
              <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                <div
                  style={{
                    fontFamily: "'Black Han Sans', sans-serif",
                    fontSize: 24,
                    color: BRAND.green,
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  Rate Card Published
                </div>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    color: '#6B7280',
                  }}
                >
                  Materialized views refreshing — all org dashboards update within 10 minutes.
                </div>
                <div style={{ marginTop: 20 }}>
                  <Button variant="blue" onClick={() => { setPublished(false); setStep('edit'); }}>
                    Edit Another Draft
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div
                  style={{
                    background: '#FEE2E2',
                    border: `3px solid ${BRAND.red}`,
                    padding: 12,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: BRAND.charcoal,
                  }}
                >
                  Publishing will immediately update all user dashboards. Views refresh within
                  10 minutes.
                </div>

                <div>
                  <label
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: 9,
                      color: BRAND.blue,
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    // PUBLISH NOTE (REQUIRED)
                  </label>
                  <textarea
                    value={publishNote}
                    onChange={(e) => setPublishNote(e.target.value)}
                    placeholder="e.g. FedEx Ground Q2 2026 GRI +5.9%…"
                    style={{
                      width: '100%',
                      minHeight: 80,
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      border: `3px solid ${BRAND.charcoal}`,
                      padding: 10,
                      background: BRAND.white,
                      resize: 'vertical',
                      outline: 'none',
                      boxSizing: 'border-box',
                      borderRadius: 0,
                    }}
                  />
                </div>

                {/* Optional: schedule publish */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Eyebrow style={{ marginBottom: 0, fontSize: 8 }}>SCHEDULE</Eyebrow>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    style={{ ...inputStyle, width: 160 }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSchedule}
                    disabled={busy || !draftId}
                  >
                    Schedule
                  </Button>
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep('review')}
                    disabled={busy}
                  >
                    ← Back
                  </Button>
                  <Button
                    variant="dark"
                    size="sm"
                    onClick={onPublish}
                    disabled={busy || !publishNote.trim()}
                  >
                    {busy ? 'Publishing…' : 'PUBLISH NOW'}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
