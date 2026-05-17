import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { BRAND, px, FONT } from '@/lib/brand';
import { PublicLayout } from '@/components/shell/public-layout';
import RateCalculator from './_rate-calculator';
import QuoteForm from './_quote-form';

export const metadata: Metadata = {
  title: 'Stop Getting Milked on Heavy Freight',
  description: 'Most 50lb+ sellers bleed $1,500–$4,000/month on DIM overcharges, bad zones, and 3PL shrinkage. Mooovy AI spots it in minutes — free 24-hour audit.',
};

// ── Editable constant — shown in live badge ──────────────────────────────────
const SELLERS_AUDITED_THIS_WEEK = 14;

// ── Browser-frame chrome (mockup-only; not part of the brand palette) ────────
const FRAME_DARK_1 = '#1a2540';  // chrome bg
const FRAME_DARK_2 = '#2a3a5c';  // chrome border
const FRAME_DARK_3 = '#223458';  // chrome accent

const S = {
  // --- Hero (v2 port) ---
  hero: {
    background: `linear-gradient(135deg, #dce8fb 0%, ${BRAND.pageBed} 60%, #e8f0fe 100%)`,
    padding: '72px 32px 64px',
  } satisfies CSSProperties,

  heroInner: {
    maxWidth: 1100,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 420px',
    gap: 48,
    alignItems: 'start',
  } satisfies CSSProperties,

  heroBadgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  } satisfies CSSProperties,

  heroLiveDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: '#22c55e',
    flexShrink: 0,
  } satisfies CSSProperties,

  heroLiveText: {
    fontFamily: FONT.pixel,
    fontSize: 8,
    color: BRAND.charcoal,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  } satisfies CSSProperties,

  heroH1: {
    fontFamily: FONT.display,
    fontSize: 'clamp(2.4rem, 5vw, 4rem)',
    color: BRAND.charcoal,
    textTransform: 'uppercase' as const,
    lineHeight: 1.05,
    margin: '0 0 20px',
  } satisfies CSSProperties,

  heroMark: {
    color: BRAND.yellow,
    WebkitTextStroke: `2px ${BRAND.charcoal}`,
    textShadow: `3px 3px 0 ${BRAND.charcoal}`,
  } satisfies CSSProperties,

  heroSub: {
    fontFamily: FONT.body,
    fontSize: 17,
    color: BRAND.charcoal,
    lineHeight: 1.65,
    margin: '0 0 12px',
    maxWidth: 560,
  } satisfies CSSProperties,

  heroIcpNote: {
    fontFamily: FONT.pixel,
    fontSize: 7.5,
    color: BRAND.blue,
    letterSpacing: '0.05em',
    marginBottom: 24,
    display: 'block',
  } satisfies CSSProperties,

  fomoBar: {
    background: BRAND.yellow,
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(),
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 20,
    maxWidth: 560,
  } satisfies CSSProperties,

  fomoBarText: {
    fontFamily: FONT.body,
    fontSize: 13.5,
    color: BRAND.charcoal,
    lineHeight: 1.5,
  } satisfies CSSProperties,

  proofStrip: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 28,
  } satisfies CSSProperties,

  proofStripItem: {
    fontFamily: FONT.body,
    fontSize: 13,
    color: BRAND.charcoal,
    background: BRAND.white,
    border: `2px solid ${BRAND.charcoal}`,
    padding: '5px 10px',
    whiteSpace: 'nowrap' as const,
  } satisfies CSSProperties,

  heroTestiRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    maxWidth: 560,
  } satisfies CSSProperties,

  miniTesti: {
    background: BRAND.white,
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(),
    padding: '14px 16px',
  } satisfies CSSProperties,

  miniTestiStars: {
    color: BRAND.yellow,
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 6,
    display: 'block',
  } satisfies CSSProperties,

  miniTestiP: {
    fontFamily: FONT.body,
    fontSize: 12.5,
    color: BRAND.charcoal,
    lineHeight: 1.55,
    margin: '0 0 6px',
  } satisfies CSSProperties,

  miniTestiName: {
    fontFamily: FONT.pixel,
    fontSize: 6.5,
    color: BRAND.charcoal,
    opacity: 0.6,
    letterSpacing: '0.04em',
  } satisfies CSSProperties,

  // Q-Card (hero right)
  qCard: {
    background: BRAND.white,
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(),
    overflow: 'hidden',
  } satisfies CSSProperties,

  qCardHeader: {
    background: BRAND.charcoal,
    padding: '18px 20px',
  } satisfies CSSProperties,

  qCardTitle: {
    fontFamily: FONT.display,
    fontSize: 18,
    color: BRAND.yellow,
    textTransform: 'uppercase' as const,
    margin: '0 0 4px',
  } satisfies CSSProperties,

  qCardSub: {
    fontFamily: FONT.pixel,
    fontSize: 6.5,
    color: BRAND.sky,
    letterSpacing: '0.05em',
  } satisfies CSSProperties,

  qCardBody: {
    padding: '20px',
  } satisfies CSSProperties,

  qCardStep: {
    fontFamily: FONT.pixel,
    fontSize: 7,
    color: BRAND.charcoal,
    opacity: 0.5,
    letterSpacing: '0.05em',
    marginBottom: 8,
    display: 'block',
  } satisfies CSSProperties,

  qCardStepTitle: {
    fontFamily: FONT.display,
    fontSize: 18,
    color: BRAND.charcoal,
    textTransform: 'uppercase' as const,
    margin: '0 0 16px',
  } satisfies CSSProperties,

  qChoiceBtn: {
    fontFamily: FONT.body,
    fontSize: 13,
    color: BRAND.charcoal,
    background: BRAND.pageBed,
    border: `2px solid ${BRAND.charcoal}`,
    padding: '8px 10px',
    textAlign: 'left' as const,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  } satisfies CSSProperties,

  qChoiceList: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 8,
    marginBottom: 16,
  } satisfies CSSProperties,

  qInputGroup: {
    marginBottom: 12,
  } satisfies CSSProperties,

  qInputLabel: {
    fontFamily: FONT.pixel,
    fontSize: 7,
    color: BRAND.charcoal,
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: 5,
  } satisfies CSSProperties,

  qInput: {
    width: '100%',
    fontFamily: FONT.body,
    fontSize: 14,
    color: BRAND.charcoal,
    background: BRAND.white,
    border: `2px solid ${BRAND.charcoal}`,
    padding: '9px 11px',
    boxSizing: 'border-box' as const,
    outline: 'none',
  } satisfies CSSProperties,

  qSubmitBtn: {
    width: '100%',
    fontFamily: FONT.pixel,
    fontSize: 9,
    color: BRAND.charcoal,
    background: BRAND.yellow,
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(),
    padding: '14px 12px',
    cursor: 'pointer',
    letterSpacing: '0.03em',
    lineHeight: 1.4,
    marginTop: 8,
  } satisfies CSSProperties,

  qGuarantee: {
    fontFamily: FONT.pixel,
    fontSize: 6,
    color: BRAND.charcoal,
    opacity: 0.45,
    letterSpacing: '0.04em',
    textAlign: 'center' as const,
    marginTop: 10,
  } satisfies CSSProperties,

  // --- MOOOVY Intro (v2 port) ---
  mooovySection: {
    background: BRAND.charcoal,
    padding: '72px 32px',
  } satisfies CSSProperties,

  mooovyInner: {
    maxWidth: 1100,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 48,
    alignItems: 'center',
  } satisfies CSSProperties,

  mooovyEyebrow: {
    fontFamily: FONT.pixel,
    fontSize: 8,
    color: BRAND.yellow,
    letterSpacing: '0.08em',
    marginBottom: 20,
    display: 'inline-block',
  } satisfies CSSProperties,

  mooovyH2: {
    fontFamily: FONT.display,
    fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
    color: BRAND.white,
    textTransform: 'uppercase' as const,
    lineHeight: 1.1,
    margin: '0 0 12px',
  } satisfies CSSProperties,

  mooovyH2Accent: {
    color: BRAND.yellow,
  } satisfies CSSProperties,

  mooovySub: {
    fontFamily: FONT.body,
    fontSize: 16,
    color: BRAND.sky,
    lineHeight: 1.65,
    margin: '0 0 24px',
  } satisfies CSSProperties,

  chatBubbles: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
    marginBottom: 24,
  } satisfies CSSProperties,

  chatLabel: {
    fontFamily: FONT.pixel,
    fontSize: 6.5,
    color: BRAND.sky,
    opacity: 0.65,
    letterSpacing: '0.06em',
    marginBottom: 4,
    display: 'block',
  } satisfies CSSProperties,

  chatBubbleUser: {
    fontFamily: FONT.body,
    fontSize: 13.5,
    color: BRAND.charcoal,
    background: BRAND.white,
    border: `2px solid ${BRAND.sky}`,
    padding: '8px 12px',
    lineHeight: 1.5,
    alignSelf: 'flex-end' as const,
    maxWidth: '80%',
    marginLeft: 'auto',
  } satisfies CSSProperties,

  chatBubbleAI: {
    fontFamily: FONT.body,
    fontSize: 13,
    color: BRAND.white,
    background: FRAME_DARK_3,
    border: `2px solid ${BRAND.blue}`,
    padding: '8px 12px',
    lineHeight: 1.55,
    maxWidth: '90%',
  } satisfies CSSProperties,

  mooovyCta: {
    fontFamily: FONT.pixel,
    fontSize: 9,
    color: BRAND.charcoal,
    background: BRAND.yellow,
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(),
    padding: '13px 18px',
    textDecoration: 'none',
    display: 'inline-block',
    lineHeight: 1.4,
    letterSpacing: '0.02em',
  } satisfies CSSProperties,

  // Browser frame placeholder (right side of MOOOVY section)
  browserFrame: {
    border: `3px solid ${BRAND.charcoal}`,
    boxShadow: px(),
    overflow: 'hidden',
    background: FRAME_DARK_1,
  } satisfies CSSProperties,

  browserBar: {
    background: FRAME_DARK_2,
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    borderBottom: `2px solid ${BRAND.charcoal}`,
  } satisfies CSSProperties,

  browserDots: {
    display: 'flex',
    gap: 5,
  } satisfies CSSProperties,

  browserUrl: {
    fontFamily: FONT.pixel,
    fontSize: 6,
    color: BRAND.sky,
    opacity: 0.7,
    letterSpacing: '0.04em',
  } satisfies CSSProperties,

  browserContent: {
    padding: '20px',
    minHeight: 280,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  } satisfies CSSProperties,

  // --- Calculator + shared styles ---
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
    textTransform: 'uppercase' as const,
    margin: '0 0 24px',
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
    textTransform: 'uppercase' as const,
    margin: '0 0 16px',
  } satisfies CSSProperties,
} as const;

