
// Sidebar navigation for ShippingCow Admin Portal

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',    icon: '◈', badge: null },
  { id: 'customers',  label: 'Customers',    icon: '◉', badge: 3 },
  { id: 'revenue',    label: 'Revenue',      icon: '◆', badge: 5 },
  { id: 'reference',  label: 'Rate Cards',   icon: '⊞', badge: null },
  { id: 'platform',   label: 'Platform',     icon: '⊙', badge: 1 },
  { id: 'audit',      label: 'Audit Log',    icon: '≡', badge: null },
  { id: 'security',   label: 'Security',     icon: '⊕', badge: 2 },
];

function Sidebar({ active, onNavigate, collapsed = false }) {
  const { BRAND, pixelShadow, Eyebrow } = window;

  return (
    <aside style={{
      width: collapsed ? '60px' : '220px',
      minHeight: '100vh',
      background: BRAND.charcoal,
      display: 'flex',
      flexDirection: 'column',
      borderRight: `3px solid ${BRAND.charcoal}`,
      transition: 'width 0.18s ease',
      flexShrink: 0,
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Logo / Brand */}
      <div style={{
        padding: collapsed ? '16px 10px' : '20px 18px',
        borderBottom: `3px solid rgba(255,255,255,0.12)`,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minHeight: '72px',
      }}>
        {/* Pixel cow icon */}
        <div style={{
          width: '32px', height: '32px', flexShrink: 0,
          background: BRAND.blue,
          border: `2px solid ${BRAND.yellow}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px',
          imageRendering: 'pixelated',
          boxShadow: `2px 2px 0 ${BRAND.yellow}`,
        }}>🐄</div>
        {!collapsed && (
          <div>
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: '13px',
              color: BRAND.white,
              letterSpacing: '0.04em',
              lineHeight: 1.1,
              textTransform: 'uppercase',
            }}>SHIPPING<br/>COW</div>
            <span style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '7px',
              color: BRAND.yellow,
              letterSpacing: '0.06em',
            }}>// ADMIN</span>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: collapsed ? '12px 0' : '11px 18px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: isActive ? BRAND.blue : 'transparent',
                border: 'none',
                borderLeft: isActive ? `3px solid ${BRAND.yellow}` : '3px solid transparent',
                cursor: 'pointer',
                transition: 'background 0.1s',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{
                fontSize: '16px',
                color: isActive ? BRAND.yellow : BRAND.sky,
                lineHeight: 1,
                flexShrink: 0,
              }}>{item.icon}</span>
              {!collapsed && (
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px',
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? BRAND.white : 'rgba(255,255,255,0.75)',
                  letterSpacing: '0.01em',
                  flex: 1,
                  textAlign: 'left',
                }}>{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '8px',
                  background: BRAND.red,
                  color: BRAND.white,
                  padding: '2px 5px',
                  border: `2px solid ${BRAND.charcoal}`,
                  minWidth: '20px',
                  textAlign: 'center',
                }}>{item.badge}</span>
              )}
              {collapsed && item.badge && (
                <span style={{
                  position: 'absolute',
                  top: '6px', right: '6px',
                  width: '8px', height: '8px',
                  background: BRAND.red,
                  border: `1px solid ${BRAND.charcoal}`,
                  borderRadius: '0',
                }}></span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Admin user info */}
      <div style={{
        padding: collapsed ? '12px 8px' : '14px 16px',
        borderTop: `3px solid rgba(255,255,255,0.12)`,
      }}>
        {!collapsed ? (
          <div>
            <div style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '7px',
              color: BRAND.sky,
              letterSpacing: '0.05em',
              marginBottom: '4px',
            }}>// SUPER-ADMIN</div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '12px',
              color: 'rgba(255,255,255,0.8)',
              marginBottom: '10px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>founder@shippingcow.com</div>
            <button style={{
              width: '100%',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '8px',
              padding: '7px',
              background: 'transparent',
              border: `2px solid rgba(255,255,255,0.25)`,
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}>SIGN OUT</button>
          </div>
        ) : (
          <div style={{
            width: '32px', height: '32px',
            background: BRAND.blue,
            border: `2px solid ${BRAND.sky}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', color: BRAND.white,
            margin: '0 auto',
          }}>F</div>
        )}
      </div>
    </aside>
  );
}

Object.assign(window, { Sidebar, NAV_ITEMS });
