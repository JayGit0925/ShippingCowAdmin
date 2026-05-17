'use client';

// DIM Weight Savings Calculator — interactive client leaf component.
// Source: homepage/shipping cow home page(1).html lines 474–562 (markup) + 842–897 (logic).
// Math is delegated to lib/dim-calc.ts (pure; reused by /quote in WS F).
// This file: UI concerns only — state, formatting helpers, copy-link.

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { BRAND, FONT, px } from '@/lib/brand';
import { recalcDim } from '@/lib/dim-calc';
import { fmt1, fmtDollar } from '@/lib/fmt';

// ─── Inline styles ────────────────────────────────────────────────────────────

const S = {
  dimCalcGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.4fr',
    gap: '1.5rem',
  } satisfies CSSProperties,

  inputsCol: {} satisfies CSSProperties,

  inputsH3: {
    fontFamily: FONT.display,
    textTransform: 'uppercase' as const,
    marginBottom: '1.2rem',
    fontSize: '1rem',
    fontWeight: 400,
  } satisfies CSSProperties,

  dimField: {
    marginBottom: '0.9rem',
  } satisfies CSSProperties,

  dimLabel: {
    display: 'block',
    fontFamily: FONT.display,
    fontSize: '0.82rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: BRAND.blue,
    marginBottom: '0.35rem',
    fontWeight: 400,
  } satisfies CSSProperties,

  dimInput: {
    width: '100%',
    padding: '0.7rem 0.9rem',
    fontFamily: FONT.body,
    fontSize: '1rem',
    border: `3px solid ${BRAND.charcoal}`,
    background: BRAND.white,
    outline: 'none',
    boxSizing: 'border-box' as const,
    borderRadius: 0,
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
  } satisfies CSSProperties,

  zoneBadge: {
    fontFamily: FONT.pixel,
    fontSize: '0.58rem',
    color: BRAND.blue,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    marginBottom: '0.5rem',
    padding: '0.6rem 0 0.5rem',
    borderTop: '2px dashed rgba(0,0,0,.1)',
    marginTop: '0.9rem',
  } satisfies CSSProperties,

  zipRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
  } satisfies CSSProperties,

  cubicNote: {
    padding: '0.7rem 0.9rem',
    background: 'rgba(0,82,201,.08)',
    border: '1px solid rgba(0,82,201,.2)',
    fontSize: '0.78rem',
    color: '#3a4454', // prototype verbatim — muted dark text on light blue tint
    marginTop: '0.5rem',
  } satisfies CSSProperties,

  // ── Bar chart ─────────────────────────────────────────────────────────────

  barChart: {
    background: BRAND.charcoal,
    padding: '1.2rem',
    border: `4px solid ${BRAND.charcoal}`,
    boxShadow: px(),
    marginBottom: '1.2rem',
  } satisfies CSSProperties,

  barChartTitle: {
    fontFamily: FONT.pixel,
    fontSize: '0.6rem',
    color: 'rgba(255,255,255,.5)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    marginBottom: '1rem',
  } satisfies CSSProperties,

  bars: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-end',
  } satisfies CSSProperties,

  barCol: {
    flex: 1,
  } satisfies CSSProperties,

  barColLabel: {
    fontFamily: FONT.pixel,
    fontSize: '0.55rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
    marginBottom: '0.4rem',
  } satisfies CSSProperties,

  barColTrack: {
    position: 'relative' as const,
    height: 100,
    background: 'rgba(255,255,255,.08)',
    border: '2px solid rgba(255,255,255,.12)',
  } satisfies CSSProperties,

  barColFill: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    transition: 'height .35s ease',
  } satisfies CSSProperties,

  barColVal: {
    marginTop: '0.4rem',
    textAlign: 'center' as const,
    fontSize: '0.8rem',
    fontWeight: 700,
  } satisfies CSSProperties,

  barColBill: {
    textAlign: 'center' as const,
    fontSize: '0.72rem',
    color: 'rgba(255,255,255,.6)',
  } satisfies CSSProperties,

  barBestLabel: {
    fontFamily: FONT.pixel,
    fontSize: '0.5rem',
    // verbatim — prototype 3-divisor chart
    background: '#059669',
    color: '#fff',
    padding: '1px 4px',
    marginLeft: 4,
  } satisfies CSSProperties,

  // ── Savings callout ────────────────────────────────────────────────────────

  savingsCallout: {
    background: BRAND.yellow,
    border: `4px solid ${BRAND.charcoal}`,
    padding: '1.1rem',
    boxShadow: px(),
    marginBottom: '1.2rem',
  } satisfies CSSProperties,

  savingsCalloutGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  } satisfies CSSProperties,

  scLabel: {
    fontFamily: FONT.pixel,
    fontSize: '0.58rem',
    textTransform: 'uppercase' as const,
    marginBottom: '0.3rem',
  } satisfies CSSProperties,

  scValue: {
    fontFamily: FONT.display,
    fontSize: '1.8rem',
    fontWeight: 900,
    color: BRAND.charcoal,
    lineHeight: 1.1,
  } satisfies CSSProperties,

  scSub: {
    fontSize: '0.78rem',
    color: '#3a4454', // prototype verbatim — muted dark text
  } satisfies CSSProperties,

  // ── Detail table ────────────────────────────────────────────────────────────

  dimDetail: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.5rem',
    marginBottom: '1.2rem',
  } satisfies CSSProperties,

  dimDetailCol: {
    padding: '0.75rem',
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(),
  } satisfies CSSProperties,

  // verbatim — prototype 3-divisor chart "best" column
  dimDetailColBest: {
    padding: '0.75rem',
    border: '3px solid #059669',
    background: '#f0fdf4',
    boxShadow: '4px 4px 0 #059669',
  } satisfies CSSProperties,

  detailCarrier: {
    fontFamily: FONT.pixel,
    fontSize: '0.5rem',
    textTransform: 'uppercase' as const,
    marginBottom: '0.35rem',
  } satisfies CSSProperties,

  detailDivisor: {
    fontSize: '0.68rem',
    color: '#6b7280', // prototype verbatim — gray-500
    marginBottom: '0.2rem',
  } satisfies CSSProperties,

  detailVal: {
    fontSize: '0.82rem',
    fontWeight: 700,
  } satisfies CSSProperties,

  // ── CTAs ──────────────────────────────────────────────────────────────────

  dimCtas: {
    display: 'flex',
    gap: '0.65rem',
    flexWrap: 'wrap' as const,
  } satisfies CSSProperties,

  dimCtaBtn: {
    flex: '1 1 auto',
    textAlign: 'center' as const,
    minWidth: 180,
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0.75rem 1.2rem',
    fontFamily: FONT.display,
    fontSize: '0.95rem',
    textTransform: 'uppercase' as const,
    border: `3px solid ${BRAND.charcoal}`,
    background: BRAND.blue,
    color: BRAND.white,
    boxShadow: px(),
    textDecoration: 'none',
    cursor: 'pointer',
  } satisfies CSSProperties,

  dimFootnote: {
    fontSize: '0.7rem',
    color: '#6b7280', // prototype verbatim — gray-500
    marginTop: '0.7rem',
  } satisfies CSSProperties,
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function DimCalculator() {
  // 5 numeric inputs (default to prototype's seed values: 24×18×16, 55 lb, 100 vol)
  const [l, setL] = useState(24);
  const [w, setW] = useState(18);
  const [h, setH] = useState(16);
  const [wt, setWt] = useState(55);
  const [vol, setVol] = useState(100);
  // 2 ZIP fields — informational only; no zone lookup in this component
  const [originZip, setOriginZip] = useState('');
  const [destZip, setDestZip] = useState('');
  // Copy-link confirm state
  const [copied, setCopied] = useState(false);

  // Memoised recalc — only re-runs when numeric inputs change
  const result = useMemo(
    () => recalcDim({ l, w, h, wt, vol }),
    [l, w, h, wt, vol],
  );

  // Bar chart: heights as percentage of the tallest DIM weight
  const maxDim = Math.max(result.dim139, result.dim166, result.dim225, 0.1);
  const bar139h = result.ready ? Math.min((result.dim139 / maxDim) * 100, 100) + '%' : '100%';
  const bar166h = result.ready ? Math.min((result.dim166 / maxDim) * 100, 100) + '%' : '80%';
  const bar225h = result.ready ? Math.min((result.dim225 / maxDim) * 100, 100) + '%' : '60%';

  // DRY: single source for bar chart + detail table columns (I1)
  // verbatim — prototype 3-divisor chart colours
  const BAR_COLS = [
    { id: '139', label: 'UPS / FedEx (÷139)', color: '#ef4444', dim: result.dim139, bill: result.bill139, height: bar139h, best: false },
    { id: '166', label: 'Typical 3PL (÷166)', color: '#f97316', dim: result.dim166, bill: result.bill166, height: bar166h, best: false },
    { id: '225', label: 'ShippingCow (÷225)', color: '#059669', dim: result.dim225, bill: result.bill225, height: bar225h, best: true },
  ] as const;

  // Copy-link: track timer ref to prevent setState on unmounted component (C2)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handleCopyLink = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, []);

  const numInput = (
    val: number,
    setter: (n: number) => void,
    props: React.InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <input
      {...props}
      type="number"
      style={S.dimInput}
      value={val === 0 ? '' : val}
      onChange={(e) => setter(Math.max(0, parseFloat(e.target.value) || 0))}
    />
  );

  return (
    <div>
      <div style={S.dimCalcGrid}>
        {/* ── Inputs column ── */}
        <div style={S.inputsCol}>
          <h3 style={S.inputsH3}>Your Package Dimensions</h3>

          <div style={S.dimField}>
            <label style={S.dimLabel} htmlFor="dc-l">Length (inches)</label>
            {numInput(l, setL, { id: 'dc-l', min: 1, max: 120 })}
          </div>
          <div style={S.dimField}>
            <label style={S.dimLabel} htmlFor="dc-w">Width (inches)</label>
            {numInput(w, setW, { id: 'dc-w', min: 1, max: 120 })}
          </div>
          <div style={S.dimField}>
            <label style={S.dimLabel} htmlFor="dc-h">Height (inches)</label>
            {numInput(h, setH, { id: 'dc-h', min: 1, max: 120 })}
          </div>
          <div style={S.dimField}>
            <label style={S.dimLabel} htmlFor="dc-wt">Actual Weight (lbs)</label>
            {numInput(wt, setWt, { id: 'dc-wt', min: 1, max: 500 })}
          </div>
          <div style={S.dimField}>
            <label style={S.dimLabel} htmlFor="dc-vol">Monthly Shipment Volume</label>
            {numInput(vol, setVol, { id: 'dc-vol', min: 1 })}
          </div>

          {/* Zone badge + ZIP fields — informational only, no zone lookup */}
          <div style={S.zoneBadge}>📍 Zone-Based Estimate (Coming Soon)</div>
          <small style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', marginBottom: '0.4rem' }}>
            Enter ZIPs for zone-based estimates once enabled in your account.
          </small>
          <div style={S.zipRow}>
            <div style={S.dimField}>
              <label style={S.dimLabel} htmlFor="dc-ozip">Origin ZIP</label>
              <input
                id="dc-ozip"
                type="text"
                maxLength={5}
                placeholder="Your warehouse ZIP"
                style={S.dimInput}
                value={originZip}
                onChange={(e) => setOriginZip(e.target.value)}
              />
            </div>
            <div style={S.dimField}>
              <label style={S.dimLabel} htmlFor="dc-dzip">Dest. ZIP</label>
              <input
                id="dc-dzip"
                type="text"
                maxLength={5}
                placeholder="Customer ZIP"
                style={S.dimInput}
                value={destZip}
                onChange={(e) => setDestZip(e.target.value)}
              />
            </div>
          </div>

          <div style={S.cubicNote}>
            <strong>Cubic inches:</strong> {(l * w * h).toLocaleString()} in³
          </div>
        </div>

        {/* ── Results column ── */}
        <div>
          {/* Bar chart */}
          <div
            style={S.barChart}
            role="img"
            aria-label={result.ready
              ? `DIM weight comparison. UPS/FedEx ÷139: billable ${fmt1(result.bill139)} lbs. Typical 3PL ÷166: billable ${fmt1(result.bill166)} lbs. ShippingCow ÷225: billable ${fmt1(result.bill225)} lbs.`
              : 'DIM weight comparison chart, awaiting input'
            }
          >
            <div style={S.barChartTitle}>DIM Weight Comparison</div>
            <div style={S.bars}>
              {BAR_COLS.map((col) => (
                <div key={col.id} style={S.barCol}>
                  <div style={{ ...S.barColLabel, color: col.color }}>
                    {col.label}
                    {col.best && <span style={S.barBestLabel}>BEST</span>}
                  </div>
                  <div style={S.barColTrack}>
                    <div
                      style={{
                        ...S.barColFill,
                        background: col.color,
                        height: col.height,
                      }}
                    />
                  </div>
                  <div style={{ ...S.barColVal, color: col.color }}>
                    {result.ready ? fmt1(col.dim) + ' lbs DIM' : '—'}
                  </div>
                  <div style={S.barColBill}>
                    Billable:{' '}
                    {result.ready ? fmt1(col.bill) + ' lbs' : '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Savings callout */}
          <div style={S.savingsCallout}>
            <div style={S.savingsCalloutGrid}>
              <div>
                <div style={S.scLabel}>Billable lbs saved vs UPS/FedEx</div>
                <div style={S.scValue}>
                  {result.ready ? fmt1(result.lbsSaved) + ' lbs' : '—'}
                </div>
                <div style={S.scSub}>
                  {result.ready ? fmt1(result.pctSaved) + '% reduction' : '—'}
                </div>
              </div>
              <div>
                <div style={S.scLabel}>Estimated annual savings</div>
                <div style={S.scValue}>
                  {result.ready ? fmtDollar(result.annualSavings) : '—'}
                </div>
                <div style={S.scSub}>
                  {result.ready
                    ? fmtDollar(result.savingsPerPkg) +
                      ' per pkg × ' +
                      vol.toLocaleString() +
                      ' mo × 12'
                    : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Detail table */}
          <div style={S.dimDetail}>
            {BAR_COLS.map((col) => (
              <div key={col.id} style={col.best ? S.dimDetailColBest : S.dimDetailCol}>
                {/* verbatim — prototype 3-divisor chart */}
                <div style={{ ...S.detailCarrier, color: col.color }}>
                  {col.id === '139' ? 'UPS / FedEx' : col.id === '166' ? 'Typical 3PL' : 'ShippingCow'}
                </div>
                <div style={S.detailDivisor}>÷{col.id} divisor</div>
                <div style={S.detailVal}>
                  DIM: {result.ready ? fmt1(col.dim) + ' lbs' : '—'}
                </div>
                <div style={{ ...S.detailVal, ...(col.best ? { color: col.color } : {}) }}>
                  Bill: {result.ready ? fmt1(col.bill) + ' lbs' : '—'}
                </div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div style={S.dimCtas}>
            <a href="#inquiry" style={S.dimCtaBtn}>
              These are your numbers. Get the full audit →
            </a>
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                padding: '0.75rem 1.2rem',
                fontFamily: FONT.display,
                fontSize: '0.95rem',
                textTransform: 'uppercase' as const,
                border: `3px solid ${BRAND.charcoal}`,
                // verbatim — prototype 3-divisor chart copied state uses #059669
                background: copied ? '#059669' : BRAND.charcoal,
                color: BRAND.white,
                boxShadow: px(),
                cursor: 'pointer',
                flex: '0 0 auto',
                transition: 'background .15s',
              }}
            >
              {copied ? '✓ Copied!' : 'Copy link'}
            </button>
          </div>

          <p style={S.dimFootnote}>
            * Savings estimate uses $0.45/lb blended rate. Actual savings vary by carrier, zone, and negotiated rates.
          </p>
        </div>
      </div>
    </div>
  );
}
