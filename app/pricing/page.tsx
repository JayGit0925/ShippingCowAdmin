import type { CSSProperties } from 'react';
import { BRAND, px, pxSm, FONT } from '@/lib/brand';
import { PublicLayout } from '@/components/shell/public-layout';

export const metadata = {
  title: 'Pricing — ShippingCow',
  description: 'Per-order pricing for 50–149lb items. Calf, Cow, and Bull tiers.',
};

// ── Browser-frame chrome (mockup-only; not part of the brand palette) ────────
const FRAME_DARK_1 = '#1a2540'; // chrome bg
const FRAME_DARK_2 = '#2a3a5c'; // chrome border
const FRAME_DARK_3 = '#223458'; // chrome accent

const S = {
  // --- tiers ---
  tiers: {
    background: BRAND.pageBed,
    padding: '80px 32px',
  } satisfies CSSProperties,

  tiersInner: {
    maxWidth: 1100,
    margin: '0 auto',
  } satisfies CSSProperties,

  tiersHeader: {
    textAlign: 'center' as const,
    marginBottom: 56,
  } satisfies CSSProperties,

  tiersEyebrow: {
    fontFamily: FONT.pixel,
    fontSize: 8,
    color: BRAND.charcoal,
    background: BRAND.yellow,
    border: `2px solid ${BRAND.charcoal}`,
    boxShadow: pxSm(),
    padding: '5px 10px',
    letterSpacing: '0.06em',
    display: 'inline-block',
    marginBottom: 20,
    textTransform: 'uppercase' as const,
  } satisfies CSSProperties,

  tiersH1: {
    fontFamily: FONT.display,
    fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
    textTransform: 'uppercase' as const,
    color: BRAND.charcoal,
    margin: '0 0 12px',
    lineHeight: 1.1,
  } satisfies CSSProperties,

  tiersSubPara: {
    fontFamily: FONT.body,
    fontSize: 16,
    color: BRAND.charcoal,
    opacity: 0.65,
    maxWidth: 520,
    margin: '0 auto',
    lineHeight: 1.65,
  } satisfies CSSProperties,

  tiersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 24,
    alignItems: 'start',
  } satisfies CSSProperties,

  tierCard: {
    background: BRAND.white,
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(),
    padding: '32px 28px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 0,
  } satisfies CSSProperties,

  tierCardFeatured: {
    background: BRAND.charcoal,
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(BRAND.blue),
    padding: '32px 28px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 0,
  } satisfies CSSProperties,

  tierBadge: {
    fontFamily: FONT.pixel,
    fontSize: 7,
    color: BRAND.charcoal,
    background: BRAND.yellow,
    border: `2px solid ${BRAND.charcoal}`,
    padding: '4px 8px',
    letterSpacing: '0.04em',
    display: 'inline-block',
    marginBottom: 16,
    alignSelf: 'flex-start' as const,
  } satisfies CSSProperties,

  tierName: {
    fontFamily: FONT.display,
    fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
    textTransform: 'uppercase' as const,
    color: BRAND.charcoal,
    margin: '0 0 6px',
    lineHeight: 1.1,
  } satisfies CSSProperties,

  tierNameLight: {
    fontFamily: FONT.display,
    fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
    textTransform: 'uppercase' as const,
    color: BRAND.yellow,
    margin: '0 0 6px',
    lineHeight: 1.1,
  } satisfies CSSProperties,

  tierVolume: {
    fontFamily: FONT.pixel,
    fontSize: 7,
    color: BRAND.charcoal,
    opacity: 0.55,
    letterSpacing: '0.05em',
    marginBottom: 18,
    display: 'block',
  } satisfies CSSProperties,

  tierVolumeLight: {
    fontFamily: FONT.pixel,
    fontSize: 7,
    color: BRAND.white,
    opacity: 0.5,
    letterSpacing: '0.05em',
    marginBottom: 18,
    display: 'block',
  } satisfies CSSProperties,

  tierPrice: {
    fontFamily: FONT.display,
    fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
    color: BRAND.charcoal,
    textTransform: 'uppercase' as const,
    display: 'block',
    lineHeight: 1,
    marginBottom: 4,
  } satisfies CSSProperties,

  tierPriceLight: {
    fontFamily: FONT.display,
    fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
    color: BRAND.white,
    textTransform: 'uppercase' as const,
    display: 'block',
    lineHeight: 1,
    marginBottom: 4,
  } satisfies CSSProperties,

  tierPriceSub: {
    fontFamily: FONT.body,
    fontSize: 12,
    color: BRAND.charcoal,
    opacity: 0.55,
    lineHeight: 1.5,
    display: 'block',
    marginBottom: 24,
  } satisfies CSSProperties,

  tierPriceSubLight: {
    fontFamily: FONT.body,
    fontSize: 12,
    color: BRAND.white,
    opacity: 0.5,
    lineHeight: 1.5,
    display: 'block',
    marginBottom: 24,
  } satisfies CSSProperties,

  tierDivider: {
    border: 'none',
    borderTop: `2px solid ${BRAND.charcoal}`,
    opacity: 0.12,
    margin: '0 0 20px',
  } satisfies CSSProperties,

  tierDividerLight: {
    border: 'none',
    borderTop: `2px solid ${BRAND.white}`,
    opacity: 0.15,
    margin: '0 0 20px',
  } satisfies CSSProperties,

  tierFeatures: {
    listStyle: 'none',
    margin: '0 0 28px',
    padding: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
    flexGrow: 1,
  } satisfies CSSProperties,

  tierFeatureItem: {
    fontFamily: FONT.body,
    fontSize: 14,
    color: BRAND.charcoal,
    lineHeight: 1.55,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
  } satisfies CSSProperties,

  tierFeatureItemLight: {
    fontFamily: FONT.body,
    fontSize: 14,
    color: BRAND.white,
    lineHeight: 1.55,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    opacity: 0.85,
  } satisfies CSSProperties,

  tierFeatureDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: BRAND.blue,
    flexShrink: 0,
    marginTop: 5,
  } satisfies CSSProperties,

  tierFeatureDotYellow: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: BRAND.yellow,
    flexShrink: 0,
    marginTop: 5,
  } satisfies CSSProperties,

  tierCta: {
    fontFamily: FONT.pixel,
    fontSize: 8,
    color: BRAND.charcoal,
    background: BRAND.yellow,
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(),
    padding: '12px 20px',
    textDecoration: 'none',
    display: 'block',
    textAlign: 'center' as const,
    letterSpacing: '0.02em',
    lineHeight: 1.4,
  } satisfies CSSProperties,

  tierCtaFeatured: {
    fontFamily: FONT.pixel,
    fontSize: 8,
    color: BRAND.charcoal,
    background: BRAND.yellow,
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: pxSm(),
    padding: '12px 20px',
    textDecoration: 'none',
    display: 'block',
    textAlign: 'center' as const,
    letterSpacing: '0.02em',
    lineHeight: 1.4,
  } satisfies CSSProperties,

  tiersFootnote: {
    fontFamily: FONT.body,
    fontSize: 12,
    color: BRAND.charcoal,
    opacity: 0.5,
    textAlign: 'center' as const,
    marginTop: 20,
    lineHeight: 1.6,
  } satisfies CSSProperties,

  // --- no-surprise-fees ---
  noSurprise: {
    background: BRAND.charcoal,
    padding: '64px 32px',
  } satisfies CSSProperties,

  noSurpriseInner: {
    maxWidth: 1100,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 56,
    alignItems: 'center',
  } satisfies CSSProperties,

  noSurpriseTag: {
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

  noSurpriseH2: {
    fontFamily: FONT.display,
    fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
    textTransform: 'uppercase' as const,
    color: BRAND.white,
    margin: '0 0 16px',
    lineHeight: 1.1,
  } satisfies CSSProperties,

  noSurpriseH2Accent: {
    color: BRAND.yellow,
  } satisfies CSSProperties,

  noSurprisePara: {
    fontFamily: FONT.body,
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 1.75,
    margin: '0 0 20px',
    maxWidth: 460,
  } satisfies CSSProperties,

  noSurpriseCard: {
    background: FRAME_DARK_3,
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(BRAND.blue),
    padding: '28px 24px',
  } satisfies CSSProperties,

  noSurpriseCardLabel: {
    fontFamily: FONT.pixel,
    fontSize: 7,
    color: BRAND.sky,
    opacity: 0.7,
    letterSpacing: '0.06em',
    display: 'block',
    marginBottom: 14,
    textTransform: 'uppercase' as const,
  } satisfies CSSProperties,

  noSurpriseItems: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  } satisfies CSSProperties,

  noSurpriseItem: {
    fontFamily: FONT.body,
    fontSize: 13.5,
    color: BRAND.white,
    lineHeight: 1.55,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    opacity: 0.85,
  } satisfies CSSProperties,

  noSurpriseCheck: {
    fontFamily: FONT.display,
    fontSize: 14,
    color: BRAND.green,
    flexShrink: 0,
    marginTop: 1,
  } satisfies CSSProperties,

  noSurpriseX: {
    fontFamily: FONT.display,
    fontSize: 14,
    color: BRAND.red,
    flexShrink: 0,
    marginTop: 1,
  } satisfies CSSProperties,

  noSurpriseItemCrossed: {
    fontFamily: FONT.body,
    fontSize: 13.5,
    color: BRAND.white,
    lineHeight: 1.55,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    opacity: 0.45,
  } satisfies CSSProperties,

  noSurpriseStrike: {
    textDecoration: 'line-through',
  } satisfies CSSProperties,

  // --- trust ---
  trust: {
    background: BRAND.white,
    padding: '80px 32px',
  } satisfies CSSProperties,

  trustInner: {
    maxWidth: 1100,
    margin: '0 auto',
  } satisfies CSSProperties,

  trustHeader: {
    textAlign: 'center' as const,
    marginBottom: 56,
  } satisfies CSSProperties,

  trustEyebrow: {
    fontFamily: FONT.pixel,
    fontSize: 8,
    color: BRAND.charcoal,
    opacity: 0.5,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    display: 'block',
    marginBottom: 12,
  } satisfies CSSProperties,

  trustH2: {
    fontFamily: FONT.display,
    fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
    textTransform: 'uppercase' as const,
    color: BRAND.charcoal,
    margin: '0 0 12px',
    lineHeight: 1.1,
  } satisfies CSSProperties,

  trustGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 20,
    marginBottom: 48,
  } satisfies CSSProperties,

  trustTile: {
    background: BRAND.pageBed,
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(),
    padding: '22px 24px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
  } satisfies CSSProperties,

  trustIcon: {
    fontFamily: FONT.display,
    fontSize: 20,
    color: BRAND.green,
    flexShrink: 0,
    lineHeight: 1,
    marginTop: 2,
  } satisfies CSSProperties,

  trustTitle: {
    fontFamily: FONT.display,
    fontSize: 16,
    color: BRAND.charcoal,
    textTransform: 'uppercase' as const,
    margin: '0 0 5px',
    lineHeight: 1.2,
  } satisfies CSSProperties,

  trustSub: {
    fontFamily: FONT.body,
    fontSize: 13.5,
    color: BRAND.charcoal,
    opacity: 0.65,
    lineHeight: 1.6,
    margin: 0,
  } satisfies CSSProperties,

  // Testimonials
  testiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 24,
    marginBottom: 48,
  } satisfies CSSProperties,

  testi: {
    background: BRAND.pageBed,
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(),
    padding: '28px 24px',
  } satisfies CSSProperties,

  testiStars: {
    fontFamily: FONT.body,
    fontSize: 14,
    color: BRAND.amber,
    display: 'block',
    marginBottom: 14,
    letterSpacing: '0.08em',
  } satisfies CSSProperties,

  testiQuote: {
    fontFamily: FONT.body,
    fontSize: 14.5,
    color: BRAND.charcoal,
    lineHeight: 1.7,
    margin: '0 0 14px',
    fontStyle: 'italic' as const,
    opacity: 0.85,
  } satisfies CSSProperties,

  testiName: {
    fontFamily: FONT.display,
    fontSize: 13,
    color: BRAND.charcoal,
    textTransform: 'uppercase' as const,
    margin: '0 0 3px',
  } satisfies CSSProperties,

  testiMeta: {
    fontFamily: FONT.pixel,
    fontSize: 7,
    color: BRAND.charcoal,
    opacity: 0.45,
    letterSpacing: '0.04em',
    lineHeight: 1.5,
  } satisfies CSSProperties,

  // DIM comparison in trust section
  trustDimWrap: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    marginBottom: 48,
  } satisfies CSSProperties,

  trustDimLabel: {
    fontFamily: FONT.pixel,
    fontSize: 7,
    color: BRAND.charcoal,
    opacity: 0.5,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    display: 'block',
    marginBottom: 8,
  } satisfies CSSProperties,

  trustDimCard: {
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(),
    overflow: 'hidden',
  } satisfies CSSProperties,

  trustDimHeaderYellow: {
    background: BRAND.yellow,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } satisfies CSSProperties,

  trustDimHeaderCharcoal: {
    background: BRAND.charcoal,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } satisfies CSSProperties,

  trustDimCardName: {
    fontFamily: FONT.display,
    fontSize: 13,
    color: BRAND.charcoal,
    textTransform: 'uppercase' as const,
  } satisfies CSSProperties,

  trustDimCardNameLight: {
    fontFamily: FONT.display,
    fontSize: 13,
    color: BRAND.white,
    textTransform: 'uppercase' as const,
  } satisfies CSSProperties,

  trustDimBadge: {
    fontFamily: FONT.pixel,
    fontSize: 7,
    color: BRAND.white,
    background: BRAND.red,
    padding: '4px 8px',
    letterSpacing: '0.04em',
  } satisfies CSSProperties,

  trustDimBadgeGreen: {
    fontFamily: FONT.pixel,
    fontSize: 7,
    color: BRAND.white,
    background: BRAND.green,
    padding: '4px 8px',
    letterSpacing: '0.04em',
  } satisfies CSSProperties,

  trustDimCardBody: {
    background: BRAND.white,
    padding: '14px 16px',
  } satisfies CSSProperties,

  trustDimRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  } satisfies CSSProperties,

  trustDimRowKey: {
    fontFamily: FONT.body,
    fontSize: 13,
    color: BRAND.charcoal,
    opacity: 0.65,
  } satisfies CSSProperties,

  trustDimRowVal: {
    fontFamily: FONT.display,
    fontSize: 15,
    color: BRAND.charcoal,
    textTransform: 'uppercase' as const,
  } satisfies CSSProperties,

  trustDimRowValAccent: {
    fontFamily: FONT.display,
    fontSize: 15,
    color: BRAND.blue,
    textTransform: 'uppercase' as const,
  } satisfies CSSProperties,

  trustDimDelta: {
    fontFamily: FONT.pixel,
    fontSize: 7.5,
    color: BRAND.green,
    letterSpacing: '0.04em',
    display: 'block',
    marginTop: 4,
  } satisfies CSSProperties,

  // 3-warehouse zone map
  trustZoneWrap: {
    background: BRAND.pageBed,
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(),
    padding: '24px',
  } satisfies CSSProperties,

  trustZoneTitle: {
    fontFamily: FONT.pixel,
    fontSize: 7,
    color: BRAND.charcoal,
    opacity: 0.55,
    letterSpacing: '0.06em',
    display: 'block',
    marginBottom: 14,
    textTransform: 'uppercase' as const,
  } satisfies CSSProperties,

  trustZoneDots: {
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
    width: 40,
    height: 40,
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
    fontSize: 9,
    color: BRAND.white,
  } satisfies CSSProperties,

  zoneArrow: {
    fontFamily: FONT.pixel,
    fontSize: 10,
    color: BRAND.charcoal,
    opacity: 0.3,
  } satisfies CSSProperties,

  // Dashboard preview browser frame
  dashBrowserWrap: {
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(),
    overflow: 'hidden',
    background: FRAME_DARK_1,
    marginTop: 48,
  } satisfies CSSProperties,

  dashBrowserBar: {
    background: FRAME_DARK_2,
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    borderBottom: `2px solid ${BRAND.charcoal}`,
  } satisfies CSSProperties,

  dashBrowserDots: {
    display: 'flex',
    gap: 5,
  } satisfies CSSProperties,

  dashBrowserDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
  } satisfies CSSProperties,

  dashBrowserUrl: {
    fontFamily: FONT.pixel,
    fontSize: 6,
    color: BRAND.sky,
    opacity: 0.7,
    letterSpacing: '0.04em',
  } satisfies CSSProperties,

  dashBrowserContent: {
    padding: '28px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 14,
  } satisfies CSSProperties,

  dashBrowserKpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
  } satisfies CSSProperties,

  dashKpiCard: {
    background: FRAME_DARK_3,
    border: `1px solid ${BRAND.blue}`,
    padding: '12px 14px',
  } satisfies CSSProperties,

  dashKpiLabel: {
    fontFamily: FONT.pixel,
    fontSize: 6,
    color: BRAND.sky,
    opacity: 0.6,
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: 6,
    textTransform: 'uppercase' as const,
  } satisfies CSSProperties,

  dashKpiValue: {
    fontFamily: FONT.display,
    fontSize: 18,
    color: BRAND.white,
    textTransform: 'uppercase' as const,
    display: 'block',
    lineHeight: 1,
  } satisfies CSSProperties,

  dashKpiValueGreen: {
    fontFamily: FONT.display,
    fontSize: 18,
    color: BRAND.green,
    textTransform: 'uppercase' as const,
    display: 'block',
    lineHeight: 1,
  } satisfies CSSProperties,

  dashKpiSub: {
    fontFamily: FONT.body,
    fontSize: 11,
    color: BRAND.white,
    opacity: 0.45,
    display: 'block',
    marginTop: 3,
  } satisfies CSSProperties,

  dashBrowserRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    background: FRAME_DARK_3,
    border: `1px solid ${BRAND.blue}`,
    padding: '12px 14px',
  } satisfies CSSProperties,

  dashBrowserRowLabel: {
    fontFamily: FONT.pixel,
    fontSize: 7,
    color: BRAND.yellow,
    flexShrink: 0,
    marginTop: 2,
  } satisfies CSSProperties,

  dashBrowserRowText: {
    fontFamily: FONT.body,
    fontSize: 13,
    color: BRAND.white,
    lineHeight: 1.55,
    opacity: 0.85,
  } satisfies CSSProperties,

  dashBrowserRowTextAccent: {
    color: BRAND.yellow,
    fontWeight: 700,
  } satisfies CSSProperties,

  // Trust CTA bar at bottom
  trustCta: {
    textAlign: 'center' as const,
    marginTop: 56,
  } satisfies CSSProperties,

  trustCtaBtn: {
    fontFamily: FONT.pixel,
    fontSize: 9,
    color: BRAND.charcoal,
    background: BRAND.yellow,
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(),
    padding: '14px 28px',
    textDecoration: 'none',
    display: 'inline-block',
    lineHeight: 1.4,
    letterSpacing: '0.02em',
  } satisfies CSSProperties,
} as const;

