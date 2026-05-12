import { describe, it, expect } from 'vitest';
import { calcEstimates } from '../../lib/rate-calc';

describe('calcEstimates', () => {
  it('50lb Zone 4 — savings = $19', () => {
    expect(calcEstimates(50, 4).savings).toBe(19);
  });

  it('50lb Zone 2 — savings < $18 (known failure case)', () => {
    expect(calcEstimates(50, 2).savings).toBeLessThan(18);
  });

  it('70lb Zone 2 — savings = $18 (boundary)', () => {
    expect(calcEstimates(70, 2).savings).toBe(18);
  });

  it('149lb Zone 8 — large item far zone, savings >= $18', () => {
    expect(calcEstimates(149, 8).savings).toBeGreaterThanOrEqual(18);
  });

  it('savings = standard - shippingcow (±1 rounding tolerance)', () => {
    const { standard, shippingcow, savings } = calcEstimates(90, 6);
    expect(Math.abs(savings - (standard - shippingcow))).toBeLessThanOrEqual(1);
  });

  it('out-of-range zone falls back to 0.37 rate (zone 5 rate)', () => {
    // zone 9 is out of range; fallback rate is 0.37, same as zone 5
    expect(calcEstimates(50, 9)).toEqual(calcEstimates(50, 5));
  });
});
