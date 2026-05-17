import { describe, it, expect } from 'vitest';
import {
  MARKUP,
  PROFIT_MARGIN,
  getLastMileRate,
  getHandlingFee,
  getPriceCliffWarning,
  recalcShrink,
} from '@/lib/shrink-calc';

// ─── Constants ────────────────────────────────────────────────────────────────

describe('shrink-calc constants', () => {
  it('MARKUP is 1.45', () => {
    expect(MARKUP).toBe(1.45);
  });

  it('PROFIT_MARGIN is 0.15', () => {
    expect(PROFIT_MARGIN).toBe(0.15);
  });
});

// ─── getLastMileRate ──────────────────────────────────────────────────────────

describe('getLastMileRate — carrier band selection', () => {
  it('weight 1 lb → GOFO band', () => {
    const r = getLastMileRate(1);
    expect(r.carrier).toBe('GOFO');
    expect(r.price).toBe(5.40);
  });

  it('weight 10 lb → GOFO band', () => {
    const r = getLastMileRate(10);
    expect(r.carrier).toBe('GOFO');
    expect(r.price).toBe(7.80);
  });

  it('weight 20 lb → GOFO band (top of range)', () => {
    const r = getLastMileRate(20);
    expect(r.carrier).toBe('GOFO');
    expect(r.price).toBe(13.10);
  });

  it('weight 21 lb → FedEx Ground band', () => {
    const r = getLastMileRate(21);
    expect(r.carrier).toBe('FedEx Ground');
    expect(r.price).toBe(17.00);
  });

  it('weight 25 lb → FedEx Ground band', () => {
    const r = getLastMileRate(25);
    expect(r.carrier).toBe('FedEx Ground');
    expect(r.price).toBe(17.90);
  });

  it('weight 49 lb → FedEx Ground band (top of range)', () => {
    const r = getLastMileRate(49);
    expect(r.carrier).toBe('FedEx Ground');
    expect(r.price).toBe(27.70);
  });

  it('weight 50 lb → FedEx Heavy band', () => {
    const r = getLastMileRate(50);
    expect(r.carrier).toBe('FedEx Heavy');
    expect(r.price).toBe(35.10);
  });

  it('weight 70 lb → FedEx Heavy band', () => {
    const r = getLastMileRate(70);
    expect(r.carrier).toBe('FedEx Heavy');
    expect(r.price).toBe(43.10);
  });

  it('weight 145 lb → FedEx Heavy band (capped rate)', () => {
    const r = getLastMileRate(145);
    expect(r.carrier).toBe('FedEx Heavy');
    expect(r.price).toBe(74.60);
  });

  it('weight 149 lb → FedEx Heavy band (max)', () => {
    const r = getLastMileRate(149);
    expect(r.carrier).toBe('FedEx Heavy');
    expect(r.price).toBe(74.60);
  });

  it('weight > 149 lb → FedEx Heavy band (fallback to max)', () => {
    const r = getLastMileRate(200);
    expect(r.carrier).toBe('FedEx Heavy');
    expect(r.price).toBe(74.60);
  });

  it('fractional weight is ceil-rounded for lookup', () => {
    // 20.5 → ceil → 21 → FedEx Ground
    const r = getLastMileRate(20.5);
    expect(r.carrier).toBe('FedEx Ground');
  });
});

// ─── getHandlingFee ───────────────────────────────────────────────────────────

describe('getHandlingFee — fee tiers', () => {
  it('weight 1 lb → $1.00', () => {
    expect(getHandlingFee(1)).toBe(1.00);
  });

  it('weight 5 lb → $1.50', () => {
    expect(getHandlingFee(5)).toBe(1.50);
  });

  it('weight 10 lb → $2.10', () => {
    expect(getHandlingFee(10)).toBe(2.10);
  });

  it('weight 25 lb → $2.70 (≤30 tier)', () => {
    expect(getHandlingFee(25)).toBe(2.70);
  });

  it('weight 30 lb → $2.70', () => {
    expect(getHandlingFee(30)).toBe(2.70);
  });

  it('weight 50 lb → $3.60', () => {
    expect(getHandlingFee(50)).toBe(3.60);
  });

  it('weight 80 lb → $5.50', () => {
    expect(getHandlingFee(80)).toBe(5.50);
  });

  it('weight 100 lb → $10.00 (w × 0.10)', () => {
    expect(getHandlingFee(100)).toBeCloseTo(10.00, 6);
  });

  it('weight 149 lb → $14.90 (w × 0.10)', () => {
    expect(getHandlingFee(149)).toBeCloseTo(14.90, 6);
  });
});