export default function PricingPage() {
  return (
    <PublicLayout currentPath="/pricing">

      {/* ── Tier Section: Pick Your Herd ──────────────────────────────────────── */}
      <section style={S.tiers}>
        <div style={S.tiersInner}>

          <div style={S.tiersHeader}>
            <span style={S.tiersEyebrow}>PLANS</span>
            <h1 style={S.tiersH1}>Pick Your Herd</h1>
            <p style={S.tiersSubPara}>
              Per-order pricing built for 50–149lb items. Get an exact quote in 24 hours.
            </p>
          </div>

          <div style={S.tiersGrid}>

            {/* CALF */}
            <div style={S.tierCard}>
              <h2 style={S.tierName}>Calf</h2>
              <span style={S.tierVolume}>200–500 orders/mo · starter</span>
              <span style={S.tierPrice}>From $X/order</span>
              <span style={S.tierPriceSub}>
                Final price depends on weight + zone — get an exact quote in 24h.
              </span>
              <hr style={S.tierDivider} />
              <ul style={S.tierFeatures}>
                <li style={S.tierFeatureItem}>
                  <span style={S.tierFeatureDot} />
                  <span>DIM factor 225 — stop paying for air</span>
                </li>
                <li style={S.tierFeatureItem}>
                  <span style={S.tierFeatureDot} />
                  <span>3-warehouse zone skipping (avg zone 8 → 4)</span>
                </li>
                <li style={S.tierFeatureItem}>
                  <span style={S.tierFeatureDot} />
                  <span>Mooovy dashboard — full cost visibility per SKU</span>
                </li>
                <li style={S.tierFeatureItem}>
                  <span style={S.tierFeatureDot} />
                  <span>Zero shrinkage guarantee or we pay wholesale cost</span>
                </li>
                <li style={S.tierFeatureItem}>
                  <span style={S.tierFeatureDot} />
                  <span>2-day delivery guarantee in your contract</span>
                </li>
              </ul>
              <a href="/#form-anchor" style={S.tierCta}>
                Get a Quote →
              </a>
            </div>

            {/* COW — featured */}
            <div style={S.tierCardFeatured}>
              <span style={S.tierBadge}>MOST POPULAR</span>
              <h2 style={S.tierNameLight}>Cow</h2>
              <span style={S.tierVolumeLight}>500–1,500 orders/mo · best value</span>
              <span style={S.tierPriceLight}>From $X/order</span>
              <span style={S.tierPriceSubLight}>
                Final price depends on weight + zone — get an exact quote in 24h.
              </span>
              <hr style={S.tierDividerLight} />
              <ul style={S.tierFeatures}>
                <li style={S.tierFeatureItemLight}>
                  <span style={S.tierFeatureDotYellow} />
                  <span>Everything in Calf</span>
                </li>
                <li style={S.tierFeatureItemLight}>
                  <span style={S.tierFeatureDotYellow} />
                  <span>Dedicated SC account manager</span>
                </li>
                <li style={S.tierFeatureItemLight}>
                  <span style={S.tierFeatureDotYellow} />
                  <span>Priority routing across all 3 warehouses</span>
                </li>
                <li style={S.tierFeatureItemLight}>
                  <span style={S.tierFeatureDotYellow} />
                  <span>Full Mooovy AI + daily insight feed</span>
                </li>
                <li style={S.tierFeatureItemLight}>
                  <span style={S.tierFeatureDotYellow} />
                  <span>Top SKU analysis + monthly savings report</span>
                </li>
                <li style={S.tierFeatureItemLight}>
                  <span style={S.tierFeatureDotYellow} />
                  <span>SC rate comparison vs your current carrier</span>
                </li>
              </ul>
              <a href="/#form-anchor" style={S.tierCtaFeatured}>
                Get a Quote →
              </a>
            </div>

            {/* BULL */}
            <div style={S.tierCard}>
              <h2 style={S.tierName}>Bull</h2>
              <span style={S.tierVolume}>1,500–2,000+ orders/mo · high-volume</span>
              <span style={S.tierPrice}>From $X/order</span>
              <span style={S.tierPriceSub}>
                Final price depends on weight + zone — get an exact quote in 24h.
              </span>
              <hr style={S.tierDivider} />
              <ul style={S.tierFeatures}>
                <li style={S.tierFeatureItem}>
                  <span style={S.tierFeatureDot} />
                  <span>Everything in Cow</span>
                </li>
                <li style={S.tierFeatureItem}>
                  <span style={S.tierFeatureDot} />
                  <span>Custom carrier negotiations</span>
                </li>
                <li style={S.tierFeatureItem}>
                  <span style={S.tierFeatureDot} />
                  <span>Multi-warehouse routing optimization</span>
                </li>
                <li style={S.tierFeatureItem}>
                  <span style={S.tierFeatureDot} />
                  <span>API access for direct integrations</span>
                </li>
                <li style={S.tierFeatureItem}>
                  <span style={S.tierFeatureDot} />
                  <span>Priority 4-hour support SLA</span>
                </li>
              </ul>
              <a href="/#form-anchor" style={S.tierCta}>
                Talk to Sales →
              </a>
            </div>

          </div>

          <p style={S.tiersFootnote}>
            * &ldquo;From $X/order&rdquo; reflects our published floor rate. Final price depends on actual
            weight and destination zone — we&apos;ll give you an exact per-order number within 24 hours
            of your quote request.
          </p>

        </div>
      </section>

      {/* ── No Surprise Fees ──────────────────────────────────────────────────── */}
      <section style={S.noSurprise}>
        <div style={S.noSurpriseInner}>

          {/* LEFT: Copy */}
          <div>
            <span style={S.noSurpriseTag}>Transparent Pricing</span>
            <h2 style={S.noSurpriseH2}>
              No Surprise<br />
              <span style={S.noSurpriseH2Accent}>Fees.</span>
            </h2>
            <p style={S.noSurprisePara}>
              What you&apos;re quoted is what you pay. Fuel surcharges, residential delivery fees,
              and handling charges — all baked into your rate upfront. No line-item additions
              after the label prints. No invoice surprises at month&apos;s end. One number. Final.
            </p>
          </div>

          {/* RIGHT: Invoice comparison card */}
          <div style={S.noSurpriseCard}>
            <span style={S.noSurpriseCardLabel}>Invoice comparison — same shipment</span>
            <ul style={S.noSurpriseItems}>
              <li style={S.noSurpriseItem}>
                <span style={S.noSurpriseCheck}>✓</span>
                <span><strong>ShippingCow:</strong> $38.50/order — quoted, charged, done.</span>
              </li>
              <li style={S.noSurpriseItemCrossed}>
                <span style={S.noSurpriseX}>✗</span>
                <span style={S.noSurpriseStrike}>
                  Competitor: $32.00 base
                </span>
              </li>
              <li style={S.noSurpriseItemCrossed}>
                <span style={S.noSurpriseX}>+</span>
                <span style={S.noSurpriseStrike}>
                  $4.50 fuel surcharge
                </span>
              </li>
              <li style={S.noSurpriseItemCrossed}>
                <span style={S.noSurpriseX}>+</span>
                <span style={S.noSurpriseStrike}>
                  $3.50 residential delivery fee
                </span>
              </li>
              <li style={S.noSurpriseItemCrossed}>
                <span style={S.noSurpriseX}>+</span>
                <span style={S.noSurpriseStrike}>
                  $2.25 handling charge
                </span>
              </li>
              <li style={S.noSurpriseItem}>
                <span style={S.noSurpriseX}>→</span>
                <span>
                  <strong style={{ color: BRAND.red }}>$42.25 actual charge</strong> — $10.25 more than quoted
                </span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* ── Trust Section: Guarantees, Not Promises ───────────────────────────── */}
      <section style={S.trust}>
        <div style={S.trustInner}>

          <div style={S.trustHeader}>
            <span style={S.trustEyebrow}>Why the Herd Trusts Us</span>
            <h2 style={S.trustH2}>Guarantees, Not Promises</h2>
          </div>

          {/* 4-tile guarantee grid */}
          <div style={S.trustGrid}>

            <div style={S.trustTile}>
              <span style={S.trustIcon}>✓</span>
              <div>
                <p style={S.trustTitle}>Zero Shrinkage</p>
                <p style={S.trustSub}>Or we pay full wholesale cost. No excuses. Cow&apos;nt on it.</p>
              </div>
            </div>

            <div style={S.trustTile}>
              <span style={S.trustIcon}>✓</span>
              <div>
                <p style={S.trustTitle}>2-Day Delivery</p>
                <p style={S.trustSub}>Guaranteed in the contract — not just a promise we moo into the wind.</p>
              </div>
            </div>

            <div style={S.trustTile}>
              <span style={S.trustIcon}>✓</span>
              <div>
                <p style={S.trustTitle}>DIM 225 Pricing</p>
                <p style={S.trustSub}>Lowest billable weight divisor in the industry. Stop paying for air.</p>
              </div>
            </div>

            <div style={S.trustTile}>
              <span style={S.trustIcon}>✓</span>
              <div>
                <p style={S.trustTitle}>Direct Carrier Contracts</p>
                <p style={S.trustSub}>No broker markup. No bull. Just the best rates in the pasture.</p>
              </div>
            </div>

          </div>

          {/* DIM factor 225 vs 166 comparison */}
          <div style={S.trustDimWrap}>
            <div>
              <span style={S.trustDimLabel}>Dim factor comparison — 60lb item, 18×18×18 box</span>
              <div style={S.trustDimCard}>
                <div style={S.trustDimHeaderCharcoal}>
                  <span style={S.trustDimCardNameLight}>ShipBob / Industry Standard</span>
                  <span style={S.trustDimBadge}>DIM 166</span>
                </div>
                <div style={S.trustDimCardBody}>
                  <div style={S.trustDimRow}>
                    <span style={S.trustDimRowKey}>Actual weight</span>
                    <span style={S.trustDimRowVal}>60 lb</span>
                  </div>
                  <div style={S.trustDimRow}>
                    <span style={S.trustDimRowKey}>Billable DIM weight</span>
                    <span style={S.trustDimRowVal}>71.1 lb</span>
                  </div>
                  <div style={S.trustDimRow}>
                    <span style={S.trustDimRowKey}>You pay on</span>
                    <span style={S.trustDimRowVal}>71.1 lb</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <span style={S.trustDimLabel}>&nbsp;</span>
              <div style={S.trustDimCard}>
                <div style={S.trustDimHeaderYellow}>
                  <span style={S.trustDimCardName}>ShippingCow.ai</span>
                  <span style={S.trustDimBadgeGreen}>DIM 225</span>
                </div>
                <div style={S.trustDimCardBody}>
                  <div style={S.trustDimRow}>
                    <span style={S.trustDimRowKey}>Actual weight</span>
                    <span style={S.trustDimRowVal}>60 lb</span>
                  </div>
                  <div style={S.trustDimRow}>
                    <span style={S.trustDimRowKey}>Billable DIM weight</span>
                    <span style={S.trustDimRowValAccent}>52.5 lb</span>
                  </div>
                  <div style={S.trustDimRow}>
                    <span style={S.trustDimRowKey}>You pay on</span>
                    <span style={S.trustDimRowValAccent}>60 lb</span>
                  </div>
                  <span style={S.trustDimDelta}>↓ ~$14 saved per order vs DIM 166</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3-warehouse zone map */}
          <div style={S.trustZoneWrap}>
            <span style={S.trustZoneTitle}>3-warehouse zone skipping — avg zone 8 → 4</span>
            <div style={S.trustZoneDots}>
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

          {/* Testimonials */}
          <div style={{ ...S.testiGrid, marginTop: 48 }}>

            <div style={S.testi}>
              <span style={S.testiStars}>★★★★★</span>
              <p style={S.testiQuote}>
                &ldquo;We were running 400 shipments a month at DIM 139 — basically paying FedEx to haul
                air. ShippingCow moved us to DIM 225, cut our billable weight by 31%, and put $24K
                back in our pocket in Q1. Udderly life-changing.&rdquo;
              </p>
              <p style={S.testiName}>— Marcus T.</p>
              <span style={S.testiMeta}>OutdoorKraft Co. · Outdoor Furniture · 400 shipments/mo</span>
            </div>

            <div style={S.testi}>
              <span style={S.testiStars}>★★★★★</span>
              <p style={S.testiQuote}>
                &ldquo;Our old 3PL had a 3.1% shrinkage clause buried so deep we didn&apos;t find it for
                three years — that&apos;s $80K in lost inventory. ShippingCow has processed 8,400 units
                for us. Zero losses. Mooovy kept their word.&rdquo;
              </p>
              <p style={S.testiName}>— Priya M.</p>
              <span style={S.testiMeta}>FitHeavy Equipment · Commercial Fitness Gear · 600 units/mo</span>
            </div>

          </div>

          {/* Dashboard preview browser mockup */}
          <div style={S.dashBrowserWrap}>
            <div style={S.dashBrowserBar}>
              <div style={S.dashBrowserDots}>
                <div style={{ ...S.dashBrowserDot, background: BRAND.red }} />
                <div style={{ ...S.dashBrowserDot, background: BRAND.amber }} />
                <div style={{ ...S.dashBrowserDot, background: BRAND.green }} />
              </div>
              <span style={S.dashBrowserUrl}>app.shippingcow.ai / dashboard</span>
            </div>
            <div style={S.dashBrowserContent}>

              {/* KPI row */}
              <div style={S.dashBrowserKpiRow}>
                <div style={S.dashKpiCard}>
                  <span style={S.dashKpiLabel}>Shipments (30d)</span>
                  <span style={S.dashKpiValue}>847</span>
                  <span style={S.dashKpiSub}>+12% vs prev month</span>
                </div>
                <div style={S.dashKpiCard}>
                  <span style={S.dashKpiLabel}>Avg cost/order</span>
                  <span style={S.dashKpiValueGreen}>$38.50</span>
                  <span style={S.dashKpiSub}>was $52.40 before SC</span>
                </div>
                <div style={S.dashKpiCard}>
                  <span style={S.dashKpiLabel}>Shrinkage</span>
                  <span style={S.dashKpiValueGreen}>0.00%</span>
                  <span style={S.dashKpiSub}>0 units lost</span>
                </div>
                <div style={S.dashKpiCard}>
                  <span style={S.dashKpiLabel}>DIM savings (30d)</span>
                  <span style={S.dashKpiValueGreen}>$11,830</span>
                  <span style={S.dashKpiSub}>vs DIM 166 baseline</span>
                </div>
              </div>

              <div style={S.dashBrowserRow}>
                <span style={S.dashBrowserRowLabel}>📦 DIM</span>
                <span style={S.dashBrowserRowText}>
                  <span style={S.dashBrowserRowTextAccent}>847 orders last month.</span>{' '}
                  DIM 225 saved you an avg $13.97/order vs FedEx standard DIM 166. Total savings:{' '}
                  <span style={S.dashBrowserRowTextAccent}>$11,830</span>.
                </span>
              </div>

              <div style={S.dashBrowserRow}>
                <span style={S.dashBrowserRowLabel}>🏭 ZONE</span>
                <span style={S.dashBrowserRowText}>
                  <span style={S.dashBrowserRowTextAccent}>Zone optimization active.</span>{' '}
                  68% of orders shipped from Central warehouse. Avg zone dropped from 8.1 → 3.9.
                  Est. additional savings:{' '}
                  <span style={S.dashBrowserRowTextAccent}>$2.10/order</span>.
                </span>
              </div>

            </div>
          </div>

          {/* Final CTA */}
          <div style={S.trustCta}>
            <a href="/#form-anchor" style={S.trustCtaBtn}>
              Get My Exact Quote — 24-Hour Turnaround →
            </a>
          </div>

        </div>
      </section>

    </PublicLayout>
  );
}
