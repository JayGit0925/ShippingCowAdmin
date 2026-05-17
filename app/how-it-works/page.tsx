import type { CSSProperties } from 'react';
import { BRAND, px, pxSm, FONT } from '@/lib/brand';
import { PublicLayout } from '@/components/shell/public-layout';

export const metadata = {
  title: 'How it Works — ShippingCow',
  description:
    'Dim factor 225, 3-warehouse zone skipping, and 6:30 AM insights. Built for 50–149lb items.',
};

// ── Browser-frame chrome (mockup-only; not part of the brand palette) ────────
const FRAME_DARK_1 = '#1a2540'; // chrome bg
const FRAME_DARK_2 = '#2a3a5c'; // chrome border
const FRAME_DARK_3 = '#223458'; // chrome accent

const S = {
  // --- silo-section ---
  silo: {
    background: BRAND.pageBed,
    padding: '80px 32px',
  } satisfies CSSProperties,

  siloInner: {
    maxWidth: 1100,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 64,
    alignItems: 'center',
  } satisfies CSSProperties,

  siloTag: {
    fontFamily: FONT.pixel,
    fontSize: 8,
    color: BRAND.white,
    background: BRAND.blue,
    border: `2px solid ${BRAND.charcoal}`,
    boxShadow: pxSm(),
    padding: '5px 10px',
    letterSpacing: '0.06em',
    display: 'inline-block',
    marginBottom: 20,
    textTransform: 'uppercase' as const,
  } satisfies CSSProperties,

  siloH2: {
    fontFamily: FONT.display,
    fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
    textTransform: 'uppercase' as const,
    margin: '0 0 16px',
    lineHeight: 1.1,
    color: BRAND.charcoal,
  } satisfies CSSProperties,

  siloH2Accent: {
    color: BRAND.blue,
  } satisfies CSSProperties,

  siloPara: {
    fontFamily: FONT.body,
    fontSize: 16,
    color: BRAND.charcoal,
    lineHeight: 1.8,
    margin: '0 0 24px',
    maxWidth: 480,
    opacity: 0.8,
  } satisfies CSSProperties,

  siloBullets: {
    listStyle: 'none',
    margin: '0 0 28px',
    padding: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  } satisfies CSSProperties,

  siloBulletItem: {
    fontFamily: FONT.body,
    fontSize: 14.5,
    color: BRAND.charcoal,
    lineHeight: 1.55,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
  } satisfies CSSProperties,

  siloBulletDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: BRAND.blue,
    flexShrink: 0,
    marginTop: 5,
  } satisfies CSSProperties,

  siloStatBox: {
    background: BRAND.yellow,
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(),
    padding: '18px 22px',
    display: 'inline-block',
  } satisfies CSSProperties,

  siloStatNum: {
    fontFamily: FONT.display,
    fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
    color: BRAND.charcoal,
    textTransform: 'uppercase' as const,
    display: 'block',
    lineHeight: 1,
  } satisfies CSSProperties,

  siloStatLabel: {
    fontFamily: FONT.body,
    fontSize: 13,
    color: BRAND.charcoal,
    lineHeight: 1.5,
    marginTop: 6,
    display: 'block',
    maxWidth: 260,
  } satisfies CSSProperties,

  // Dim comparison cards (right column of silo)
  dimCompareWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  } satisfies CSSProperties,

  dimCompareLabel: {
    fontFamily: FONT.pixel,
    fontSize: 7,
    color: BRAND.charcoal,
    opacity: 0.55,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    marginBottom: 8,
    display: 'block',
  } satisfies CSSProperties,

  dimCard: {
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(),
    overflow: 'hidden',
  } satisfies CSSProperties,

  dimCardHeader: {
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } satisfies CSSProperties,

  dimCardHeaderYellow: {
    background: BRAND.yellow,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } satisfies CSSProperties,

  dimCardHeaderCharcoal: {
    background: BRAND.charcoal,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } satisfies CSSProperties,

  dimCardName: {
    fontFamily: FONT.display,
    fontSize: 14,
    color: BRAND.charcoal,
    textTransform: 'uppercase' as const,
  } satisfies CSSProperties,

  dimCardNameLight: {
    fontFamily: FONT.display,
    fontSize: 14,
    color: BRAND.white,
    textTransform: 'uppercase' as const,
  } satisfies CSSProperties,

  dimCardBadge: {
    fontFamily: FONT.pixel,
    fontSize: 7,
    color: BRAND.white,
    background: BRAND.red,
    padding: '4px 8px',
    letterSpacing: '0.04em',
  } satisfies CSSProperties,

  dimCardBadgeGreen: {
    fontFamily: FONT.pixel,
    fontSize: 7,
    color: BRAND.white,
    background: BRAND.green,
    padding: '4px 8px',
    letterSpacing: '0.04em',
  } satisfies CSSProperties,

  dimCardBody: {
    background: BRAND.white,
    padding: '14px 16px',
  } satisfies CSSProperties,

  dimCardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  } satisfies CSSProperties,

  dimCardRowKey: {
    fontFamily: FONT.body,
    fontSize: 13,
    color: BRAND.charcoal,
    opacity: 0.65,
  } satisfies CSSProperties,

  dimCardRowVal: {
    fontFamily: FONT.display,
    fontSize: 16,
    color: BRAND.charcoal,
    textTransform: 'uppercase' as const,
  } satisfies CSSProperties,

  dimCardRowValAccent: {
    fontFamily: FONT.display,
    fontSize: 16,
    color: BRAND.blue,
    textTransform: 'uppercase' as const,
  } satisfies CSSProperties,

  dimCardDelta: {
    fontFamily: FONT.pixel,
    fontSize: 7.5,
    color: BRAND.green,
    letterSpacing: '0.04em',
    display: 'block',
    marginTop: 4,
  } satisfies CSSProperties,

  // Zone map placeholder
  zoneMapWrap: {
    background: BRAND.white,
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(),
    padding: '20px',
    marginTop: 12,
  } satisfies CSSProperties,

  zoneMapTitle: {
    fontFamily: FONT.pixel,
    fontSize: 7,
    color: BRAND.charcoal,
    opacity: 0.55,
    letterSpacing: '0.06em',
    display: 'block',
    marginBottom: 12,
  } satisfies CSSProperties,

  zoneMapDots: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
  } satisfies CSSProperties,

  warehouseDot: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 6,
  } satisfies CSSProperties,

  warehouseDotCircle: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: BRAND.blue,
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: pxSm(),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } satisfies CSSProperties,

  warehouseDotLabel: {
    fontFamily: FONT.pixel,
    fontSize: 6.5,
    color: BRAND.charcoal,
    opacity: 0.65,
    letterSpacing: '0.04em',
    textAlign: 'center' as const,
  } satisfies CSSProperties,

  warehouseDotIcon: {
    fontFamily: FONT.pixel,
    fontSize: 8,
    color: BRAND.white,
  } satisfies CSSProperties,

  zoneArrow: {
    fontFamily: FONT.pixel,
    fontSize: 10,
    color: BRAND.charcoal,
    opacity: 0.3,
  } satisfies CSSProperties,

  // --- hiw-section ---
  hiw: {
    background: BRAND.charcoal,
    padding: '80px 32px',
  } satisfies CSSProperties,

  hiwInner: {
    maxWidth: 1100,
    margin: '0 auto',
  } satisfies CSSProperties,

  hiwHeader: {
    textAlign: 'center' as const,
    marginBottom: 56,
  } satisfies CSSProperties,

  hiwEyebrow: {
    fontFamily: FONT.pixel,
    fontSize: 8,
    color: BRAND.white,
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.3)',
    padding: '5px 10px',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    display: 'inline-block',
    marginBottom: 20,
  } satisfies CSSProperties,

  hiwH2: {
    fontFamily: FONT.display,
    fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
    textTransform: 'uppercase' as const,
    color: BRAND.white,
    margin: '0 0 12px',
    lineHeight: 1.1,
  } satisfies CSSProperties,

  hiwH2Accent: {
    color: BRAND.yellow,
  } satisfies CSSProperties,

  hiwSubPara: {
    fontFamily: FONT.body,
    fontSize: 16,
    color: 'rgba(255,255,255,0.65)',
    maxWidth: 520,
    margin: '0 auto',
    lineHeight: 1.65,
  } satisfies CSSProperties,

  hiwSteps: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 24,
  } satisfies CSSProperties,

  hiwStep: {
    background: FRAME_DARK_3,
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(BRAND.blue),
    padding: '28px 24px',
  } satisfies CSSProperties,

  hiwStepNum: {
    fontFamily: FONT.display,
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    color: BRAND.yellow,
    display: 'block',
    marginBottom: 12,
    lineHeight: 1,
  } satisfies CSSProperties,

  hiwStepH: {
    fontFamily: FONT.display,
    fontSize: 18,
    color: BRAND.white,
    textTransform: 'uppercase' as const,
    margin: '0 0 10px',
    lineHeight: 1.2,
  } satisfies CSSProperties,

  hiwStepP: {
    fontFamily: FONT.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.65,
    margin: 0,
  } satisfies CSSProperties,

  hiwStepConnector: {
    fontFamily: FONT.pixel,
    fontSize: 10,
    color: BRAND.yellow,
    opacity: 0.4,
    textAlign: 'center' as const,
    alignSelf: 'center',
    marginTop: -8,
  } satisfies CSSProperties,

  hiwCta: {
    textAlign: 'center' as const,
    marginTop: 48,
  } satisfies CSSProperties,

  hiwCtaBtn: {
    fontFamily: FONT.pixel,
    fontSize: 9,
    color: BRAND.charcoal,
    background: BRAND.yellow,
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(),
    padding: '14px 24px',
    textDecoration: 'none',
    display: 'inline-block',
    lineHeight: 1.4,
    letterSpacing: '0.02em',
  } satisfies CSSProperties,

  // --- insight-section ---
  insight: {
    background: BRAND.white,
    padding: '80px 32px',
  } satisfies CSSProperties,

  insightInner: {
    maxWidth: 1100,
    margin: '0 auto',
  } satisfies CSSProperties,

  insightEyebrow: {
    fontFamily: FONT.pixel,
    fontSize: 9,
    color: BRAND.charcoal,
    opacity: 0.5,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    display: 'block',
    textAlign: 'center' as const,
    marginBottom: 12,
  } satisfies CSSProperties,

  insightH2: {
    fontFamily: FONT.display,
    fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
    color: BRAND.charcoal,
    textTransform: 'uppercase' as const,
    textAlign: 'center' as const,
    margin: '0 0 12px',
    lineHeight: 1.1,
  } satisfies CSSProperties,

  insightH2Accent: {
    color: BRAND.blue,
  } satisfies CSSProperties,

  insightPara: {
    fontFamily: FONT.body,
    fontSize: 16,
    color: BRAND.charcoal,
    opacity: 0.65,
    textAlign: 'center' as const,
    maxWidth: 580,
    margin: '0 auto 48px',
    lineHeight: 1.75,
  } satisfies CSSProperties,

  insightGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 24,
    marginBottom: 40,
  } satisfies CSSProperties,

  insightCard: {
    background: BRAND.white,
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(),
    padding: '24px',
  } satisfies CSSProperties,

  insightCardMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap' as const,
    gap: 8,
  } satisfies CSSProperties,

  insightTypeTip: {
    fontFamily: FONT.pixel,
    fontSize: 7,
    color: BRAND.green,
    background: `${BRAND.green}20`,
    border: `1px solid ${BRAND.green}`,
    padding: '3px 8px',
    letterSpacing: '0.05em',
  } satisfies CSSProperties,

  insightTypeCritical: {
    fontFamily: FONT.pixel,
    fontSize: 7,
    color: BRAND.red,
    background: `${BRAND.red}20`,
    border: `1px solid ${BRAND.red}`,
    padding: '3px 8px',
    letterSpacing: '0.05em',
  } satisfies CSSProperties,

  insightBadge: {
    fontFamily: FONT.display,
    fontSize: 16,
    color: BRAND.charcoal,
    textTransform: 'uppercase' as const,
  } satisfies CSSProperties,

  insightCardH: {
    fontFamily: FONT.display,
    fontSize: 'clamp(1rem, 1.5vw, 1.2rem)',
    color: BRAND.charcoal,
    textTransform: 'uppercase' as const,
    margin: '0 0 10px',
    lineHeight: 1.25,
  } satisfies CSSProperties,

  insightCardBody: {
    fontFamily: FONT.body,
    fontSize: 13.5,
    color: BRAND.charcoal,
    lineHeight: 1.65,
    margin: '0 0 14px',
    opacity: 0.8,
  } satisfies CSSProperties,

  insightCallout: {
    background: BRAND.pageBed,
    border: `2px solid ${BRAND.charcoal}`,
    padding: '12px 14px',
    fontFamily: FONT.body,
    fontSize: 13,
    color: BRAND.charcoal,
    lineHeight: 1.6,
  } satisfies CSSProperties,

  // Browser frame for insight screenshot
  insightBrowserWrap: {
    maxWidth: 900,
    margin: '0 auto',
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(),
    overflow: 'hidden',
    background: FRAME_DARK_1,
  } satisfies CSSProperties,

  insightBrowserBar: {
    background: FRAME_DARK_2,
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    borderBottom: `2px solid ${BRAND.charcoal}`,
  } satisfies CSSProperties,

  insightBrowserDots: {
    display: 'flex',
    gap: 5,
  } satisfies CSSProperties,

  insightBrowserDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
  } satisfies CSSProperties,

  insightBrowserUrl: {
    fontFamily: FONT.pixel,
    fontSize: 6,
    color: BRAND.sky,
    opacity: 0.7,
    letterSpacing: '0.04em',
  } satisfies CSSProperties,

  insightBrowserContent: {
    padding: '28px',
    minHeight: 220,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  } satisfies CSSProperties,

  insightBrowserRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    background: FRAME_DARK_3,
    border: `1px solid ${BRAND.blue}`,
    padding: '12px 14px',
  } satisfies CSSProperties,

  insightBrowserRowIcon: {
    fontFamily: FONT.pixel,
    fontSize: 10,
    color: BRAND.yellow,
    flexShrink: 0,
    marginTop: 2,
  } satisfies CSSProperties,

  insightBrowserRowText: {
    fontFamily: FONT.body,
    fontSize: 13,
    color: BRAND.white,
    lineHeight: 1.55,
    opacity: 0.9,
  } satisfies CSSProperties,

  insightBrowserRowTextAccent: {
    color: BRAND.yellow,
    fontWeight: 700,
  } satisfies CSSProperties,

  insightBrowserMooovyLabel: {
    fontFamily: FONT.pixel,
    fontSize: 6,
    color: BRAND.sky,
    opacity: 0.6,
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: 4,
  } satisfies CSSProperties,
} as const;