// ─── getPriceCliffWarning ─────────────────────────────────────────────────────

describe('getPriceCliffWarning — cliff detection', () => {
  it('weight 10 lb → cliff at 10 warning', () => {
    const w = getPriceCliffWarning(10);
    expect(w).not.toBeNull();
    expect(w).toContain('10 lbs');
    expect(w).toContain('pricing cliff');
  });

  it('weight 9 lb → 1 lb below cliff at 10', () => {
    const w = getPriceCliffWarning(9);
    expect(w).not.toBeNull();
    expect(w).toContain('1 lb below a pricing cliff');
  });

  it('weight 20 lb → cliff at 20 warning', () => {
    const w = getPriceCliffWarning(20);
    expect(w).not.toBeNull();
    expect(w).toContain('20 lbs');
    expect(w).toContain('pricing cliff');
  });

  it('weight 19 lb → 1 lb below cliff at 20', () => {
    const w = getPriceCliffWarning(19);
    expect(w).not.toBeNull();
    expect(w).toContain('1 lb below a pricing cliff');
  });

  it('weight 49 lb → cliff at 49 warning', () => {
    const w = getPriceCliffWarning(49);
    expect(w).not.toBeNull();
    expect(w).toContain('49 lbs');
    expect(w).toContain('pricing cliff');
  });

  it('weight 48 lb → 1 lb below cliff at 49', () => {
    const w = getPriceCliffWarning(48);
    expect(w).not.toBeNull();
    expect(w).toContain('1 lb below a pricing cliff');
  });

  it('weight 25 lb → no warning', () => {
    expect(getPriceCliffWarning(25)).toBeNull();
  });

  it('weight 1 lb → no warning', () => {
    expect(getPriceCliffWarning(1)).toBeNull();
  });

  it('weight 100 lb → no warning', () => {
    expect(getPriceCliffWarning(100)).toBeNull();
  });
});

// ─── recalcShrink — happy path ────────────────────────────────────────────────

describe('recalcShrink — happy path (aov:150, units:12000, rate:3, weight:25)', () => {
  // Manual computation:
  // unitsLost  = 12000 * (3/100) = 360
  // revLost    = 360 * 150 = 54000
  // profitLost = 54000 * 0.15 = 8100
  // lmRate     = FEDEX_GND[25] = 17.90 (FedEx Ground)
  // handling   = 2.70  (25 lb → ≤30 tier)
  // ourCost    = 17.90 + 2.70 = 20.60
  // theirCost  = 20.60 * 1.45 = 29.87
  // savingsPerLabel = 29.87 - 20.60 = 9.27
  // annualShipSave  = 9.27 * 12000 = 111240
  // total      = 54000 + 111240 = 165240
  const result = recalcShrink({ aov: 150, units: 12000, rate: 3, weight: 25 });

  it('returns ready: true', () => {
    expect(result.ready).toBe(true);
  });

  it('carrier is FedEx Ground', () => {
    expect(result.carrier).toBe('FedEx Ground');
  });

  it('unitsLost is correct', () => {
    expect(result.unitsLost).toBeCloseTo(360, 6);
  });

  it('revLost is correct', () => {
    expect(result.revLost).toBeCloseTo(54000, 6);
  });

  it('profitLost is correct (15% of revLost)', () => {
    expect(result.profitLost).toBeCloseTo(8100, 6);
  });

  it('lmRate is 17.90', () => {
    expect(result.lmRate).toBeCloseTo(17.90, 6);
  });

  it('handling is 2.70', () => {
    expect(result.handling).toBeCloseTo(2.70, 6);
  });

  it('ourCost = lmRate + handling', () => {
    expect(result.ourCost).toBeCloseTo(20.60, 6);
  });

  it('theirCost = ourCost × MARKUP', () => {
    expect(result.theirCost).toBeCloseTo(20.60 * 1.45, 6);
  });

  it('savingsPerLabel = theirCost - ourCost', () => {
    expect(result.savingsPerLabel).toBeCloseTo(20.60 * 1.45 - 20.60, 6);
  });

  it('annualShipSave = savingsPerLabel × units', () => {
    expect(result.annualShipSave).toBeCloseTo(result.savingsPerLabel * 12000, 6);
  });

  it('total = revLost + annualShipSave', () => {
    expect(result.total).toBeCloseTo(result.revLost + result.annualShipSave, 6);
  });

  it('cliffWarning is null at weight 25', () => {
    expect(result.cliffWarning).toBeNull();
  });
});

