'use client';

import { useState } from 'react';
import { BRAND, FONT, px } from '@/lib/brand';

const RATES = {
  zoneRatePerLb: [0, 0.21, 0.21, 0.26, 0.31, 0.37, 0.44, 0.50, 0.56] as const,
  standardDimMultiplier: 2.0,
  shippingcowDimMultiplier: 1.25,
  standardResidential: 5.85,
  shippingcowResidential: 1.17,
  standardFuelPct: 0.13,
  shippingcowFuelPct: 0,
};

function calcEstimates(weightLbs: number, zone: number) {
  const rate = RATES.zoneRatePerLb[zone] ?? 0.37;
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

const labelStyle: React.CSSProperties = {
  fontFamily: FONT.pixel,
  fontSize: 8,
  opacity: 0.5,
  letterSpacing: '0.04em',
  display: 'block',
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  fontFamily: FONT.body,
  fontSize: 15,
  padding: '10px 14px',
  border: `3px solid ${BRAND.charcoal}`,
  background: BRAND.white,
  appearance: 'none' as const,
  WebkitAppearance: 'none' as const,
  width: '100%',
  boxSizing: 'border-box' as const,
  outline: 'none',
  borderRadius: 0,
};

export default function RateCalculator() {
  const [weight, setWeight] = useState(50);
  const [zone, setZone] = useState(5);

  const est = calcEstimates(weight, zone);

  return (
    <div
      style={{
        border: `3px solid ${BRAND.charcoal}`,
        boxShadow: px(),
        padding: 32,
        background: BRAND.white,
        maxWidth: 640,
      }}
    >
      {/* Row 1: inputs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          marginBottom: 32,
        }}
      >
        <div>
          <label style={labelStyle}>ITEM WEIGHT (LBS)</label>
          <input
            type="number"
            min={10}
            max={300}
            value={weight}
            onChange={(e) => setWeight(Math.min(300, Math.max(10, Number(e.target.value))))}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>DESTINATION ZONE (1–8)</label>
          <select
            value={zone}
            onChange={(e) => setZone(Number(e.target.value))}
            style={inputStyle}
          >
            <option value={2}>Zone 2</option>
            <option value={3}>Zone 3</option>
            <option value={4}>Zone 4</option>
            <option value={5}>Zone 5 (avg US)</option>
            <option value={6}>Zone 6</option>
            <option value={7}>Zone 7</option>
            <option value={8}>Zone 8</option>
          </select>
        </div>
      </div>

      {/* Row 2: result tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 16,
        }}
      >
        {/* Standard carrier tile */}
        <div
          style={{
            border: `2px solid ${BRAND.charcoal}`,
            padding: '16px 20px',
            background: '#fff5f5',
          }}
        >
          <span
            style={{
              fontFamily: FONT.pixel,
              fontSize: 7,
              opacity: 0.5,
              display: 'block',
              marginBottom: 8,
              letterSpacing: '0.04em',
            }}
          >
            STANDARD CARRIER
          </span>
          <span
            style={{
              fontFamily: FONT.display,
              fontSize: 32,
              color: BRAND.red,
              display: 'block',
            }}
          >
            ~${est.standard}
          </span>
        </div>

        {/* ShippingCow tile */}
        <div
          style={{
            border: `2px solid ${BRAND.charcoal}`,
            padding: '16px 20px',
            background: '#f0faf4',
          }}
        >
          <span
            style={{
              fontFamily: FONT.pixel,
              fontSize: 7,
              opacity: 0.5,
              display: 'block',
              marginBottom: 8,
              letterSpacing: '0.04em',
            }}
          >
            SHIPPINGCOW
          </span>
          <span
            style={{
              fontFamily: FONT.display,
              fontSize: 32,
              color: BRAND.green,
              display: 'block',
            }}
          >
            ~${est.shippingcow}
          </span>
        </div>

        {/* Savings tile */}
        <div
          style={{
            border: `3px solid ${BRAND.charcoal}`,
            boxShadow: px(BRAND.blue),
            padding: '16px 20px',
            background: BRAND.blue,
            color: BRAND.white,
          }}
        >
          <span
            style={{
              fontFamily: FONT.pixel,
              fontSize: 7,
              opacity: 0.7,
              display: 'block',
              marginBottom: 8,
              letterSpacing: '0.04em',
            }}
          >
            YOU SAVE
          </span>
          <span
            style={{
              fontFamily: FONT.display,
              fontSize: 32,
              display: 'block',
            }}
          >
            ~${est.savings}
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      <p
        style={{
          fontFamily: FONT.body,
          fontSize: 11,
          opacity: 0.45,
          lineHeight: 1.6,
          marginTop: 16,
          marginBottom: 0,
        }}
      >
        Estimates based on published ground carrier list rates for furniture-category shipments. DIM
        pricing, residential surcharge, and fuel surcharge included. Actual savings vary by item
        dimensions and route.{' '}
        <a href="#quote" style={{ color: BRAND.blue, textDecoration: 'underline' }}>
          Get your exact rate →
        </a>
      </p>
    </div>
  );
}