export default function HowItWorksPage() {
  return (
    <PublicLayout currentPath="/how-it-works">

      {/* ── Silo Section: Why dim factor 225 matters ──────────────────────────── */}
      <section style={S.silo}>
        <div style={S.siloInner}>

          {/* LEFT COPY */}
          <div>
            <span style={S.siloTag}>Dim Factor 225</span>

            <h2 style={S.siloH2}>
              Why 225 Changes<br />
              <span style={S.siloH2Accent}>Everything.</span>
            </h2>

            <p style={S.siloPara}>
              The industry standard dim factor is 166 — meaning carriers charge you as if your
              60lb item weighs more than it does. We use 225. That single number saves our
              sellers <strong>~$14/order on a 60lb item</strong>. It compounds fast.
            </p>

            <ul style={S.siloBullets}>
              <li style={S.siloBulletItem}>
                <span style={S.siloBulletDot} />
                <span>Dim factor 225 vs industry 166 — built for heavy, not penalized by it</span>
              </li>
              <li style={S.siloBulletItem}>
                <span style={S.siloBulletDot} />
                <span>Zone skipping via 3-warehouse inventory placement — average zone drops from 8 → 4</span>
              </li>
              <li style={S.siloBulletItem}>
                <span style={S.siloBulletDot} />
                <span>Last-mile contract labels — use our negotiated carrier rates to generate label income</span>
              </li>
              <li style={S.siloBulletItem}>
                <span style={S.siloBulletDot} />
                <span>Real-time dashboard — no black-box invoicing, full cost visibility per SKU</span>
              </li>
            </ul>

            <div style={S.siloStatBox}>
              <span style={S.siloStatNum}>~$14/order</span>
              <span style={S.siloStatLabel}>
                Saved on a 60lb item vs typical dim factor 166 — before zone skipping
              </span>
            </div>
          </div>

          {/* RIGHT SIDE: dim comparison + zone map */}
          <div style={S.dimCompareWrap}>
            <span style={S.dimCompareLabel}>Dim factor comparison — 60lb item, 18×18×18 box</span>

            {/* Competitor card */}
            <div style={S.dimCard}>
              <div style={S.dimCardHeaderCharcoal}>
                <span style={S.dimCardNameLight}>ShipBob / Industry Standard</span>
                <span style={S.dimCardBadge}>DIM 166</span>
              </div>
              <div style={S.dimCardBody}>
                <div style={S.dimCardRow}>
                  <span style={S.dimCardRowKey}>Actual weight</span>
                  <span style={S.dimCardRowVal}>60 lb</span>
                </div>
                <div style={S.dimCardRow}>
                  <span style={S.dimCardRowKey}>Billable DIM weight</span>
                  <span style={S.dimCardRowVal}>71.1 lb</span>
                </div>
                <div style={S.dimCardRow}>
                  <span style={S.dimCardRowKey}>You pay on</span>
                  <span style={S.dimCardRowVal}>71.1 lb</span>
                </div>
              </div>
            </div>

            {/* ShippingCow card */}
            <div style={S.dimCard}>
              <div style={S.dimCardHeaderYellow}>
                <span style={S.dimCardName}>ShippingCow.ai</span>
                <span style={S.dimCardBadgeGreen}>DIM 225</span>
              </div>
              <div style={S.dimCardBody}>
                <div style={S.dimCardRow}>
                  <span style={S.dimCardRowKey}>Actual weight</span>
                  <span style={S.dimCardRowVal}>60 lb</span>
                </div>
                <div style={S.dimCardRow}>
                  <span style={S.dimCardRowKey}>Billable DIM weight</span>
                  <span style={S.dimCardRowValAccent}>52.5 lb</span>
                </div>
                <div style={S.dimCardRow}>
                  <span style={S.dimCardRowKey}>You pay on</span>
                  <span style={S.dimCardRowValAccent}>60 lb</span>
                </div>
                <span style={S.dimCardDelta}>↓ ~$14 saved per order vs DIM 166</span>
              </div>
            </div>

            {/* 3-warehouse zone map */}
            <div style={S.zoneMapWrap}>
              <span style={S.zoneMapTitle}>3-warehouse zone skipping — avg zone 8 → 4</span>
              <div style={S.zoneMapDots}>
                <div style={S.warehouseDot}>
                  <div style={S.warehouseDotCircle}>
                    <span style={S.warehouseDotIcon}>W</span>
                  </div>
                  <span style={S.warehouseDotLabel}>West<br />LA / PHX</span>
                </div>
                <span style={S.zoneArrow}>→→→</span>
                <div style={S.warehouseDot}>
                  <div style={S.warehouseDotCircle}>
                    <span style={S.warehouseDotIcon}>C</span>
                  </div>
                  <span style={S.warehouseDotLabel}>Central<br />DAL / CHI</span>
                </div>
                <span style={S.zoneArrow}>→→→</span>
                <div style={S.warehouseDot}>
                  <div style={S.warehouseDotCircle}>
                    <span style={S.warehouseDotIcon}>E</span>
                  </div>
                  <span style={S.warehouseDotLabel}>East<br />ATL / NJ</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── HIW Section: How a shipment moves through ShippingCow ─────────────── */}
      <section style={S.hiw} id="how-it-works">
        <div style={S.hiwInner}>

          <div style={S.hiwHeader}>
            <span style={S.hiwEyebrow}>THE PROCESS</span>
            <h2 style={S.hiwH2}>
              From Pickup to <span style={S.hiwH2Accent}>Delivered</span> in 24 Hours
            </h2>
            <p style={S.hiwSubPara}>
              No carrier negotiation experience required. Mooovy handles the math.
            </p>
          </div>

          <div style={S.hiwSteps}>
            {/* Step 01 */}
            <div style={S.hiwStep}>
              <span style={S.hiwStepNum}>01</span>
              <h4 style={S.hiwStepH}>Pickup From Your Location</h4>
              <p style={S.hiwStepP}>
                We collect your inventory directly. No freight jargon, no 53-foot truck
                requirements. We handle big-and-bulky from day one — 50–149lb items are
                our default, not our exception.
              </p>
            </div>

            {/* Step 02 */}
            <div style={S.hiwStep}>
              <span style={S.hiwStepNum}>02</span>
              <h4 style={S.hiwStepH}>Zone-Optimized Routing</h4>
              <p style={S.hiwStepP}>
                DIM 225 vs your current carrier, zone optimization across 3 warehouses,
                shrinkage exposure — calculated against real rate tables. We place your
                inventory where it cuts average zone from 8 to 4. Udderly transparent.
              </p>
            </div>

            {/* Step 03 */}
            <div style={S.hiwStep}>
              <span style={S.hiwStepNum}>03</span>
              <h4 style={S.hiwStepH}>Last-Mile Contract Label</h4>
              <p style={S.hiwStepP}>
                Real numbers. No bull. Your orders ship on ShippingCow&apos;s negotiated
                carrier contracts — so you generate label income on every shipment instead
                of absorbing carrier surcharges. Exact cost per order, visible in your
                dashboard.
              </p>
            </div>
          </div>

          <div style={S.hiwCta}>
            <a href="/#form-anchor" style={S.hiwCtaBtn}>
              Start My Free Audit Now →
            </a>
          </div>

        </div>
      </section>

      {/* ── Insight Section: Every morning at 6:30 AM ────────────────────────── */}
      <section style={S.insight}>
        <div style={S.insightInner}>

          <span style={S.insightEyebrow}>Daily Intelligence</span>
          <h2 style={S.insightH2}>
            Every Morning at 6:30 AM,<br />
            <span style={S.insightH2Accent}>Mooovy Reads the News For You.</span>
          </h2>
          <p style={S.insightPara}>
            Carrier rate hikes, tariff changes, FBA fee updates — Mooovy filters the noise
            and tells you exactly what it means for <em>your</em> SKUs, in dollars.
          </p>

          {/* Insight cards */}
          <div style={S.insightGrid}>

            {/* Card 1 */}
            <div style={S.insightCard}>
              <div style={S.insightCardMeta}>
                <span style={S.insightTypeTip}>Weekly Tip</span>
                <span style={S.insightBadge}>-$1.9K/mo</span>
              </div>
              <h4 style={S.insightCardH}>
                Your Bulky SKUs Are Paying DIM Weight — Try Right-Sized Boxes
              </h4>
              <p style={S.insightCardBody}>
                Across 174 of your shipments last month, billable weight exceeded actual
                weight by an average of 2.1 lb. The pattern points to oversized boxes on
                14 specific SKUs.
              </p>
              <div style={S.insightCallout}>
                <strong>What this means for you:</strong> Switching those 14 SKUs to
                dim-optimized cartons would cut about $1,920/month in dim overcharges.
                Start with SKU GH-4421 — biggest offender at $214/mo.
              </div>
            </div>

            {/* Card 2 */}
            <div style={S.insightCard}>
              <div style={S.insightCardMeta}>
                <span style={S.insightTypeCritical}>⚠ Critical</span>
                <span style={S.insightBadge}>+$11.8K exposure</span>
              </div>
              <h4 style={S.insightCardH}>
                Section 301 List 4A Tariffs Raised to 27.5% on Small-Appliance HTS Codes
              </h4>
              <p style={S.insightCardBody}>
                USTR confirmed the rate hike effective May 12, 2026. Three of your top
                5 SKUs (HTS 8516.71, 8509.40) are on the affected list, including your
                espresso machine line.
              </p>
              <div style={S.insightCallout}>
                <strong>What this means for you:</strong> Your landed cost on imports from
                China rises ~$3.40/unit. Pulling forward your Q3 PO before May 12 could
                save roughly $11,800 on the next inbound.
              </div>
            </div>

          </div>

          {/* Browser frame mockup — Mooovy daily insight interface */}
          <div style={S.insightBrowserWrap}>
            <div style={S.insightBrowserBar}>
              <div style={S.insightBrowserDots}>
                <div style={{ ...S.insightBrowserDot, background: BRAND.red }} />
                <div style={{ ...S.insightBrowserDot, background: BRAND.amber }} />
                <div style={{ ...S.insightBrowserDot, background: BRAND.green }} />
              </div>
              <span style={S.insightBrowserUrl}>app.shippingcow.ai / daily-insight</span>
            </div>
            <div style={S.insightBrowserContent}>
              <span style={S.insightBrowserMooovyLabel}>MOOOVY — 6:30 AM BRIEF — TODAY</span>

              <div style={S.insightBrowserRow}>
                <span style={S.insightBrowserRowIcon}>📦</span>
                <span style={S.insightBrowserRowText}>
                  <span style={S.insightBrowserRowTextAccent}>DIM ALERT:</span> FedEx Ground
                  adjusted DIM divisor to 162 effective Jun 1. Your 12 SKUs in the 14–18in
                  range will see +$0.80–$1.40/shipment. Switching to ShippingCow DIM 225
                  saves you ~$1,200/mo at current volume.
                </span>
              </div>

              <div style={S.insightBrowserRow}>
                <span style={S.insightBrowserRowIcon}>🌐</span>
                <span style={S.insightBrowserRowText}>
                  <span style={S.insightBrowserRowTextAccent}>TARIFF WATCH:</span> Section 301
                  List 4A rate increase confirmed. Pull forward Q3 POs on HTS 8516.xx before
                  May 12 to lock in current duty rate. Estimated exposure if you wait:{' '}
                  <span style={S.insightBrowserRowTextAccent}>+$11,800</span>.
                </span>
              </div>

              <div style={S.insightBrowserRow}>
                <span style={S.insightBrowserRowIcon}>📈</span>
                <span style={S.insightBrowserRowText}>
                  <span style={S.insightBrowserRowTextAccent}>ZONE SAVINGS:</span> Based on
                  your last 30 days, routing 68% of orders from your Central warehouse would
                  save an avg{' '}
                  <span style={S.insightBrowserRowTextAccent}>$2.10/order</span> vs your
                  current East-only fulfillment. Mooovy queued a rebalance suggestion in your
                  dashboard.
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

    </PublicLayout>
  );
}