// ─── recalcShrink — carrier band transitions ──────────────────────────────────

describe('recalcShrink — carrier band transitions', () => {
  it('weight 1 lb → GOFO carrier', () => {
    const r = recalcShrink({ aov: 100, units: 1000, rate: 3, weight: 1 });
    expect(r.carrier).toBe('GOFO');
    expect(r.lmRate).toBe(5.40);
  });

  it('weight 15 lb → GOFO carrier', () => {
    const r = recalcShrink({ aov: 100, units: 1000, rate: 3, weight: 15 });
    expect(r.carrier).toBe('GOFO');
  });

  it('weight 25 lb → FedEx Ground carrier', () => {
    const r = recalcShrink({ aov: 100, units: 1000, rate: 3, weight: 25 });
    expect(r.carrier).toBe('FedEx Ground');
  });

  it('weight 70 lb → FedEx Heavy carrier', () => {
    const r = recalcShrink({ aov: 100, units: 1000, rate: 3, weight: 70 });
    expect(r.carrier).toBe('FedEx Heavy');
    expect(r.lmRate).toBe(43.10);
  });
});

// ─── recalcShrink — zero inputs ───────────────────────────────────────────────

describe('recalcShrink — zero AOV', () => {
  const result = recalcShrink({ aov: 0, units: 12000, rate: 3, weight: 25 });

  it('ready is false', () => {
    expect(result.ready).toBe(false);
  });

  it('unitsLost is 0', () => {
    expect(result.unitsLost).toBe(0);
  });

  it('revLost is 0', () => {
    expect(result.revLost).toBe(0);
  });

  it('profitLost is 0', () => {
    expect(result.profitLost).toBe(0);
  });

  it('annualShipSave is 0', () => {
    expect(result.annualShipSave).toBe(0);
  });

  it('total is 0', () => {
    expect(result.total).toBe(0);
  });

  it('carrier is still computed from weight (FedEx Ground at 25 lb)', () => {
    expect(result.carrier).toBe('FedEx Ground');
  });

  it('cliffWarning is still computed from weight (null at 25 lb)', () => {
    expect(result.cliffWarning).toBeNull();
  });
});

describe('recalcShrink — zero units', () => {
  const result = recalcShrink({ aov: 150, units: 0, rate: 3, weight: 25 });

  it('ready is false', () => {
    expect(result.ready).toBe(false);
  });

  it('all revenue/loss fields are 0', () => {
    expect(result.unitsLost).toBe(0);
    expect(result.revLost).toBe(0);
    expect(result.profitLost).toBe(0);
    expect(result.annualShipSave).toBe(0);
    expect(result.total).toBe(0);
  });

  it('carrier still set from weight', () => {
    expect(result.carrier).toBe('FedEx Ground');
  });
});

// ─── recalcShrink — negative inputs ───────────────────────────────────────────

