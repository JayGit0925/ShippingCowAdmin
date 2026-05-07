'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BRAND } from '@/lib/brand';

const NAV = [
  { id: 'dashboard', href: '/admin', label: 'Dashboard', icon: '◈' },
  { id: 'customers', href: '/admin/customers', label: 'Customers', icon: '◉' },
  { id: 'revenue', href: '/admin/revenue', label: 'Revenue', icon: '◆' },
  { id: 'reference', href: '/admin/reference', label: 'Rate Cards', icon: '⊞' },
  { id: 'platform', href: '/admin/platform', label: 'Platform', icon: '⊙' },
  { id: 'audit', href: '/admin/audit', label: 'Audit Log', icon: '≡' },
  { id: 'security', href: '/admin/security', label: 'Security', icon: '⊕' },
  { id: 'tickets', href: '/admin/tickets', label: 'Tickets', icon: '✉' },
] as const;

export function Sidebar() {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside
      style={{
        width: collapsed ? 60 : 220,
        minHeight: '100vh',
        background: BRAND.charcoal,
        display: 'flex',
        flexDirection: 'column',
        borderRight: `3px solid ${BRAND.charcoal}`,
        transition: 'width 0.18s',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: collapsed ? '16px 10px' : '20px 18px',
          borderBottom: '3px solid rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minHeight: 72,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            flexShrink: 0,
            background: BRAND.blue,
            border: `2px solid ${BRAND.yellow}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            boxShadow: `2px 2px 0 ${BRAND.yellow}`,
          }}
        >
          🐄
        </div>
        {!collapsed && (
          <div>
            <div
              style={{
                fontFamily: "'Black Han Sans', sans-serif",
                fontSize: 13,
                color: BRAND.white,
                textTransform: 'uppercase',
                lineHeight: 1.1,
              }}
            >
              SHIPPING<br />COW
            </div>
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: BRAND.yellow }}>
              {'// ADMIN'}
            </span>
          </div>
        )}
      </div>
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {NAV.map((item) => {
          const active = path === item.href || (item.href !== '/admin' && path.startsWith(item.href));
          return (
            <Link
              key={item.id}
              href={item.href}
              title={collapsed ? item.label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '12px 0' : '11px 18px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: active ? BRAND.blue : 'transparent',
                borderLeft: active ? `3px solid ${BRAND.yellow}` : '3px solid transparent',
                textDecoration: 'none',
              }}
            >
              <span style={{ fontSize: 16, color: active ? BRAND.yellow : BRAND.sky, flexShrink: 0 }}>
                {item.icon}
              </span>
              {!collapsed && (
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    color: active ? BRAND.white : 'rgba(255,255,255,0.75)',
                    flex: 1,
                  }}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          padding: '10px',
          background: 'transparent',
          color: BRAND.sky,
          border: 'none',
          borderTop: '3px solid rgba(255,255,255,0.12)',
          cursor: 'pointer',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8,
        }}
      >
        {collapsed ? '»' : '«  COLLAPSE'}
      </button>
    </aside>
  );
}
