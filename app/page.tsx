import type { CSSProperties } from 'react';
import { BRAND, px, FONT } from '@/lib/brand';
import RateCalculator from './_rate-calculator';

const S = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: BRAND.blue,
    borderBottom: `3px solid ${BRAND.yellow}`,
    padding: '0 32px',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } satisfies CSSProperties,

  navLogo: {
    fontFamily: FONT.display,
    fontSize: 22,
    color: BRAND.white,
    letterSpacing: '0.02em',
    textDecoration: 'none',
  } satisfies CSSProperties,

  navCta: {
    fontFamily: FONT.pixel,
    fontSize: 9,
    color: BRAND.charcoal,
    background: BRAND.yellow,
    border: `3px solid ${BRAND.charcoal}`,
    padding: '8px 12px',
    textDecoration: 'none',
    display: 'inline-block',
    lineHeight: 1.4,
  } satisfies CSSProperties,

  hero: {
    background: `linear-gradient(180deg, #dce8fb 0%, ${BRAND.pageBed} 100%)`,
    padding: '72px 32px',
  } satisfies CSSProperties,

  heroInner: {
    maxWidth: 760,
    margin: '0 auto',
  } satisfies CSSProperties,

  heroEyebrow: {
    fontFamily: FONT.pixel,
    fontSize: 9,
    color: BRAND.charcoal,
    opacity: 0.5,
    letterSpacing: '0.08em',
    marginBottom: 20,
    display: 'block',
  } satisfies CSSProperties,

  heroH1: {
    fontFamily: FONT.display,
    fontSize: 'clamp(2rem, 5vw, 3.6rem)',
    color: BRAND.charcoal,
    textTransform: 'uppercase',
    lineHeight: 1.1,
    margin: '0 0 24px',
  } satisfies CSSProperties,

  heroSubhead: {
    fontFamily: FONT.body,
    fontSize: 18,
    color: BRAND.charcoal,
    opacity: 0.7,
    lineHeight: 1.6,
    margin: '0 0 36px',
    maxWidth: 600,
  } satisfies CSSProperties,

  heroCta: {
    fontFamily: FONT.pixel,
    fontSize: 11,
    color: BRAND.white,
    background: BRAND.blue,
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(),
    padding: '14px 20px',
    textDecoration: 'none',
    display: 'inline-block',
    lineHeight: 1.4,
  } satisfies CSSProperties,

  calculatorSection: {
    background: BRAND.pageBed,
    padding: '64px 32px',
  } satisfies CSSProperties,

  calculatorInner: {
    maxWidth: 760,
    margin: '0 auto',
  } satisfies CSSProperties,

  calcEyebrow: {
    fontFamily: FONT.pixel,
    fontSize: 9,
    color: BRAND.blue,
    letterSpacing: '0.08em',
    marginBottom: 8,
    display: 'block',
  } satisfies CSSProperties,

  calcH2: {
    fontFamily: FONT.display,
    fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
    color: BRAND.charcoal,
    textTransform: 'uppercase',
    margin: '0 0 24px',
  } satisfies CSSProperties,

  footer: {
    background: BRAND.charcoal,
    padding: '28px 32px',
    textAlign: 'center',
    fontFamily: FONT.pixel,
    fontSize: 8,
    color: BRAND.white,
    lineHeight: 1.8,
    letterSpacing: '0.06em',
  } satisfies CSSProperties,
} as const;

export default function LandingPage() {
  return (
    <>
      {/* Nav */}
      <nav style={S.nav}>
        <a href="/" style={S.navLogo}>ShippingCow</a>
        <a href="#quote" style={S.navCta}>Get My Rate →</a>
      </nav>

      {/* Hero */}
      <section style={S.hero}>
        <div style={S.heroInner}>
          <span style={S.heroEyebrow}>{'// Heavy-Item Shipping'}</span>
          <h1 style={S.heroH1}>Your 40-lb sofa ships at 40 lbs. Not 80.</h1>
          <p style={S.heroSubhead}>
            Standard carriers inflate your weight with DIM pricing — then charge you for a box that
            weighs twice as much as your sofa. ShippingCow fixes the math. You pay for what
            actually ships.
          </p>
          <a href="#quote" style={S.heroCta}>Get My Rate →</a>
        </div>
      </section>

      {/* Features placeholder */}
      <div id="features" />

      {/* Calculator section */}
      <section style={S.calculatorSection}>
        <div style={S.calculatorInner}>
          <span style={S.calcEyebrow}>{'// Estimate Your Savings'}</span>
          <h2 style={S.calcH2}>See Your Savings</h2>
          <RateCalculator />
        </div>
      </section>

      {/* Quote placeholder */}
      <div id="quote" />

      {/* Footer */}
      <footer style={S.footer}>
        © 2026 ShippingCow — Built for heavy-item sellers
      </footer>
    </>
  );
}
