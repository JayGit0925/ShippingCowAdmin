import { describe, it, expect } from 'vitest';
import {
  DIM_139,
  DIM_166,
  DIM_225,
  COST_PER_LB,
  recalcDim,
} from '@/lib/dim-calc';

describe('DIM calc constants', () => {
  it('exports the correct divisor and rate constants', () => {
    expect(DIM_139).toBe(139);
    expect(DIM_166).toBe(166);
    expect(DIM_225).toBe(225);
    expect(COST_PER_LB).toBe(0.45);
  });
});

describe('recalcDim — happy path (24×18×16, 55 lb, 100 vol)', () => {
  // cubic = 24 * 18 * 16 = 6912
  // dim139 = 6912 / 139 ≈ 49.727…
  // dim166 = 6912 / 166 ≈ 41.639…
  // dim225 = 6912 / 225 = 30.72
  // bill139 = max(55, 49.727) = 55  (actual weight dominates)
  // bill166 = max(55, 41.639) = 55  (actual weight dominates)
  // bill225 = max(55, 30.72)  = 55  (actual weight dominates)
  // lbsSaved = 55 - 55 = 0  → heavy small pkg: actual wt dominates all divisors
  //
  // Note: 24×18×16 at 55 lb is a *heavy* package — actual weight exceeds DIM for
  // all three divisors. The "weight exceeds DIM" edge case is therefore embedded in
  // the default prototype values. A separate explicit test is below.
  const result = recalcDim({ l: 24, w: 18, h: 16, wt: 55, vol: 100 });

  it('returns ready: true', () => {
    expect(result.ready).toBe(true);
  });

  it('computes cubic correctly', () => {
    expect(result.cubic).toBe(6912);
  });

  it('computes dim139 correctly', () => {
    expect(result.dim139).toBeCloseTo(6912 / 139, 6);
  });

  it('computes dim166 correctly', () => {
    expect(result.dim166).toBeCloseTo(6912 / 166, 6);
  });

  it('computes dim225 correctly', () => {
    expect(result.dim225).toBeCloseTo(6912 / 225, 6);
  });

  it('bill139 = actual weight when heavier than DIM', () => {
    expect(result.bill139).toBe(55);
  });

  it('bill225 = actual weight when heavier than DIM', () => {
    expect(result.bill225).toBe(55);
  });

  it('lbsSaved = 0 when actual weight dominates all divisors', () => {
    expect(result.lbsSaved).toBe(0);
  });

  it('annualSavings = 0 when lbsSaved = 0', () => {
    expect(result.annualSavings).toBe(0);
  });
});

describe('recalcDim — weight exceeds DIM for all three divisors (explicit)', () => {
  // Use a heavy, compact box: 10×10×10 = 1000 cubic in
  // dim139 ≈ 7.19, dim166 ≈ 6.02, dim225 ≈ 4.44 — actual weight 50 lb dominates all
  const result = recalcDim({ l: 10, w: 10, h: 10, wt: 50, vol: 200 });

  it('ready is true', () => expect(result.ready).toBe(true));
  it('bill139 equals actual weight', () => expect(result.bill139).toBe(50));
  it('bill166 equals actual weight', () => expect(result.bill166).toBe(50));
  it('bill225 equals actual weight', () => expect(result.bill225).toBe(50));
  it('lbsSaved is 0', () => expect(result.lbsSaved).toBe(0));
  it('pctSaved is 0', () => expect(result.pctSaved).toBe(0));
  it('savingsPerPkg is 0', () => expect(result.savingsPerPkg).toBe(0));
  it('annualSavings is 0', () => expect(result.annualSavings).toBe(0));
});

describe('recalcDim — weight below all DIMs (light large package)', () => {
  // Big lightweight box: 60×48×48 = 138240 cubic in, 5 lb actual
  // dim139 = 138240 / 139 ≈ 994.53  → bill139 ≈ 994.53
  // dim166 = 138240 / 166 ≈ 832.77  → bill166 ≈ 832.77
  // dim225 = 138240 / 225 = 614.4   → bill225 = 614.4
  // lbsSaved = 994.53 - 614.4 ≈ 380.13
  // pctSaved = (380.13 / 994.53) × 100 ≈ 38.22%
  // savingsPerPkg ≈ 380.13 * 0.45 ≈ 171.06
  // annualSavings ≈ 171.06 * 50 * 12 ≈ 102636
  const result = recalcDim({ l: 60, w: 48, h: 48, wt: 5, vol: 50 });
  const cubic = 60 * 48 * 48; // 138240
  const expectedDim139 = cubic / DIM_139;
  const expectedDim225 = cubic / DIM_225;
  const expectedLbsSaved = expectedDim139 - expectedDim225;

  it('ready is true', () => expect(result.ready).toBe(true));
  it('cubic is correct', () => expect(result.cubic).toBe(138240));
  it('bill139 equals dim139 (DIM dominates)', () => {
    expect(result.bill139).toBeCloseTo(expectedDim139, 6);
  });
  it('bill225 equals dim225 (DIM dominates)', () => {
    expect(result.bill225).toBeCloseTo(expectedDim225, 6);
  });
  it('lbsSaved is positive and correct', () => {
    expect(result.lbsSaved).toBeCloseTo(expectedLbsSaved, 6);
    expect(result.lbsSaved).toBeGreaterThan(0);
  });
  it('pctSaved is between 0 and 100', () => {
    expect(result.pctSaved).toBeGreaterThan(0);
    expect(result.pctSaved).toBeLessThan(100);
  });
  it('savingsPerPkg = lbsSaved × COST_PER_LB', () => {
    expect(result.savingsPerPkg).toBeCloseTo(expectedLbsSaved * COST_PER_LB, 6);
  });
  it('annualSavings = savingsPerPkg × vol × 12', () => {
    expect(result.annualSavings).toBeCloseTo(result.savingsPerPkg * 50 * 12, 6);
  });
});

describe('recalcDim — zero / missing inputs', () => {
  it('returns ready: false when all inputs are zero', () => {
    const result = recalcDim({ l: 0, w: 0, h: 0, wt: 0, vol: 0 });
    expect(result.ready).toBe(false);
    expect(result.cubic).toBe(0);
  });

  it('returns ready: false and cubic = 0 when only l/w/h are zero', () => {
    const result = recalcDim({ l: 0, w: 18, h: 16, wt: 55, vol: 100 });
    expect(result.ready).toBe(false);
    expect(result.cubic).toBe(0); // 0 * 18 * 16 = 0
  });

  it('returns ready: false when only vol is zero', () => {
    const result = recalcDim({ l: 24, w: 18, h: 16, wt: 55, vol: 0 });
    expect(result.ready).toBe(false);
  });

  it('returns ready: false when only wt is zero', () => {
    const result = recalcDim({ l: 24, w: 18, h: 16, wt: 0, vol: 100 });
    expect(result.ready).toBe(false);
    // cubic is still computed from the dimensions
    expect(result.cubic).toBe(6912);
  });

  it('all derived fields are 0 when ready is false', () => {
    const result = recalcDim({ l: 24, w: 18, h: 16, wt: 0, vol: 100 });
    expect(result.lbsSaved).toBe(0);
    expect(result.annualSavings).toBe(0);
    expect(result.savingsPerPkg).toBe(0);
  });
});
