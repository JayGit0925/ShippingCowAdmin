'use client';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { BRAND, px, pxSm } from '@/lib/brand';

export function Card({
  children,
  onClick,
  interactive: interactiveProp,
  style = {},
}: {
  children: ReactNode;
  onClick?: () => void;
  interactive?: boolean;
  style?: CSSProperties;
}) {
  const [hov, setHov] = useState(false);
  const interactive = interactiveProp ?? !!onClick;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: BRAND.white,
        border: `3px solid ${BRAND.charcoal}`,
        boxShadow: hov && interactive ? pxSm() : px(),
        transform: hov && interactive ? 'translate(2px, 2px)' : 'none',
        transition: 'box-shadow 0.08s, transform 0.08s',
        cursor: interactive ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
