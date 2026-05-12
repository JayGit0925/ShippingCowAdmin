import type { CSSProperties } from 'react';
import { BRAND, px, pxSm, FONT } from '@/lib/brand';
import RateCalculator from './_rate-calculator';
import QuoteForm from './_quote-form';

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
    boxShadow: pxSm(),
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

  featuresSection: {
    padding: '64px 24px',
    background: BRAND.white,
  } satisfies CSSProperties,

  featuresInner: {
    maxWidth: 900,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 64,
  } satisfies CSSProperties,

  featEyebrow: {
    fontFamily: FONT.pixel,
    fontSize: 9,
    color: BRAND.charcoal,
    opacity: 0.5,
    letterSpacing: '0.08em',
    marginBottom: 16,
    display: 'block',
  } satisfies CSSProperties,

  featH2: {
    fontFamily: FONT.display,
    fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
    color: BRAND.charcoal,
    textTransform: 'uppercase',
    lineHeight: 1.1,
    margin: '0 0 16px',
  } satisfies CSSProperties,

  featBody: {
    fontFamily: FONT.body,
    fontSize: 16,
    color: BRAND.charcoal,
    opacity: 0.7,
    lineHeight: 1.6,
    margin: '0 0 12px',
  } satisfies CSSProperties,

  featCard: {
    background: BRAND.pageBed,
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(),
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  } satisfies CSSProperties,

  featCardLabel: {
    fontFamily: FONT.pixel,
    fontSize: 8,
    color: BRAND.charcoal,
    opacity: 0.5,
    letterSpacing: '0.08em',
  } satisfies CSSProperties,

  featCardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } satisfies CSSProperties,

  featCardRowLabel: {
    fontFamily: FONT.body,
    fontSize: 15,
    color: BRAND.charcoal,
    opacity: 0.8,
  } satisfies CSSProperties,

  featCardDivider: {
    borderTop: `2px solid ${BRAND.charcoal}`,
    opacity: 0.15,
  } satisfies CSSProperties,

  featDark: {
    background: BRAND.charcoal,
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(),
    padding: 40,
  } satisfies CSSProperties,

  featDarkEyebrow: {
    fontFamily: FONT.pixel,
    fontSize: 9,
    color: BRAND.yellow,
    letterSpacing: '0.08em',
    marginBottom: 16,
    display: 'block',
  } satisfies CSSProperties,

  featDarkH2: {
    fontFamily: FONT.display,
    fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
    color: BRAND.white,
    textTransform: 'uppercase',
    lineHeight: 1.1,
    margin: '0 0 16px',
  } satisfies CSSProperties,

  featDarkBody: {
    fontFamily: FONT.body,
    fontSize: 16,
    color: BRAND.white,
    opacity: 0.75,
    lineHeight: 1.6,
    margin: 0,
    maxWidth: 640,
  } satisfies CSSProperties,

  eyebrow: {
    fontFamily: FONT.pixel,
    fontSize: 9,
    color: BRAND.charcoal,
    opacity: 0.5,
    letterSpacing: '0.08em',
    marginBottom: 16,
    display: 'block',
  } satisfies CSSProperties,

  sectionH2: {
    fontFamily: FONT.display,
    fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
    color: BRAND.charcoal,
    textTransform: 'uppercase',
    lineHeight: 1.1,
    margin: '0 0 16px',
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

      {/* Features */}
      <section id="features" style={S.featuresSection}>
        <div style={S.featuresInner}>

          {/* DIM ADVANTAGE */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
            <div>
              <span style={S.featEyebrow}>{'// The DIM Problem'}</span>
              <h2 style={S.featH2}>They&apos;re charging you double.</h2>
              <p style={S.featBody}>
                Standard carriers use dimensional weight pricing. A sofa that weighs 40 lbs but ships
                in a large box gets billed as 80 lbs — because the box takes up space, not because it
                weighs more.
              </p>
              <p style={S.featBody}>
                ShippingCow negotiates DIM factors built for furniture. You pay actual weight. Every
                shipment.
              </p>
            </div>
            <div style={S.featCard}>
              <span style={S.featCardLabel}>40-LB SOFA — SAME BOX</span>
              <div style={S.featCardRow}>
                <span style={S.featCardRowLabel}>Standard carrier bills</span>
                <span style={{ fontFamily: FONT.display, fontSize: 24, color: BRAND.red }}>80 lbs</span>
              </div>
              <div style={S.featCardDivider} />
              <div style={S.featCardRow}>
                <span style={S.featCardRowLabel}>ShippingCow bills</span>
                <span style={{ fontFamily: FONT.display, fontSize: 24, color: BRAND.green }}>40 lbs</span>
              </div>
            </div>
          </div>

          {/* ZONE SKIPPING */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
            <div style={S.featCard}>
              <span style={S.featCardLabel}>NYC SELLER → LA CUSTOMER</span>
              <div style={S.featCardRow}>
                <span style={S.featCardRowLabel}>Ship from NJ warehouse</span>
                <span style={{ fontFamily: FONT.display, fontSize: 20, color: BRAND.red }}>Zone 8</span>
              </div>
              <div style={S.featCardDivider} />
              <div style={S.featCardRow}>
                <span style={S.featCardRowLabel}>Ship from CA warehouse</span>
                <span style={{ fontFamily: FONT.display, fontSize: 20, color: BRAND.green }}>Zone 2</span>
              </div>
              <div style={S.featCardDivider} />
              <div style={S.featCardRow}>
                <span style={S.featCardRowLabel}>Savings per sofa</span>
                <span style={{ fontFamily: FONT.display, fontSize: 24, color: BRAND.blue }}>$18–40</span>
              </div>
            </div>
            <div>
              <span style={S.featEyebrow}>{'// Zone Skipping'}</span>
              <h2 style={S.featH2}>Closer warehouse. Lower zone. Lower bill.</h2>
              <p style={S.featBody}>
                We run CA, NJ, and TX fulfillment locations. Routing your order through the closest
                warehouse cuts 2–3 shipping zones off every label.
              </p>
              <p style={S.featBody}>
                That&apos;s $18–$40 back per sofa. On 100 units a month, you&apos;re looking at
                $1,800–$4,000 in recovered margin — every single month.
              </p>
            </div>
          </div>

          {/* NO SURPRISE FEES */}
          <div style={S.featDark}>
            <span style={S.featDarkEyebrow}>{'// No Surprise Fees'}</span>
            <h2 style={S.featDarkH2}>What you&apos;re quoted is what you pay.</h2>
            <p style={S.featDarkBody}>
              Fuel surcharges, residential delivery fees, and handling charges — all baked into your
              rate upfront. No line-item additions after the label prints. No invoice surprises at
              month&apos;s end. One number. Final.
            </p>
          </div>

        </div>
      </section>

      {/* Calculator section */}
      <section style={S.calculatorSection}>
        <div style={S.calculatorInner}>
          <span style={S.calcEyebrow}>{'// Estimate Your Savings'}</span>
          <h2 style={S.calcH2}>See Your Savings</h2>
          <RateCalculator />
        </div>
      </section>

      {/* Quote form */}
      <section id="quote" style={{ padding: '64px 24px', background: BRAND.white }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <span style={S.eyebrow}>{'// Get Exact Rates'}</span>
          <h2 style={S.sectionH2}>
            Get your actual rate.
          </h2>
          <p style={{ fontSize: 15, opacity: 0.65, marginBottom: 32, maxWidth: 520, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>
            Send us your item type, weight, and origin zip.
            We&apos;ll reply within 24 hours with your all-in rate — fuel, residential, and handling included.
          </p>
          <QuoteForm />
        </div>
      </section>

      {/* Footer */}
      <footer style={S.footer}>
        © 2026 ShippingCow — Built for heavy-item sellers
      </footer>
    </>
  );
}
