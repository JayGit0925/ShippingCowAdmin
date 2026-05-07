'use client';

import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from 'react';
import { useRouter } from 'next/navigation';
import { BRAND } from '@/lib/brand';
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

export function ReferenceEditor({
  slug,
  columns,
  initialRows,
  initialDraftId,
}: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [draftId, setDraftId] = useState<string | null>(initialDraftId);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const apiBase = `/api/admin/reference/${slug}`;

  const dirty = useMemo(() => {
    return JSON.stringify(rows) !== JSON.stringify(initialRows);
  }, [rows, initialRows]);

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

  async function onValidate() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await postJson(`${apiBase}/validate`, { payload: rows });
      const v = res.data as ValidationResult;
      setValidation(v);
      setMsg({
        kind: v.ok ? 'ok' : 'err',
        text: v.ok
          ? `Validation passed. ${v.rowCount} rows.`
          : `${v.issues.length} issue(s) found.`,
      });
    } finally {
      setBusy(false);
    }
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
        text: `Draft saved (id ${data.draftId.slice(0, 8)}…). Validation: ${
          data.validation.ok ? 'OK' : `${data.validation.issues.length} issue(s)`
        }.`,
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function onPublish() {
    if (!draftId) {
      setMsg({ kind: 'err', text: 'Save draft first' });
      return;
    }
    if (!confirm('Publish this draft? This supersedes prior published rows.')) return;
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
        text: `Published ${o.newRows} rows. Superseded ${o.superseded}. MV refresh: ${
          o.mvRefreshed ? 'OK' : `skipped (${o.mvError ?? 'no MV'})`
        }.`,
      });
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

  async function onPreviewImpact() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await postJson(`${apiBase}/preview-impact`, { payload: rows });
      const data = res.data as { reason?: string; error?: string };
      setMsg({
        kind: 'err',
        text: data.reason ?? data.error ?? `HTTP ${res.status}`,
      });
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
        text: `CSV ingested. Draft ${data.draftId.slice(0, 8)}… created with ${data.rowCount ?? 0} rows. Reload page to edit.`,
      });
      router.refresh();
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <Button variant="ghost" size="sm" onClick={onValidate} disabled={busy}>
          Validate
        </Button>
        <Button variant="primary" size="sm" onClick={onSaveDraft} disabled={busy}>
          {draftId ? 'Update draft' : 'Save draft'}
        </Button>
        <Button variant="blue" size="sm" onClick={onPublish} disabled={busy || !draftId}>
          Publish
        </Button>
        <Button variant="ghost" size="sm" onClick={onPreviewImpact} disabled={busy}>
          Preview impact
        </Button>
        <Button variant="danger" size="sm" onClick={onDiscard} disabled={busy}>
          {draftId ? 'Discard draft' : 'Reset edits'}
        </Button>
        <span style={{ flex: 1 }} />
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onCsvSelected}
          disabled={busy}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: BRAND.charcoal,
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Eyebrow style={{ marginBottom: 0 }}>SCHEDULE</Eyebrow>
        <input
          type="date"
          value={scheduleDate}
          onChange={(e) => setScheduleDate(e.target.value)}
          style={{ ...inputStyle, width: 160 }}
        />
        <Button variant="ghost" size="sm" onClick={onSchedule} disabled={busy || !draftId}>
          Schedule
        </Button>
        {dirty && !draftId ? (
          <span
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 8,
              color: BRAND.amber,
              letterSpacing: '0.04em',
            }}
          >
            UNSAVED EDITS
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
            DRAFT {draftId.slice(0, 8).toUpperCase()}
          </span>
        ) : null}
      </div>

      {msg ? (
        <div
          style={{
            border: `3px solid ${msg.kind === 'ok' ? BRAND.green : BRAND.red}`,
            background: BRAND.white,
            color: msg.kind === 'ok' ? BRAND.green : BRAND.red,
            padding: '8px 12px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
          }}
        >
          {msg.text}
        </div>
      ) : null}

      {validation && validation.issues.length > 0 ? (
        <div
          style={{
            border: `3px solid ${BRAND.red}`,
            background: BRAND.white,
            padding: '8px 12px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: BRAND.charcoal,
            maxHeight: 200,
            overflow: 'auto',
          }}
        >
          <strong style={{ color: BRAND.red }}>Validation issues:</strong>
          <ul style={{ margin: '6px 0 0 18px' }}>
            {validation.issues.slice(0, 50).map((iss, i) => (
              <li key={i}>
                {iss.rowIndex !== null ? `Row ${iss.rowIndex}: ` : ''}
                {iss.field ? `[${iss.field}] ` : ''}
                {iss.message}
              </li>
            ))}
            {validation.issues.length > 50 ? (
              <li>… {validation.issues.length - 50} more</li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <div
        style={{
          background: BRAND.white,
          border: `3px solid ${BRAND.charcoal}`,
          boxShadow: `4px 4px 0 ${BRAND.charcoal}`,
          overflow: 'auto',
          maxHeight: 600,
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                background: BRAND.pageBed,
                borderBottom: `3px solid ${BRAND.charcoal}`,
                position: 'sticky',
                top: 0,
              }}
            >
              <th
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 8,
                  color: BRAND.charcoal,
                  padding: '8px 6px',
                  width: 28,
                }}
              />
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 9,
                    color: BRAND.blue,
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
                  borderBottom: `1px solid ${BRAND.sky}`,
                  background: i % 2 ? '#FAFBFF' : BRAND.white,
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
                  No rows. Click &ldquo;Add row&rdquo; or upload a CSV.
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
    </div>
  );
}
