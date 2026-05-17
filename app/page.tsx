import type { CSSProperties } from 'react';
import { BRAND, px, pxSm, FONT } from '@/lib/brand';
import { PublicLayout } from '@/components/shell/public-layout';

// === Hero (homepage port) ===
// Source: homepage/shipping cow home page(1).html lines 406-438
// CSS rules lifted from prototype <style> block (lines 113-148).
// Animated cow: @keyframes wiggle defined in app/globals.css (can't define
// keyframes in a style prop; globals.css is the right place for server components).

const S = {
  // --- Hero section ---
  hero: {
    padding: '4rem 0 5rem',
    background: [
      'linear-gradient(rgba(0,82,201,.04) 1px, transparent 1px)',
      'linear-gradient(90deg, rgba(0,82,201,.04) 1px, transparent 1px)',
      'linear-gradient(180deg, #EAF0FC 0%, #FFFFFF 100%)',
    ].join(', '),
    backgroundSize: '20px 20px, 20px 20px, 100% 100%',
    overflow: 'hidden',
  } satisfies CSSProperties,

  heroContainer: {
    maxWidth: 1240,
    margin: '0 auto',
    padding: '0 1.5rem',
  } satisfies CSSProperties,

  heroGrid: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 1fr',
    gap: '3rem',
    alignItems: 'center',
  } satisfies CSSProperties,

  // --- Left copy column ---
  heroEyebrow: {
    display: 'inline-block',
    fontFamily: FONT.pixel,
    fontSize: '0.65rem',
    background: BRAND.yellow,
    color: BRAND.charcoal,
    padding: '0.5rem 0.9rem',
    border: `3px solid ${BRAND.charcoal}`,
    marginBottom: '1.4rem',
    boxShadow: pxSm(),
  } satisfies CSSProperties,

  heroH1: {
    fontFamily: FONT.display,
    fontSize: 'clamp(2.2rem, 5.5vw, 4.2rem)',
    lineHeight: 1.05,
    textTransform: 'none' as const,
    marginBottom: '1.2rem',
    fontWeight: 400,
  } satisfies CSSProperties,

  // H1 accent: blue text span
  heroAccent: {
    color: BRAND.blue,
  } satisfies CSSProperties,

  // H1 mark: yellow highlighted span
  heroMark: {
    background: BRAND.yellow,
    padding: '0 0.4rem',
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: pxSm(),
    display: 'inline-block',
    transform: 'rotate(-1deg)',
  } satisfies CSSProperties,

  heroSub: {
    fontSize: '1.1rem',
    color: '#3a4454',
    marginBottom: '1.8rem',
    maxWidth: 560,
    lineHeight: 1.6,
    fontFamily: FONT.body,
  } satisfies CSSProperties,

  heroCtas: {
    marginBottom: '2rem',
  } satisfies CSSProperties,

  // Primary CTA button
  heroBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.9rem 1.6rem',
    fontFamily: FONT.display,
    fontSize: '1.05rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    border: `3px solid ${BRAND.charcoal}`,
    background: BRAND.yellow,
    color: BRAND.charcoal,
    boxShadow: px(),
    textDecoration: 'none',
  } satisfies CSSProperties,

  // Trust checkmarks row
  heroTrust: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem 1.5rem',
    fontSize: '0.9rem',
    fontWeight: 500,
    fontFamily: FONT.body,
  } satisfies CSSProperties,

  // Blue check mark (✓) within each trust item
  heroTrustCheck: {
    color: BRAND.blue,
    fontWeight: 700,
  } satisfies CSSProperties,

  // "Already a customer?" note
  heroNote: {
    marginTop: '1rem',
    fontSize: '0.88rem',
    color: '#3a4454',
    fontFamily: FONT.body,
  } satisfies CSSProperties,

  heroNoteLink: {
    color: BRAND.blue,
    fontWeight: 700,
    textDecoration: 'underline',
  } satisfies CSSProperties,

  // --- Right art column ---
  heroArt: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 380,
  } satisfies CSSProperties,

  // Blue framed box with grid background
  heroArtFrame: {
    width: '100%',
    maxWidth: 420,
    aspectRatio: '1 / 1',
    background: BRAND.blue,
    border: `4px solid ${BRAND.charcoal}`,
    boxShadow: `6px 6px 0 ${BRAND.charcoal}`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1rem',
    position: 'relative' as const,
    // Subtle white grid lines over the blue background
    backgroundImage: [
      'linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px)',
      'linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)',
    ].join(', '),
    backgroundSize: '16px 16px',
  } satisfies CSSProperties,

  // Cow image — wiggle keyframe defined in globals.css
  heroCow: {
    width: '82%',
    objectFit: 'contain' as const,
    animation: 'wiggle 2s ease-in-out infinite',
    transformOrigin: 'bottom center',
    imageRendering: 'pixelated' as const,
  } satisfies CSSProperties,

  // Floating badge — top-right (yellow, rotated)
  heroBadgeTop: {
    position: 'absolute' as const,
    top: -14,
    right: -10,
    transform: 'rotate(6deg)',
    fontFamily: FONT.pixel,
    fontSize: '0.58rem',
    background: BRAND.yellow,
    color: BRAND.charcoal,
    padding: '0.6rem 0.8rem',
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: pxSm(),
    lineHeight: 1.4,
    textAlign: 'center' as const,
  } satisfies CSSProperties,

  // Floating badge — bottom-left (white, rotated opposite)
  heroBadgeBottom: {
    position: 'absolute' as const,
    bottom: -14,
    left: -12,
    transform: 'rotate(-5deg)',
    fontFamily: FONT.pixel,
    fontSize: '0.58rem',
    background: BRAND.white,
    color: BRAND.charcoal,
    padding: '0.6rem 0.8rem',
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: pxSm(),
    lineHeight: 1.4,
    textAlign: 'center' as const,
  } satisfies CSSProperties,
} as const;

