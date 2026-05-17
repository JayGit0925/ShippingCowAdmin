import type { CSSProperties } from 'react';
import { BRAND, pxSm, FONT } from '@/lib/brand';

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

  navCenter: {
    display: 'flex',
    gap: 32,
    alignItems: 'center',
  } satisfies CSSProperties,

  navLink: {
    fontFamily: FONT.body,
    fontSize: 13,
    color: BRAND.white,
    textDecoration: 'none',
  } satisfies CSSProperties,

  navRight: {
    display: 'flex',
    gap: 16,
    alignItems: 'center',
  } satisfies CSSProperties,

  navLogin: {
    fontFamily: FONT.pixel,
    fontSize: 9,
    color: BRAND.white,
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
};

export function PublicNav({ currentPath }: { currentPath?: string }) {
  return (
    <nav style={S.nav} aria-label="Main navigation">
      <a href="/" style={S.navLogo}>ShippingCow</a>
      <div style={S.navCenter}>
        <a href="/how-it-works" style={S.navLink}>How it works</a>
        <a href="/pricing" style={S.navLink}>Pricing</a>
      </div>
      <div style={S.navRight}>
        <a href="/login" style={S.navLogin}>Login</a>
        <a href={currentPath === '/' ? '#quote' : '/'} style={S.navCta}>Get a Quote →</a>
      </div>
    </nav>
  );
}
