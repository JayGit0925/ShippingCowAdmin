export const RATES = {
  zoneRatePerLb: [0, 0.21, 0.21, 0.26, 0.31, 0.37, 0.44, 0.50, 0.56] as const,
  standardDimMultiplier: 2.0,
  shippingcowDimMultiplier: 1.25,
  standardResidential: 5.85,
  shippingcowResidential: 2.34,
  standardFuelPct: 0.13,
  shippingcowFuelPct: 0,
} as const;

export interface RateEstimate {
  standard: number;
  shippingcow: number;
  savings: number;
}

export function calcEstimates(weightLbs: number, zone: number): RateEstimate {
  const rate = zone >= 0 && zone < RATES.zoneRatePerLb.length
    ? RATES.zoneRatePerLb[zone]
    : 0.37;
  const stdBilled = Math.max(weightLbs, weightLbs * RATES.standardDimMultiplier);
  const scBilled = Math.max(weightLbs, weightLbs * RATES.shippingcowDimMultiplier);
  const stdBase = stdBilled * rate;
  const scBase = scBilled * rate;
  const stdTotal = stdBase * (1 + RATES.standardFuelPct) + RATES.standardResidential;
  const scTotal = scBase * (1 + RATES.shippingcowFuelPct) + RATES.shippingcowResidential;
  return {
    standard: Math.round(stdTotal),
    shippingcow: Math.round(scTotal),
    savings: Math.round(stdTotal - scTotal),
  };
}