export default function HomePage() {
  return (
    <PublicLayout currentPath="/">

      {/* === Hero (homepage port) === */}
      <section style={S.hero} id="home">
        <div style={S.heroContainer}>
          <div style={S.heroGrid}>

            {/* LEFT — copy */}
            <div>
              <span style={S.heroEyebrow}>★ AI SMART SHIPPING PLATFORM · EST. 2026</span>

              <h1 style={S.heroH1}>
                <span style={S.heroAccent}>Moo-ve</span> Your Heavy Goods Without Getting{' '}
                <span style={S.heroMark}>Milked</span> on Shipping Costs
              </h1>

              <p style={S.heroSub}>
                Shipping Cow AI is the only AI Smart Shipping Platform built for the 50 lb+ seller.
                Enterprise carrier rates. AI-powered routing. Zero DIM weight surprises. We make
                heavy e-commerce finally profitable.
              </p>

              <div style={S.heroCtas}>
                <a href="#inquiry" style={S.heroBtn}>Get My Free Shipping Audit NOW</a>
              </div>

              {/* 4 trust checkmarks */}
              <div style={S.heroTrust}>
                <span><span style={S.heroTrustCheck}>✓</span> Up to 80% off FedEx Rates</span>
                <span><span style={S.heroTrustCheck}>✓</span> 2-Day Delivery Guarantee</span>
                <span><span style={S.heroTrustCheck}>✓</span> Zero Shrinkage Promise</span>
                <span><span style={S.heroTrustCheck}>✓</span> AI-Powered Back Office</span>
              </div>

              <p style={S.heroNote}>
                Already a customer?{' '}
                <a href="/login" style={S.heroNoteLink}>Log in</a> to your dashboard.
              </p>
            </div>

            {/* RIGHT — animated cow visual in blue framed box with floating badges */}
            <div style={S.heroArt}>
              <div style={S.heroArtFrame}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/cow-pixel.png"
                  alt="ShippingCow pixel-art cow mascot"
                  style={S.heroCow}
                />
                {/* Floating badge — top-right */}
                <div style={S.heroBadgeTop}>NO BULL<br />PRICING</div>
                {/* Floating badge — bottom-left */}
                <div style={S.heroBadgeBottom}>★ $1.5K+/MO<br />SAVINGS</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* TODO: T3+ ports sections 2-9 */}

    </PublicLayout>
  );
}