describe('recalcShrink — negative AOV', () => {
  const result = recalcShrink({ aov: -50, units: 12000, rate: 3, weight: 25 });

  it('ready is false', () => {
    expect(result.ready).toBe(false);
  });

  it('all revenue fields are 0', () => {
    expect(result.revLost).toBe(0);
    expect(result.profitLost).toBe(0);
    expect(result.total).toBe(0);
  });
});

describe('recalcShrink — negative units', () => {
  const result = recalcShrink({ aov: 150, units: -1000, rate: 3, weight: 25 });

  it('ready is false', () => {
    expect(result.ready).toBe(false);
  });

  it('all fields are 0', () => {
    expect(result.unitsLost).toBe(0);
    expect(result.annualShipSave).toBe(0);
    expect(result.total).toBe(0);
  });
});

// ─── recalcShrink — decimal AOV ───────────────────────────────────────────────

describe('recalcShrink — decimal AOV (aov:150.50)', () => {
  const result = recalcShrink({ aov: 150.50, units: 12000, rate: 3, weight: 25 });

  it('ready is true', () => {
    expect(result.ready).toBe(true);
  });

  it('unitsLost is 360', () => {
    expect(result.unitsLost).toBeCloseTo(360, 6);
  });

  it('revLost = 360 × 150.50 = 54180', () => {
    expect(result.revLost).toBeCloseTo(360 * 150.50, 6);
  });

  it('profitLost = revLost × 0.15', () => {
    expect(result.profitLost).toBeCloseTo(360 * 150.50 * 0.15, 6);
  });
});

// ─── recalcShrink — cliff warning fires ───────────────────────────────────────

describe('recalcShrink — cliff warning at weight 10', () => {
  const result = recalcShrink({ aov: 100, units: 1000, rate: 3, weight: 10 });

  it('cliffWarning is not null', () => {
    expect(result.cliffWarning).not.toBeNull();
  });

  it('cliffWarning mentions the cliff weight', () => {
    expect(result.cliffWarning).toContain('10 lbs');
  });
});

describe('recalcShrink — cliff warning at weight 49', () => {
  const result = recalcShrink({ aov: 100, units: 1000, rate: 3, weight: 49 });

  it('cliffWarning is not null', () => {
    expect(result.cliffWarning).not.toBeNull();
  });

  it('cliffWarning mentions the cliff weight', () => {
    expect(result.cliffWarning).toContain('49 lbs');
  });
});

describe('recalcShrink — cliff warning at weight 19 (1 below cliff 20)', () => {
  const result = recalcShrink({ aov: 100, units: 1000, rate: 3, weight: 19 });

  it('cliffWarning is not null', () => {
    expect(result.cliffWarning).not.toBeNull();
  });

  it('cliffWarning mentions 1 lb below a pricing cliff', () => {
    expect(result.cliffWarning).toContain('1 lb below a pricing cliff');
  });
});

describe('recalcShrink — no cliff warning at weight 25', () => {
  const result = recalcShrink({ aov: 100, units: 1000, rate: 3, weight: 25 });

  it('cliffWarning is null', () => {
    expect(result.cliffWarning).toBeNull();
  });
});

// ─── recalcShrink — weight clamping ───────────────────────────────────────────

describe('recalcShrink — weight clamped to minimum 1', () => {
  const result = recalcShrink({ aov: 100, units: 1000, rate: 3, weight: 0 });

  it('ready is true (aov/units are valid)', () => {
    expect(result.ready).toBe(true);
  });

  it('carrier uses clamped weight 1 → GOFO', () => {
    expect(result.carrier).toBe('GOFO');
  });
});

describe('recalcShrink — rate clamped to 0 minimum', () => {
  // rate=-5 → clamped to 0 → no units lost → revLost=0 → total=annualShipSave only
  const result = recalcShrink({ aov: 100, units: 1000, rate: -5, weight: 25 });

  it('ready is true', () => {
    expect(result.ready).toBe(true);
  });

  it('unitsLost is 0 when rate clamped to 0', () => {
    expect(result.unitsLost).toBeCloseTo(0, 6);
  });

  it('revLost is 0', () => {
    expect(result.revLost).toBeCloseTo(0, 6);
  });
});
