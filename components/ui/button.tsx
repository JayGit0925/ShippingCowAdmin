'use client';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { BRAND, px } from '@/lib/brand';

type Variant = 'primary' | 'blue' | 'ghost' | 'danger' | 'dark';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, CSSProperties> = {
  primary: { background: BRAND.yellow, color: BRAND.charcoal, boxShadow: px() },
  blue: { background: BRAND.blue, color: BRAND.white, boxShadow: px() },
  ghost: { background: 'transparent', color: BRAND.charcoal, boxShadow: px() },
  danger: { background: BRAND.red, color: BRAND.white, boxShadow: px() },
  dark: { background: BRAND.charcoal, color: BRAND.yellow, boxShadow: `4px 4px 0 ${BRAND.blue}` },
};

const sizePad: Record<Size, string> = { sm: '6px 10px', md: '8px 14px', lg: '14px 24px' };
const sizeFs: Record<Size, number> = { sm: 9, md: 10, lg: 13 };

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  style = {},
}: {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  onClick?: () => void;
  disabled?: boolean;
  style?: CSSProperties;
}) {
  const [hov, setHov] = useState(false);
  const v = variants[variant];
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: sizeFs[size],
        padding: sizePad[size],
        border: `3px solid ${BRAND.charcoal}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'box-shadow 0.08s, transform 0.08s',
        letterSpacing: '0.03em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        ...v,
        boxShadow: hov && !disabled ? 'none' : v.boxShadow,
        transform: hov && !disabled ? 'translate(2px, 2px)' : 'none',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
