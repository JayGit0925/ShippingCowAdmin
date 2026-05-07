'use client';
import { usePathname } from 'next/navigation';
import { BRAND } from '@/lib/brand';

const LABELS: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/customers': 'Customers',
  '/admin/revenue': 'Revenue',
  '/admin/reference': 'Rate Cards',
  '/admin/platform': 'Platform',
  '/admin/audit': 'Audit Log',
  '/admin/security': 'Security',
  '/admin/tickets': 'Tickets',
};

export function Topbar() {
  const path = usePathname();
  const label = LABELS[path] ?? 'Admin';
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return (
    <header
      style={{
        height: 60,
        background: BRAND.white,
        borderBottom: `3px solid ${BRAND.charcoal}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9,
            color: BRAND.blue,
            letterSpacing: '0.08em',
          }}
        >
          ADMIN /
        </span>
        <span
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 18,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 8,
              height: 8,
              background: BRAND.green,
              border: `1px solid ${BRAND.charcoal}`,
            }}
          />
          <span
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 8,
              color: BRAND.charcoal,
            }}
          >
            SYSTEM OK
          </span>
        </span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: BRAND.charcoal }}>
          {today}
        </span>
      </div>
    </header>
  );
}
