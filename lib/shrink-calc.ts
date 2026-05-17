// Shrinkage Calculator — pure math, no DOM, no React.
// Source of truth for shrinkage loss + shipping rate logic.
// Reused by: app/_shrink-calculator.tsx (homepage).
//
// Constants verified from prototype: homepage/shipping cow home page(1).html line 902
// const MARKUP = 1.45; (PROFIT_MARGIN of 0.15 extracted from line 916)

export const MARKUP = 1.45;
export const PROFIT_MARGIN = 0.15;

// ─── Rate tables (verbatim from prototype lines 800-802) ─────────────────────

const GOFO_RATES = {
  1:5.40,2:5.60,3:5.90,4:6.20,5:6.30,6:6.60,7:7.00,8:7.20,9:7.40,10:7.80,
  11:9.70,12:10.00,13:10.40,14:10.70,15:11.00,16:11.60,17:12.00,18:12.20,19:12.70,20:13.10,
} as const satisfies Record<number, number>;

const FEDEX_GND = {
  21:17.00,22:17.00,23:17.10,24:17.30,25:17.90,26:18.20,27:18.70,28:19.10,29:19.70,30:20.00,
  31:20.40,32:20.80,33:20.90,34:21.50,35:22.00,36:22.30,37:22.90,38:23.20,39:23.50,40:24.20,
  41:24.30,42:25.00,43:25.20,44:25.90,45:26.30,46:26.40,47:26.90,48:27.30,49:27.70,
} as const satisfies Record<number, number>;

const FEDEX_HEAVY = {
  50:35.10,51:35.50,52:35.90,53:36.30,54:36.70,55:37.10,56:37.50,57:37.90,58:38.30,59:38.70,
  60:39.10,61:39.50,62:39.90,63:40.30,64:40.70,65:41.10,66:41.50,67:41.90,68:42.30,69:42.70,
  70:43.10,71:43.50,72:43.90,73:44.30,74:44.70,75:45.10,76:45.50,77:45.90,78:46.30,79:46.70,
  80:47.10,81:47.50,82:47.90,83:48.30,84:48.70,85:49.10,86:49.50,87:49.90,88:50.30,89:50.70,
  90:51.10,91:51.80,92:52.40,93:53.10,94:53.80,95:54.40,96:55.10,97:55.70,98:56.40,99:57.10,
  100:57.70,101:58.40,102:59.00,103:59.70,104:60.40,105:61.00,106:61.70,107:62.30,108:63.00,
  109:63.70,110:64.30,111:65.00,112:65.60,113:66.30,114:67.00,115:67.60,116:68.30,117:68.90,
  118:69.60,119:70.30,120:70.90,121:71.60,122:72.20,123:72.90,124:73.60,125:74.20,126:74.60,
  127:74.60,128:74.60,129:74.60,130:74.60,131:74.60,132:74.60,133:74.60,134:74.60,135:74.60,
  136:74.60,137:74.60,138:74.60,139:74.60,140:74.60,141:74.60,142:74.60,143:74.60,144:74.60,
  145:74.60,146:74.60,147:74.60,148:74.60,149:74.60,
} as const satisfies Record<number, number>;

// ─── Helpers (verbatim logic from prototype lines 804-833) ───────────────────

/**
 * Returns the last-mile carrier and rate for a given package weight.
 * Verbatim from prototype lines 804-810.
 */
export function getLastMileRate(w: number): { carrier: string; price: number } {
  const wc = Math.ceil(w);
  if (wc <= 20) return { price: GOFO_RATES[wc as keyof typeof GOFO_RATES] ?? GOFO_RATES[20], carrier: 'GOFO' };
  if (wc <= 49) return { price: FEDEX_GND[wc as keyof typeof FEDEX_GND] ?? FEDEX_GND[49], carrier: 'FedEx Ground' };
  if (wc <= 149) return { price: FEDEX_HEAVY[wc as keyof typeof FEDEX_HEAVY] ?? FEDEX_HEAVY[149], carrier: 'FedEx Heavy' };
  return { price: FEDEX_HEAVY[149], carrier: 'FedEx Heavy' };
}

/**
 * Returns the per-label handling fee for a given package weight.
 * Verbatim from prototype lines 811-819.
 */
export function getHandlingFee(w: number): number {
  if (w <= 1)  return 1.00;
  if (w <= 5)  return 1.50;
  if (w <= 10) return 2.10;
  if (w <= 30) return 2.70;
  if (w <= 50) return 3.60;
  if (w <= 80) return 5.50;
  return w * 0.10;
}

