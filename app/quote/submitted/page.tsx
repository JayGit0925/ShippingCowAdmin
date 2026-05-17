import type { CSSProperties } from 'react';
import { BRAND, FONT } from '@/lib/brand';
import { PublicLayout } from '@/components/shell/public-layout';
import { DemoCalendar } from './_demo-calendar';

export const metadata = {
  title: "Holy Cow — You're In! · ShippingCow",
  description: 'Pick a 30-min demo slot. We reply within 24 hours.',
};

const S = {
  hero: {
    background: BRAND.blue,
    color: BRAND.white,
    padding: '96px 24px 48px',
    textAlign: 'center' as const,
    borderBottom: `3px solid ${BRAND.yellow}`,
  } satisfies CSSProperties,
  h1: {
    fontFamily: FONT.display,
    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
    textTransform: 'uppercase' as const,
    margin: 0,
  } satisfies CSSProperties,
  sub: {
    fontFamily: FONT.body,
    fontSize: 18,
    maxWidth: 600,
    margin: '16px auto 0',
    opacity: 0.9,
  } satisfies CSSProperties,
  calWrap: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '48px 24px 96px',
  } satisfies CSSProperties,
};

export default function QuoteSubmittedPage() {
  return (
    <PublicLayout currentPath="/quote/submitted">
      <section style={S.hero}>
        <h1 style={S.h1}>Holy Cow — You&apos;re In!</h1>
        <p style={S.sub}>
          We&apos;ll reply with your exact rate within 24 hours. While you wait, grab a 30-min slot below.
        </p>
      </section>
      <section style={S.calWrap}>
        <DemoCalendar />
      </section>
    </PublicLayout>
  );
}
