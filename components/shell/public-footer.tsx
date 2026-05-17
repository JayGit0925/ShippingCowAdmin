import type { CSSProperties } from 'react';
import { BRAND, FONT } from '@/lib/brand';

const S = {
  footer: {
    background: BRAND.charcoal,
    color: BRAND.white,
    padding: '32px 24px',
    fontFamily: FONT.pixel,
    fontSize: 8,
    lineHeight: 1.8,
    letterSpacing: '0.06em',
    textAlign: 'center' as const,
    borderTop: `3px solid ${BRAND.yellow}`,
  } satisfies CSSProperties,

  link: {
    color: BRAND.yellow,
    textDecoration: 'none',
  } satisfies CSSProperties,
};

export function PublicFooter() {
  return (
    <footer style={S.footer}>
      © 2026 ShippingCow — Built for heavy-item sellers · <a href="mailto:jay@shippingcow.ai" style={S.link}>jay@shippingcow.ai</a>
    </footer>
  );
}