/**
 * Returns a warning string when the weight is at or 1 lb below a pricing cliff,
 * or null if no cliff applies.
 * Verbatim from prototype lines 820-833.
 */
export function getPriceCliffWarning(w: number): string | null {
  const wc = Math.ceil(w);
  for (const cliff of [10, 20, 49]) {
    if (wc === cliff) {
      const nr = getLastMileRate(cliff + 1);
      const cr = getLastMileRate(cliff);
      return `Weight is exactly at a pricing cliff (${cliff} lbs). Shipping at ${cliff + 1} lbs costs $${(nr.price - cr.price).toFixed(2)} more and switches to ${nr.carrier}.`;
    }
    if (wc === cliff - 1) {
      const nr = getLastMileRate(cliff + 1);
      const cr = getLastMileRate(cliff - 1);
      return `Weight is 1 lb below a pricing cliff. At ${cliff + 1} lbs, cost jumps $${(nr.price - cr.price).toFixed(2)} to ${nr.carrier}.`;
    }
  }
  return null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShrinkInput {
  /** Average order value in dollars */
  aov: number;
  /** Annual units shipped */
  units: number;
  /** 3PL shrinkage rate as a percentage (e.g. 3 means 3%) */
  rate: number;
  /** Typical package weight in lbs */
  weight: number;
}

export interface ShrinkResult {
  /** false when aov <= 0 or units <= 0 — carrier and cliffWarning still set from weight */
  ready: boolean;
  /** Last-mile carrier name (always set, computed from weight) */
  carrier: string;
  /** Units lost per year to shrinkage */
  unitsLost: number;
  /** Direct revenue lost per year */
  revLost: number;
  /** Lost profit (PROFIT_MARGIN × revLost) */
  profitLost: number;
  /** Last-mile rate per label */
  lmRate: number;
  /** Handling fee per label */
  handling: number;
  /** Total cost per label at ShippingCow (lmRate + handling) */
  ourCost: number;
  /** Typical published rate per label (ourCost × MARKUP) */
  theirCost: number;
  /** Savings per label vs typical published rate */
  savingsPerLabel: number;
  /** Annual shipping savings (savingsPerLabel × units) */
  annualShipSave: number;
  /** Total annual savings (revLost + annualShipSave) */
  total: number;
  /** Cliff warning message or null */
  cliffWarning: string | null;
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Compute shrinkage + shipping rate savings for given inputs.
 * Returns { ready: false, all numeric fields 0 } when aov <= 0 or units <= 0.
 * Carrier and cliffWarning are always computed from weight regardless of ready state.
 * rate is clamped to minimum 0; weight is clamped to minimum 1.
 */
export function recalcShrink({ aov, units, rate, weight }: ShrinkInput): ShrinkResult {
  // Clamp sliders to safe minimums (UI shouldn't go below these, but protect library callers)
  const safeRate = Math.max(0, rate);
  const safeWeight = Math.max(1, weight);

  // Always compute weight-dependent fields (prototype behavior: carrier/cliff depend only on weight)
  const lmRateObj = getLastMileRate(safeWeight);
  const handling = getHandlingFee(safeWeight);
  const ourCost = lmRateObj.price + handling;
  const theirCost = ourCost * MARKUP;
  const savingsPerLabel = theirCost - ourCost;
  const cliffWarning = getPriceCliffWarning(safeWeight);

  const zero = {
    unitsLost: 0,
    revLost: 0,
    profitLost: 0,
    annualShipSave: 0,
    total: 0,
  };

  if (aov <= 0 || units <= 0) {
    return {
      ready: false,
      carrier: lmRateObj.carrier,
      ...zero,
      lmRate: lmRateObj.price,
      handling,
      ourCost,
      theirCost,
      savingsPerLabel,
      cliffWarning,
    };
  }

  const unitsLost = units * (safeRate / 100);
  const revLost = unitsLost * aov;
  const profitLost = revLost * PROFIT_MARGIN;
  const annualShipSave = savingsPerLabel * units;
  const total = revLost + annualShipSave;

  return {
    ready: true,
    carrier: lmRateObj.carrier,
    unitsLost,
    revLost,
    profitLost,
    lmRate: lmRateObj.price,
    handling,
    ourCost,
    theirCost,
    savingsPerLabel,
    annualShipSave,
    total,
    cliffWarning,
  };
}
