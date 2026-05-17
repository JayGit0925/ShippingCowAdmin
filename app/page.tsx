import type { CSSProperties } from 'react';
import { BRAND, px, pxSm, FONT } from '@/lib/brand';
import { PublicLayout } from '@/components/shell/public-layout';
import DimCalculator from './_dim-calculator';

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
    color: BRAND.muted,
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
    color: BRAND.muted,
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

  // === Pain ===
  // Source: homepage/shipping cow home page(1).html lines 439-453
  // CSS: .pain, .pain__inner, .pain__head, .pain__grid, .pain__card, .pain__card-icon

  painSection: {
    background: BRAND.charcoal,
    color: BRAND.white,
  } satisfies CSSProperties,

  // Zebra-stripe top/bottom borders on the pain section (repeating yellow+dark)
  painStripe: {
    display: 'block',
    height: 14,
    background: `repeating-linear-gradient(90deg, ${BRAND.yellow} 0, ${BRAND.yellow} 14px, ${BRAND.charcoal} 14px, ${BRAND.charcoal} 28px)`,
  } satisfies CSSProperties,

  painInner: {
    padding: '4rem 0',
  } satisfies CSSProperties,

  painContainer: {
    maxWidth: 1240,
    margin: '0 auto',
    padding: '0 1.5rem',
  } satisfies CSSProperties,

  painHead: {
    textAlign: 'center' as const,
    marginBottom: '3rem',
  } satisfies CSSProperties,

  painH2: {
    fontFamily: FONT.display,
    fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
    color: BRAND.white,
    textTransform: 'none' as const,
    fontWeight: 400,
  } satisfies CSSProperties,

  // Yellow accent span in the pain H2
  painH2Accent: {
    color: BRAND.yellow,
  } satisfies CSSProperties,

  painSub: {
    maxWidth: 640,
    margin: '1rem auto 0',
    color: '#cfd5df', // prototype verbatim — lighter muted on dark bg
    fontFamily: FONT.body,
    fontSize: '1rem',
  } satisfies CSSProperties,

  painGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.5rem',
  } satisfies CSSProperties,

  painCard: {
    background: '#232a38', // prototype verbatim — dark card surface
    border: `3px solid ${BRAND.yellow}`,
    padding: '1.8rem',
  } satisfies CSSProperties,

  painCardIcon: {
    width: 48,
    height: 48,
    background: BRAND.yellow,
    border: `3px solid ${BRAND.white}`,
    display: 'grid',
    placeItems: 'center' as const,
    fontFamily: FONT.pixel,
    color: BRAND.charcoal,
    fontSize: '0.9rem',
    marginBottom: '1rem',
  } satisfies CSSProperties,

  painCardH3: {
    color: BRAND.yellow,
    marginBottom: '0.6rem',
    fontFamily: FONT.display,
    textTransform: 'uppercase' as const,
    fontSize: '1.15rem',
    fontWeight: 400,
  } satisfies CSSProperties,

  painCardP: {
    color: '#cfd5df', // prototype verbatim — lighter muted on dark bg
    fontSize: '0.95rem',
    fontFamily: FONT.body,
    lineHeight: 1.6,
  } satisfies CSSProperties,

  // === Built by Operators ===
  // Source: homepage/shipping cow home page(1).html lines 681-707
  // CSS: .section, .section__head, .about-grid, .about-text, .about-art, .stat-grid, .stat-card

  operatorsSection: {
    padding: '5rem 0',
  } satisfies CSSProperties,

  sectionContainer: {
    maxWidth: 1240,
    margin: '0 auto',
    padding: '0 1.5rem',
  } satisfies CSSProperties,

  sectionHead: {
    textAlign: 'center' as const,
    maxWidth: 720,
    margin: '0 auto 2.5rem',
  } satisfies CSSProperties,

  sectionH2: {
    fontFamily: FONT.display,
    fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
    textTransform: 'none' as const,
    fontWeight: 400,
  } satisfies CSSProperties,

  // Blue accent span in section H2s
  sectionH2Accent: {
    color: BRAND.blue,
  } satisfies CSSProperties,

  sectionSubP: {
    marginTop: '0.75rem',
    color: BRAND.muted,
    fontSize: '1.05rem',
    fontFamily: FONT.body,
  } satisfies CSSProperties,

  aboutGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '3rem',
    alignItems: 'center',
    margin: '2.5rem 0',
  } satisfies CSSProperties,

  aboutTextP: {
    fontSize: '1.05rem',
    lineHeight: 1.75,
    color: BRAND.muted,
    marginBottom: '1.2rem',
    fontFamily: FONT.body,
  } satisfies CSSProperties,

  aboutArt: {
    background: BRAND.blue,
    border: `4px solid ${BRAND.charcoal}`,
    boxShadow: `6px 6px 0 ${BRAND.charcoal}`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: '1 / 1',
    padding: '2rem',
  } satisfies CSSProperties,

  aboutArtImg: {
    width: '75%',
    objectFit: 'contain' as const,
    animation: 'wiggle 2s ease-in-out infinite',
    transformOrigin: 'bottom center',
    imageRendering: 'pixelated' as const,
  } satisfies CSSProperties,

  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.5rem',
    marginTop: '2rem',
  } satisfies CSSProperties,

  statCard: {
    background: BRAND.white,
    border: `3px solid ${BRAND.charcoal}`,
    padding: '1.4rem 1rem',
    boxShadow: px(),
    textAlign: 'center' as const,
  } satisfies CSSProperties,

  statCardIcon: {
    fontSize: '1.8rem',
    marginBottom: '0.4rem',
  } satisfies CSSProperties,

  statCardNum: {
    fontFamily: FONT.display,
    fontSize: '1.2rem',
    textTransform: 'uppercase' as const,
    color: BRAND.blue,
    marginBottom: '0.2rem',
    lineHeight: 1.15,
    fontWeight: 400,
  } satisfies CSSProperties,

  statCardLbl: {
    fontSize: '0.78rem',
    color: BRAND.muted,
    fontWeight: 500,
    fontFamily: FONT.body,
  } satisfies CSSProperties,

  // === Cow-Guaranteed Promise ===
  // Source: homepage/shipping cow home page(1).html lines 708-723
  // CSS: .section--alt, .section__head, .guarantee-grid, .guarantee-card, .guarantee-corner, .guarantee-num

  guaranteeSection: {
    padding: '5rem 0',
    background: BRAND.pageBed,
  } satisfies CSSProperties,

  guaranteeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1.5rem',
    marginTop: '2.5rem',
  } satisfies CSSProperties,

  guaranteeCard: {
    background: BRAND.white,
    border: `4px solid ${BRAND.charcoal}`,
    padding: '1.8rem',
    boxShadow: px(),
    position: 'relative' as const,
    overflow: 'hidden' as const,
  } satisfies CSSProperties,

  // Yellow corner triangle (top-right) — clip-path polygon
  guaranteeCorner: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    width: 60,
    height: 60,
    background: BRAND.yellow,
    clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
  } satisfies CSSProperties,

  guaranteeNum: {
    fontFamily: FONT.pixel,
    fontSize: '0.8rem',
    color: BRAND.blue,
    marginBottom: '0.6rem',
  } satisfies CSSProperties,

  guaranteeCardH3: {
    fontFamily: FONT.display,
    fontSize: '1.25rem',
    textTransform: 'uppercase' as const,
    marginBottom: '0.6rem',
    fontWeight: 400,
  } satisfies CSSProperties,

  guaranteeCardP: {
    fontSize: '0.92rem',
    color: BRAND.muted,
    fontFamily: FONT.body,
    lineHeight: 1.6,
  } satisfies CSSProperties,

  // === Tools section ===
  // Source: homepage/shipping cow home page(1).html lines 456–563
  // CSS: .section.section--alt, .section__head, .tool-stack, .tool-card,
  //      .tool-card__info, .tool-tag, .tool-stat, .tool-card__embed

  toolsSection: {
    padding: '5rem 0',
    background: BRAND.pageBed,
  } satisfies CSSProperties,

  toolsContainer: {
    maxWidth: 1240,
    margin: '0 auto',
    padding: '0 1.5rem',
  } satisfies CSSProperties,

  toolsHead: {
    textAlign: 'center' as const,
    maxWidth: 720,
    margin: '0 auto 2.5rem',
  } satisfies CSSProperties,

  toolsH2: {
    fontFamily: FONT.display,
    fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
    textTransform: 'none' as const,
    fontWeight: 400,
  } satisfies CSSProperties,

  // Blue accent span in tools H2
  toolsH2Accent: {
    color: BRAND.blue,
  } satisfies CSSProperties,

  toolsSubP: {
    marginTop: '0.75rem',
    color: BRAND.muted,
    fontSize: '1.05rem',
    fontFamily: FONT.body,
  } satisfies CSSProperties,

  toolStack: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '3.5rem',
  } satisfies CSSProperties,

  toolCard: {
    background: BRAND.white,
    border: `4px solid ${BRAND.charcoal}`,
    boxShadow: `6px 6px 0 ${BRAND.charcoal}`,
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    overflow: 'hidden' as const,
  } satisfies CSSProperties,

  toolCardInfo: {
    padding: '2.5rem 2rem',
    borderRight: `4px solid ${BRAND.charcoal}`,
    display: 'flex',
    flexDirection: 'column' as const,
  } satisfies CSSProperties,

  toolTag: {
    fontFamily: FONT.pixel,
    fontSize: '0.6rem',
    color: BRAND.blue,
    border: `2px solid ${BRAND.blue}`,
    display: 'inline-block',
    padding: '0.3rem 0.55rem',
    marginBottom: '1rem',
  } satisfies CSSProperties,

  toolCardH3: {
    fontFamily: FONT.display,
    fontSize: '1.5rem',
    textTransform: 'uppercase' as const,
    marginBottom: '0.75rem',
    lineHeight: 1.1,
    fontWeight: 400,
  } satisfies CSSProperties,

  toolCardP: {
    color: BRAND.muted,
    fontSize: '0.97rem',
    lineHeight: 1.65,
    marginBottom: '1.5rem',
    fontFamily: FONT.body,
  } satisfies CSSProperties,

  toolStat: {
    marginTop: 'auto',
    background: BRAND.charcoal,
    color: BRAND.yellow,
    padding: '0.85rem 1rem',
    fontFamily: FONT.pixel,
    fontSize: '0.58rem',
    lineHeight: 1.8,
  } satisfies CSSProperties,

  toolCardEmbed: {
    padding: '2rem 2.5rem',
    background: BRAND.pageBed,
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

      {/* === B.3 Pain Points (homepage port) === */}
      {/* Source: homepage/shipping cow home page(1).html lines 439-453 */}
      <section style={S.painSection}>
        <span style={S.painStripe} aria-hidden="true" />
        <div style={S.painInner}>
          <div style={S.painContainer}>
            <div style={S.painHead}>
              <h2 style={S.painH2}>
                The Three Things <span style={S.painH2Accent}>Killing</span> Your Heavy-Goods Margins
              </h2>
              <p style={S.painSub}>
                You&rsquo;re losing $28K/year to DIM weight guessing, carrier fees, and paperwork you never signed up for. We fixed that.
              </p>
            </div>
            <div style={S.painGrid}>
              <div style={S.painCard}>
                <div style={S.painCardIcon} aria-hidden="true">$</div>
                <h3 style={S.painCardH3}>DIM Weight Death Spiral</h3>
                <p style={S.painCardP}>You&rsquo;re paying for air. Our 3D Packaging Optimizer kills overcharge before it starts — average merchant saves $0.85–$2.40 per shipment on DIM alone.</p>
              </div>
              <div style={S.painCard}>
                <div style={S.painCardIcon} aria-hidden="true">⚖</div>
                <h3 style={S.painCardH3}>No Carrier Leverage?</h3>
                <p style={S.painCardP}>We pool volume across our entire merchant herd. You get FedEx enterprise rates without enterprise volume — up to 80% off published rates.</p>
              </div>
              <div style={S.painCard}>
                <div style={S.painCardIcon} aria-hidden="true">📝</div>
                <h3 style={S.painCardH3}>Drowning in Paperwork?</h3>
                <p style={S.painCardP}>Bills of Lading. Customs filings. ISF 10+2. Our AI Copilot handles it all autonomously — 85%+ of your paperwork, done before you ask.</p>
              </div>
            </div>
          </div>
        </div>
        <span style={S.painStripe} aria-hidden="true" />
      </section>

      {/* === B.6 Built by Operators (homepage port) === */}
      {/* Source: homepage/shipping cow home page(1).html lines 681-707 */}
      <section style={S.operatorsSection} id="who-we-are">
        <div style={S.sectionContainer}>
          <div style={S.sectionHead}>
            <h2 style={S.sectionH2}>
              Built by Operators. <span style={S.sectionH2Accent}>Engineered for Heavy Goods.</span>
            </h2>
            <p style={S.sectionSubP}>We are a self-managed, self-operated 3PL — specialized exclusively in 50lb+ big and bulky parcels.</p>
          </div>
          <div style={S.aboutGrid}>
            <div>
              <p style={S.aboutTextP}>We oversee our NJ, CA, and TX fulfillment centers — over 300,000 sq ft of heavy-goods warehouse space. Every shipment runs through our AI-driven route optimization engine, and every rate we offer is backed by our direct carrier contracts.</p>
              <p style={S.aboutTextP}>No brokers. No surprises. Just the most competitive rates and reliable transit times in the industry.</p>
            </div>
            <div style={S.aboutArt}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/warehouse-illustration.png"
                alt="ShippingCow warehouse illustration showing fulfillment operations"
                style={S.aboutArtImg}
              />
            </div>
          </div>
          <div style={S.statGrid}>
            <div style={S.statCard}>
              <div style={S.statCardIcon} aria-hidden="true">📦</div>
              <div style={S.statCardNum}>300K+ sq ft</div>
              <div style={S.statCardLbl}>Heavy-Goods Warehouse Space</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statCardIcon} aria-hidden="true">🏭</div>
              <div style={S.statCardNum}>3 Strategic Warehouses</div>
              <div style={S.statCardLbl}>NJ · CA · TX</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statCardIcon} aria-hidden="true">🤖</div>
              <div style={S.statCardNum}>AI Route Optimization</div>
              <div style={S.statCardLbl}>Every Shipment, Every Time</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statCardIcon} aria-hidden="true">💰</div>
              <div style={S.statCardNum}>$1,500+/mo</div>
              <div style={S.statCardLbl}>Avg. Merchant Savings</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statCardIcon} aria-hidden="true">📉</div>
              <div style={S.statCardNum}>80% Off</div>
              <div style={S.statCardLbl}>FedEx Published Rates</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statCardIcon} aria-hidden="true">✅</div>
              <div style={S.statCardNum}>99.2%</div>
              <div style={S.statCardLbl}>2-Day SLA Attained</div>
            </div>
          </div>
        </div>
      </section>

      {/* === B.7 Cow-Guaranteed Promise (homepage port) === */}
      {/* Source: homepage/shipping cow home page(1).html lines 708-723 */}
      <section style={S.guaranteeSection} id="cow-guaranteed">
        <div style={S.sectionContainer}>
          <div style={S.sectionHead}>
            <h2 style={S.sectionH2}>
              The <span style={S.sectionH2Accent}>Cow-Guaranteed</span> Promise
            </h2>
            <p style={S.sectionSubP}>Most 3PLs bury a &ldquo;shrinkage allowance&rdquo; clause in their contract — that&rsquo;s them telling you they&rsquo;ll lose your stuff and you&rsquo;ll pay for it. We don&rsquo;t do that.</p>
          </div>
          <div style={S.guaranteeGrid}>
            <div style={S.guaranteeCard}>
              <div style={S.guaranteeCorner} aria-hidden="true" />
              <div style={S.guaranteeNum}>01</div>
              <h3 style={S.guaranteeCardH3}>Zero Shrinkage. Or We Pay.</h3>
              <p style={S.guaranteeCardP}>Industry average loss is 2–4%. Our rate? Zero. If we lose or damage your inventory, we cover the wholesale cost. No excuses, no clauses.</p>
            </div>
            <div style={S.guaranteeCard}>
              <div style={S.guaranteeCorner} aria-hidden="true" />
              <div style={S.guaranteeNum}>02</div>
              <h3 style={S.guaranteeCardH3}>2-Day Delivery. Guaranteed.</h3>
              <p style={S.guaranteeCardP}>Every destination ZIP we serve is injected at Zone ≤ 4. If we miss your SLA, we make it right. Fast shipping isn&rsquo;t optional — it&rsquo;s in the contract.</p>
            </div>
            <div style={S.guaranteeCard}>
              <div style={S.guaranteeCorner} aria-hidden="true" />
              <div style={S.guaranteeNum}>03</div>
              <h3 style={S.guaranteeCardH3}>Dock to Stock in 48 Hours.</h3>
              <p style={S.guaranteeCardP}>We receive all inbound shipments within 2 business days. Your inventory goes live fast so you can sell, not wait.</p>
            </div>
            <div style={S.guaranteeCard}>
              <div style={S.guaranteeCorner} aria-hidden="true" />
              <div style={S.guaranteeNum}>04</div>
              <h3 style={S.guaranteeCardH3}>100% Order Accuracy. Or $50 Says We&rsquo;re Sorry.</h3>
              <p style={S.guaranteeCardP}>Wrong item ships? We pay you $50 per error and reship correctly. Immediately. No ticket queue, no excuses.</p>
            </div>
          </div>
        </div>
      </section>

      {/* === B.4 Tools Section (homepage port) === */}
      {/* Source: homepage/shipping cow home page(1).html lines 456–563 */}
      <section style={S.toolsSection} id="tools">
        <div style={S.toolsContainer}>
          <div style={S.toolsHead}>
            <h2 style={S.toolsH2}>
              See Your Savings{' '}
              <span style={S.toolsH2Accent}>Before You Sign Anything</span>
            </h2>
            <p style={S.toolsSubP}>
              Run the numbers yourself. Three tools, real data, zero obligation.
            </p>
          </div>

          <div style={S.toolStack}>

            {/* ===== TOOL 01: DIM Weight Calculator ===== */}
            <div style={S.toolCard}>
              {/* Left info column — server-rendered */}
              <div style={S.toolCardInfo}>
                <div style={S.toolTag}>TOOL 01</div>
                <h3 style={S.toolCardH3}>DIM Weight Savings Calculator</h3>
                <p style={S.toolCardP}>
                  See exactly how much DIM 225 saves you vs FedEx/UPS standard pricing.
                  Enter your dimensions and monthly volume to see billable weight reduction
                  and annual savings.
                </p>
                <div style={S.toolStat}>
                  AVG MERCHANT SAVES<br />
                  $0.85–$2.40 PER SHIPMENT<br />
                  ON DIM WEIGHT ALONE
                </div>
              </div>
              {/* Right embed column — client leaf */}
              <div style={S.toolCardEmbed}>
                <DimCalculator />
              </div>
            </div>

            {/* TODO: US map (TOOL 02) deferred from WS B */}

            {/* TODO: T5 ports Shrinkage Calculator (TOOL 03) */}

          </div>
        </div>
      </section>

    </PublicLayout>
  );
}
