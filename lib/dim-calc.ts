// DIM Weight Calculator — pure math, no DOM, no React.
// Source of truth for DIM logic across the codebase.
// Reused by: app/_dim-calculator.tsx (homepage) and /quote (WS F).
//
// Constants verified from prototype: homepage/shipping cow home page(1).html line 795
// const DIM_139 = 139, DIM_166 = 166, DIM_225 = 225, COST_PER_LB = 0.45;

export const DIM_139 = 139;
export const DIM_166 = 166;
export const DIM_225 = 225;
/** Blended rate used for savings estimate: $0.45/lb */
export const COST_PER_LB = 0.45;

export interface DimInput {
  /** Length in inches */
  l: number;
  /** Width in inches */
  w: number;
  /** Height in inches */
  h: number;
  /** Actual weight in lbs */
  wt: number;
  /** Monthly shipment volume */
  vol: number;
}

export interface DimResult {
  /** L × W × H cubic inches (always computed, even when ready is false) */
  cubic: number;
  /** Whether all 5 inputs are non-zero (result is meaningful only when true) */
  ready: boolean;
  // DIM weight by divisor
  dim139: number;
  dim166: number;
  dim225: number;
  // Billable weight = max(actual wt, DIM wt)
  bill139: number;
  bill166: number;
  bill225: number;
  /** Billable lbs saved vs UPS/FedEx (÷139) */
  lbsSaved: number;
  /** Percentage reduction in billable weight vs UPS/FedEx */
  pctSaved: number;
  /** Savings per package in dollars */
  savingsPerPkg: number;
  /** Estimated annual savings in dollars (savingsPerPkg × vol × 12) */
  annualSavings: number;
}

/**
 * Compute DIM weight metrics for a given package + volume.
 * Returns { cubic, ready: false, dim*: 0, ... } when any input is zero.
 * ZIP inputs are informational only; no zone lookup is performed here.
 */
export function recalcDim({ l, w, h, wt, vol }: DimInput): DimResult {
  const cubic = l * w * h;

  const zero: Omit<DimResult, 'cubic' | 'ready'> = {
    dim139: 0,
    dim166: 0,
    dim225: 0,
    bill139: 0,
    bill166: 0,
    bill225: 0,
    lbsSaved: 0,
    pctSaved: 0,
    savingsPerPkg: 0,
    annualSavings: 0,
  };

  if (!l || !w || !h || !wt || !vol) {
    return { cubic, ready: false, ...zero };
  }

  const dim139 = cubic / DIM_139;
  const dim166 = cubic / DIM_166;
  const dim225 = cubic / DIM_225;
  const bill139 = Math.max(wt, dim139);
  const bill166 = Math.max(wt, dim166);
  const bill225 = Math.max(wt, dim225);
  const lbsSaved = bill139 - bill225;
  const pctSaved = bill139 > 0 ? (lbsSaved / bill139) * 100 : 0;
  const savingsPerPkg = lbsSaved * COST_PER_LB;
  const annualSavings = savingsPerPkg * vol * 12;

  return {
    cubic,
    ready: true,
    dim139,
    dim166,
    dim225,
    bill139,
    bill166,
    bill225,
    lbsSaved,
    pctSaved,
    savingsPerPkg,
    annualSavings,
  };
}
