'use client';
import type { CSSProperties } from 'react';
import { BRAND } from '@/lib/brand';

export function TabBar({
  tabs,
  active,
  onSelect,
  style = {},
}: {
  tabs: string[];
  active: string;
  onSelect: (tab: string) => void;
  style?: CSSProperties;
}) {
  return (
    <div style={{ display: 'flex', borderBottom: `3px solid ${BRAND.charcoal}`, ...style }}>
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onSelect(t)}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9,
            padding: '10px 14px',
            border: 'none',
            borderRight: `2px solid ${BRAND.charcoal}`,
            borderBottom: active === t ? `3px solid ${BRAND.yellow}` : '3px solid transparent',
            background: active === t ? BRAND.pageBed : BRAND.white,
            color: active === t ? BRAND.blue : BRAND.charcoal,
            cursor: 'pointer',
            letterSpacing: '0.04em',
            marginBottom: -3,
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
