import type { CSSProperties, ReactNode } from 'react';
import { BRAND } from '@/lib/brand';

export function Eyebrow({
  children,
  style = {},
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 9,
        color: BRAND.blue,
        letterSpacing: '0.08em',
        display: 'block',
        marginBottom: 6,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
