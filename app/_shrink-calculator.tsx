'use client';

// Zero Shrinkage Calculator — interactive client leaf component.
// Source: homepage/shipping cow home page(1).html lines 596-667 (markup) + 902-943 (logic).
// Math is delegated to lib/shrink-calc.ts (pure).
// This file: UI concerns only — state, formatting helpers.

import { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { BRAND, FONT } from '@/lib/brand';
import { recalcShrink } from '@/lib/shrink-calc';
import { fmtInt, fmtDollar2 } from '@/lib/fmt';

// ─── Inline styles ────────────────────────────────────────────────────────────

const S = {
  // === Shrink inputs grid ===
  // Verbatim: prototype .shrink-inputs
  shrinkInputs: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    background: BRAND.white,
    border: `4px solid ${BRAND.charcoal}`,
    padding: '2rem',
    boxShadow: `6px 6px 0 ${BRAND.charcoal}`,
    marginBottom: '1.5rem',
  } satisfies CSSProperties,

  inputGroup: {
    marginBottom: '1.3rem',
  } satisfies CSSProperties,

  shrinkLabel: {
    display: 'block',
    fontFamily: FONT.display,
    fontSize: '0.92rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '0.5rem',
    color: BRAND.blue,
    fontWeight: 400,
  } satisfies CSSProperties,

  shrinkBadge: {
    display: 'inline-block',
    padding: '0.15rem 0.55rem',
    background: BRAND.yellow,
    border: `2px solid ${BRAND.charcoal}`,
    marginLeft: '0.4rem',
    fontFamily: FONT.body,
    fontSize: '0.88rem',
    fontWeight: 700,
  } satisfies CSSProperties,

  shrinkInput: {
    width: '100%',
    padding: '0.8rem 1rem',
    fontSize: '1.1rem',
    fontWeight: 500,
    border: `3px solid ${BRAND.charcoal}`,
    background: '#F4F7FF', // verbatim — prototype var(--bg-light) = pageBed
    outline: 'none',
    boxSizing: 'border-box' as const,
    borderRadius: 0,
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    fontFamily: FONT.body,
  } satisfies CSSProperties,

  shrinkRange: {
    width: '100%',
    height: 16,
    background: '#B0C8F0', // verbatim — prototype var(--blue-light) = BRAND.sky
    border: `3px solid ${BRAND.charcoal}`,
    outline: 'none',
    margin: '0.5rem 0',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    cursor: 'pointer',
  } satisfies CSSProperties,

  shrinkScale: {
    display: 'flex',
    justifyContent: 'space-between',
    fontFamily: FONT.pixel,
    fontSize: '0.62rem',
    color: '#555', // verbatim — prototype
  } satisfies CSSProperties,

  cliffWarn: {
    marginTop: '0.6rem',
    padding: '0.5rem 0.75rem',
    background: '#FEF3C7', // verbatim — prototype .cliff-warn
    border: '2px solid #F59E0B', // verbatim
    fontSize: '0.78rem',
    color: '#92400E', // verbatim
    fontFamily: FONT.body,
  } satisfies CSSProperties,

  // === Results panels ===
  shrinkResults: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
  } satisfies CSSProperties,

  // Dark panel
  shrinkPanelDark: {
    padding: '1.8rem',
    border: `3px solid ${BRAND.charcoal}`,
    background: BRAND.charcoal,
    color: BRAND.white,
  } satisfies CSSProperties,

  // Blue panel
  shrinkPanelBlue: {
    padding: '1.8rem',
    border: `3px solid ${BRAND.charcoal}`,
    background: '#0052C9', // verbatim — prototype var(--blue)
    color: BRAND.white,
  } satisfies CSSProperties,

  panelH4: {
    fontFamily: FONT.display,
    textTransform: 'uppercase' as const,
    color: BRAND.yellow,
    marginBottom: '1rem',
    fontSize: '1.05rem',
    letterSpacing: '0.05em',
    fontWeight: 400,
  } satisfies CSSProperties,

  panelCarrierNote: {
    fontSize: '0.75rem',
    color: '#B0C8F0', // verbatim — prototype
    marginBottom: '1rem',
  } satisfies CSSProperties,

  // Dark panel rows
  shrinkRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.55rem 0',
    borderBottom: '1px dashed #55617a', // verbatim
    fontSize: '0.88rem',
    fontFamily: FONT.body,
  } satisfies CSSProperties,

  // Blue panel rows
  shrinkRowBlue: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.55rem 0',
    borderBottom: '1px solid rgba(255,255,255,.2)', // verbatim — prototype .shrink-row--blue-border
    fontSize: '0.88rem',
    fontFamily: FONT.body,
  } satisfies CSSProperties,

  rowVal: {
    fontFamily: FONT.display,
    fontSize: '1rem',
    fontWeight: 400,
  } satisfies CSSProperties,

  rowValYellow: {
    fontFamily: FONT.display,
    fontSize: '1rem',
    color: BRAND.yellow,
    fontWeight: 400,
  } satisfies CSSProperties,

  shrinkSubtotal: {
    marginTop: '1rem',
    padding: '0.9rem',
    background: BRAND.yellow,
    color: BRAND.charcoal,
    textAlign: 'center' as const,
    border: `3px solid ${BRAND.white}`,
  } satisfies CSSProperties,

  shrinkSubtotalLabel: {
    fontFamily: FONT.display,
    fontSize: '0.78rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    fontWeight: 400,
  } satisfies CSSProperties,

  shrinkSubtotalVal: {
    fontFamily: FONT.display,
    fontSize: '1.9rem',
    lineHeight: 1,
    marginTop: '0.3rem',
    fontWeight: 400,
  } satisfies CSSProperties,

  // === Grand total ===
  shrinkTotal: {
    marginTop: '1.5rem',
    background: BRAND.yellow,
    border: `4px solid ${BRAND.charcoal}`,
    padding: '1.5rem 2rem',
    boxShadow: `6px 6px 0 ${BRAND.charcoal}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: '1rem',
  } satisfies CSSProperties,

  shrinkTotalLabel: {
    fontFamily: FONT.display,
    fontSize: '0.88rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    fontWeight: 400,
  } satisfies CSSProperties,

  shrinkTotalSub: {
    fontSize: '0.82rem',
    color: '#3a4454', // verbatim — prototype
    marginTop: '0.2rem',
    fontFamily: FONT.body,
  } satisfies CSSProperties,

  shrinkTotalVal: {
    fontFamily: FONT.display,
    fontSize: '2.8rem',
    color: BRAND.charcoal,
    lineHeight: 1,
    fontWeight: 400,
  } satisfies CSSProperties,

  // Screen-reader-only visually hidden helper (C1 — a11y descriptor elements)
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap' as const,
    border: 0,
  } satisfies CSSProperties,
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ShrinkCalculator() {
  // 2 numeric inputs (default to prototype's seed values)
  const [aov, setAov] = useState(150);
  const [units, setUnits] = useState(12000);
  // 2 slider inputs (defaults match prototype)
  const [weight, setWeight] = useState(25);
  const [rate, setRate] = useState(3);

  // Memoised recalc — only re-runs when inputs change
  const result = useMemo(
    () => recalcShrink({ aov, units, rate, weight }),
    [aov, units, rate, weight],
  );

  return (
    <div>
      {/* ── Inputs grid (2 columns: left=numeric, right=sliders) ── */}
      <div style={S.shrinkInputs}>

        {/* LEFT COLUMN — numeric inputs */}
        <div>
          <div style={S.inputGroup}>
            <label style={S.shrinkLabel} htmlFor="sc-aov">Average Order Value ($)</label>
            <input
              id="sc-aov"
              type="number"
              min={1}
              style={S.shrinkInput}
              value={aov === 0 ? '' : aov}
              onChange={(e) => setAov(Math.max(0, parseFloat(e.target.value) || 0))}
              aria-describedby="sc-aov-desc"
            />
            <span id="sc-aov-desc" style={S.srOnly}>Enter your average order value in US dollars.</span>
          </div>
          <div>
            <label style={S.shrinkLabel} htmlFor="sc-units">Annual Units Shipped</label>
            <input
              id="sc-units"
              type="number"
              min={1}
              style={S.shrinkInput}
              value={units === 0 ? '' : units}
              onChange={(e) => setUnits(Math.max(0, parseFloat(e.target.value) || 0))}
            />
          </div>
        </div>

        {/* RIGHT COLUMN — sliders */}
        <div>
          {/* Weight slider */}
          <div style={S.inputGroup}>
            <label style={S.shrinkLabel} htmlFor="sc-wt">
              Typical Package Weight (lbs):
              <span style={S.shrinkBadge}>{weight} lbs</span>
            </label>
            <input
              id="sc-wt"
              type="range"
              className="shrink-range"
              style={S.shrinkRange}
              min={1}
              max={149}
              step={1}
              value={weight}
              onChange={(e) => setWeight(Math.max(1, parseFloat(e.target.value)))}
              aria-label={`Typical package weight: ${weight} lbs`}
              aria-valuetext={`${weight} pounds`}
            />
            {/* Scale labels — verbatim from prototype line 621 */}
            <div style={S.shrinkScale} aria-hidden="true">
              <span>1 lb</span>
              <span>GOFO</span>
              <span>FedEx Gnd</span>
              <span>FedEx Heavy</span>
              <span>149 lbs</span>
            </div>
            {/* Cliff warning — conditional */}
            {result.cliffWarning && (
              <div style={S.cliffWarn} role="alert">
                ⚠ {result.cliffWarning}
              </div>
            )}
          </div>

          {/* Rate slider */}
          <div>
            <label style={S.shrinkLabel} htmlFor="sc-rate">
              3PL Shrinkage Rate:
              <span style={S.shrinkBadge}>{rate.toFixed(1)}%</span>
            </label>
            <input
              id="sc-rate"
              type="range"
              className="shrink-range"
              style={S.shrinkRange}
              min={2}
              max={10}
              step={0.1}
              value={rate}
              onChange={(e) => setRate(Math.max(2, parseFloat(e.target.value)))}
              aria-label={`3PL shrinkage rate: ${rate.toFixed(1)}%`}
              aria-valuetext={`${rate.toFixed(1)} percent`}
            />
            {/* Scale labels — verbatim from prototype line 627 */}
            <div style={S.shrinkScale} aria-hidden="true">
              <span>2%</span>
              <span>Industry avg</span>
              <span>10%</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Result panels (2-column: dark shrinkage + blue shipping) ── */}
      <div style={S.shrinkResults}>

        {/* DARK PANEL — Shrinkage Reality */}
        <div
          style={S.shrinkPanelDark}
          role="group"
          aria-label="Shrinkage Reality results"
        >
          <h4 style={S.panelH4}>Shrinkage Reality</h4>

          <div style={S.shrinkRow}>
            <span>Inventory Lost / Year</span>
            <span style={S.rowVal}>
              {result.ready ? Math.round(result.unitsLost).toLocaleString() + ' units' : '—'}
            </span>
          </div>
          <div style={S.shrinkRow}>
            <span>Direct Revenue Lost</span>
            <span style={S.rowVal}>
              {result.ready ? fmtInt(result.revLost) : '—'}
            </span>
          </div>
          <div style={S.shrinkRow}>
            <span>Lost Profit (15% margin)</span>
            <span style={S.rowVal}>
              {result.ready ? fmtInt(result.profitLost) : '—'}
            </span>
          </div>
          <div style={S.shrinkRow}>
            <span>Cost at Shipping Cow</span>
            {/* Literal $0 per prototype — verbatim */}
            <span style={S.rowValYellow}>$0</span>
          </div>

          <div style={S.shrinkSubtotal}>
            <div style={S.shrinkSubtotalLabel}>Shrinkage Savings</div>
            <div style={S.shrinkSubtotalVal}>
              {result.ready ? fmtInt(result.revLost) + '/yr' : '—'}
            </div>
          </div>
        </div>

        {/* BLUE PANEL — Shipping Rate Reality */}
        <div
          style={S.shrinkPanelBlue}
          role="group"
          aria-label="Shipping Rate Reality results"
        >
          <h4 style={S.panelH4}>Shipping Rate Reality</h4>
          <div style={S.panelCarrierNote}>
            Carrier:{' '}
            <strong style={{ color: BRAND.white }}>{result.carrier}</strong>
            {' · '}
            <span>{weight} lb package</span>
          </div>

          <div style={S.shrinkRowBlue}>
            <span>Typical Published Rate</span>
            <span style={S.rowVal}>
              {result.ready ? fmtDollar2(result.theirCost) : '—'}
            </span>
          </div>
          <div style={S.shrinkRowBlue}>
            <span>Last Mile (ShippingCow)</span>
            <span style={S.rowVal}>
              {fmtDollar2(result.lmRate)}
            </span>
          </div>
          <div style={S.shrinkRowBlue}>
            <span>Handling Fee</span>
            <span style={S.rowVal}>
              {fmtDollar2(result.handling)}
            </span>
          </div>
          <div style={S.shrinkRowBlue}>
            <span>Your Total per Label</span>
            <span style={S.rowValYellow}>
              {fmtDollar2(result.ourCost)}
            </span>
          </div>

          <div style={S.shrinkSubtotal}>
            <div style={S.shrinkSubtotalLabel}>Shipping Savings</div>
            <div style={S.shrinkSubtotalVal}>
              {result.ready ? fmtInt(result.annualShipSave) + '/yr' : '—'}
            </div>
          </div>
        </div>

      </div>

      {/* ── Grand total ── */}
      <div style={S.shrinkTotal}>
        <div>
          <div style={S.shrinkTotalLabel}>Total Annual Savings with Shipping Cow 🐄</div>
          <div style={S.shrinkTotalSub}>Shrinkage eliminated + shipping rate reduction combined</div>
        </div>
        <div style={S.shrinkTotalVal}>
          {result.ready ? fmtInt(result.total) : '—'}
        </div>
      </div>
    </div>
  );
}