export default function LandingPage() {
  return (
    <PublicLayout currentPath="/launch">

      {/* ── Hero (v2 port) ──────────────────────────────────────────────────── */}
      <section style={S.hero} id="form-anchor">
        <div style={S.heroInner}>

          {/* LEFT COPY */}
          <div>
            {/* Live badge */}
            <div style={S.heroBadgeRow}>
              <div style={S.heroLiveDot} />
              <span style={S.heroLiveText}>
                LIVE — {SELLERS_AUDITED_THIS_WEEK} SELLERS GOT AUDITED THIS WEEK
              </span>
            </div>

            <h1 style={S.heroH1}>
              Stop Getting<br />
              <span style={S.heroMark}>Milked</span> on<br />
              Heavy Freight.
            </h1>

            <p style={S.heroSub}>
              Most 50lb+ sellers are bleeding <strong>$1,500–$4,000/month</strong> on DIM weight
              overcharges, bad carrier zones, and 3PL shrinkage. Mooovy&apos;s AI spots it in
              minutes. Your exact savings number — free, in 24 hours.
            </p>

            {/* ICP microcopy */}
            <span style={S.heroIcpNote}>
              For Shopify &amp; TikTok Shop sellers moving 50–149lb items. 200–2,000 orders/month.
            </span>

            {/* FOMO bar */}
            <div style={S.fomoBar}>
              <span style={{ fontSize: 16 }}>🔥</span>
              <span style={S.fomoBarText}>
                Sellers who submitted today discovered an average of{' '}
                <strong>$3,340/month</strong> in overpayments. Your competitors already know their
                number.
              </span>
            </div>

            {/* Proof strip */}
            <div style={S.proofStrip}>
              <div style={S.proofStripItem}>🐄 <strong>DIM 225</strong> Pricing</div>
              <div style={S.proofStripItem}>📦 <strong>300K sq ft</strong> Warehouses</div>
              <div style={S.proofStripItem}>🚚 Up to <strong>80% Off</strong> FedEx</div>
              <div style={S.proofStripItem}>✓ <strong>Zero</strong> Shrinkage Guarantee</div>
            </div>

            {/* Testimonial strip */}
            <div style={S.heroTestiRow}>
              <div style={S.miniTesti}>
                <span style={S.miniTestiStars}>★★★★★</span>
                <p style={S.miniTestiP}>
                  &ldquo;Mooovy found $24K in annual savings in our first audit. Udderly
                  shocked.&rdquo;
                </p>
                <div style={S.miniTestiName}>— Marcus T., OutdoorKraft Co.</div>
              </div>
              <div style={S.miniTesti}>
                <span style={S.miniTestiStars}>★★★★★</span>
                <p style={S.miniTestiP}>
                  &ldquo;8,400 units through ShippingCow. Zero shrinkage. Our old 3PL was losing
                  3%.&rdquo;
                </p>
                <div style={S.miniTestiName}>— Priya M., FitHeavy Equipment</div>
              </div>
            </div>
          </div>

          {/* RIGHT — Q-Card (quote form intake) */}
          <div style={S.qCard}>
            <div style={S.qCardHeader}>
              <div style={S.qCardTitle}>🐄 Get Your Free Herd Audit</div>
              <div style={S.qCardSub}>MOOOVY RUNS THE NUMBERS · YOU KEEP THE SAVINGS</div>
            </div>
            <div style={S.qCardBody}>
              <span style={S.qCardStep}>STEP 01 OF 03</span>
              <h3 style={S.qCardStepTitle}>What are you mooving?</h3>
              <div style={S.qChoiceList}>
                {['🛋️ Furniture', '🏋️ Fitness', '🍳 Appliances', '⛺ Outdoor', '🏠 Home Goods', '📦 Other Heavy'].map((item) => (
                  <div key={item} style={S.qChoiceBtn}>{item}</div>
                ))}
              </div>
              <div style={{ borderTop: `2px solid ${BRAND.charcoal}`, opacity: 0.12, margin: '16px 0' }} />
              <div style={S.qInputGroup}>
                <div style={S.qInputLabel}>FULL NAME *</div>
                <input type="text" placeholder="Jane Smith" style={S.qInput} readOnly />
              </div>
              <div style={S.qInputGroup}>
                <div style={S.qInputLabel}>BUSINESS EMAIL *</div>
                <input type="email" placeholder="jane@yourstore.com" style={S.qInput} readOnly />
              </div>
              <div style={S.qInputGroup}>
                <div style={S.qInputLabel}>MONTHLY SHIPMENTS *</div>
                <input type="text" placeholder="200–2,000 orders/month" style={S.qInput} readOnly />
              </div>
              <a href="#quote" style={S.qSubmitBtn}>
                🐄 Send My Free Audit →
              </a>
              <p style={S.qGuarantee}>
                🔒 MOO&apos;S HONOR — NO SPAM · NO SALES PRESSURE · JUST YOUR NUMBERS
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── MOOOVY Intro (v2 port) ──────────────────────────────────────────── */}
      <section id="mooovy" style={S.mooovySection}>
        <div style={S.mooovyInner}>

          {/* LEFT COPY */}
          <div>
            <span style={S.mooovyEyebrow}>AI ANALYST</span>
            <h2 style={S.mooovyH2}>
              Meet Mooovy.<br />
              <span style={S.mooovyH2Accent}>Your AI That Knows Your Numbers.</span>
            </h2>
            <p style={S.mooovySub}>
              Mooovy is connected directly to your shipment data. Ask it anything in plain English
              — it answers with exact figures from your data, not generic benchmarks.
            </p>

            {/* Chat bubbles */}
            <div style={S.chatBubbles}>
              <div>
                <span style={S.chatLabel}>YOU</span>
                <div style={S.chatBubbleUser}>Which carrier am I using the most?</div>
              </div>
              <div>
                <span style={S.chatLabel}>MOOOVY</span>
                <div style={S.chatBubbleAI}>
                  Your data includes{' '}
                  <strong>FedEx Ground, UPS Ground, FedEx Freight, USPS Priority Mail</strong>{' '}
                  across Shopify. SC has negotiated rates with FedEx, UPS, and USPS — want me to
                  show the rate comparison?
                </div>
              </div>
              <div>
                <span style={S.chatLabel}>YOU</span>
                <div style={S.chatBubbleUser}>What&apos;s my average zone?</div>
              </div>
              <div>
                <span style={S.chatLabel}>MOOOVY</span>
                <div style={S.chatBubbleAI}>
                  Your weighted average zone is <strong>5.57</strong>.{' '}
                  <strong>52.2%</strong> of shipments are in Zone 6+ and{' '}
                  <strong>61%</strong> in Zone 4+. SC&apos;s 3-node network (NJ · TX · CA) would
                  bring your avg zone to <strong>3.89</strong> — saving approximately{' '}
                  <strong>$11,494/yr</strong> on last-mile alone.
                </div>
              </div>
            </div>

            <a href="#quote" style={S.mooovyCta}>
              Get My Audit — Ask Mooovy My Numbers →
            </a>
          </div>

          {/* RIGHT — Browser frame (app preview placeholder) */}
          <div style={S.browserFrame}>
            <div style={S.browserBar}>
              <div style={S.browserDots}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: BRAND.red }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: BRAND.amber }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: BRAND.green }} />
              </div>
              <div style={S.browserUrl}>app.shippingcow.ai / mooovy</div>
            </div>
            <div style={S.browserContent}>
              {/* Simulated dashboard stats */}
              <div style={{
                fontFamily: FONT.pixel,
                fontSize: 6.5,
                color: BRAND.sky,
                opacity: 0.7,
                letterSpacing: '0.06em',
              }}>
                MOOOVY DASHBOARD · LIVE DATA
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
              }}>
                {[
                  { label: 'Avg Zone (current)', value: '5.57', color: BRAND.red },
                  { label: 'Avg Zone (with SC)', value: '3.89', color: BRAND.green },
                  { label: 'DIM Overpay/mo', value: '$2,840', color: BRAND.amber },
                  { label: 'Est. Annual Savings', value: '$11,494', color: BRAND.yellow },
                ].map((stat) => (
                  <div key={stat.label} style={{
                    background: FRAME_DARK_3,
                    border: `2px solid ${BRAND.blue}`,
                    padding: '10px 12px',
                  }}>
                    <div style={{
                      fontFamily: FONT.pixel,
                      fontSize: 6,
                      color: BRAND.sky,
                      opacity: 0.6,
                      letterSpacing: '0.04em',
                      marginBottom: 6,
                    }}>
                      {stat.label.toUpperCase()}
                    </div>
                    <div style={{
                      fontFamily: FONT.display,
                      fontSize: 22,
                      color: stat.color,
                    }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{
                background: FRAME_DARK_3,
                border: `2px solid ${BRAND.blue}`,
                padding: '12px 14px',
              }}>
                <div style={{
                  fontFamily: FONT.pixel,
                  fontSize: 6,
                  color: BRAND.sky,
                  opacity: 0.6,
                  letterSpacing: '0.04em',
                  marginBottom: 8,
                }}>
                  CARRIER BREAKDOWN
                </div>
                {[
                  { carrier: 'FedEx Ground', pct: 52 },
                  { carrier: 'UPS Ground', pct: 31 },
                  { carrier: 'USPS Priority', pct: 17 },
                ].map((c) => (
                  <div key={c.carrier} style={{ marginBottom: 6 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontFamily: FONT.body,
                      fontSize: 11,
                      color: BRAND.sky,
                      marginBottom: 3,
                    }}>
                      <span>{c.carrier}</span>
                      <span>{c.pct}%</span>
                    </div>
                    <div style={{
                      height: 4,
                      background: 'rgba(255,255,255,0.1)',
                    }}>
                      <div style={{
                        width: `${c.pct}%`,
                        height: '100%',
                        background: BRAND.blue,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Rate Calculator ─────────────────────────────────────────────────── */}
      <section style={S.calculatorSection}>
        <div style={S.calculatorInner}>
          <span style={S.calcEyebrow}>{'// Estimate Your Savings'}</span>
          <h2 style={S.calcH2}>See Your Savings</h2>
          <RateCalculator />
        </div>
      </section>

      {/* ── Quote form ──────────────────────────────────────────────────────── */}
      <section id="quote" style={{ padding: '64px 24px', background: BRAND.white }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <span style={S.eyebrow}>{'// Get Exact Rates'}</span>
          <h2 style={S.sectionH2}>
            Get your actual rate.
          </h2>
          <p style={{
            fontSize: 15,
            opacity: 0.65,
            marginBottom: 32,
            maxWidth: 520,
            lineHeight: 1.7,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Send us your item type, weight, and origin zip.
            We&apos;ll reply within 24 hours with your all-in rate — fuel, residential, and
            handling included.
          </p>
          <QuoteForm />
        </div>
      </section>

    </PublicLayout>
  );
}
