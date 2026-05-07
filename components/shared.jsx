
// Shared utilities, tokens, and micro-components for ShippingCow Admin Portal

const BRAND = {
  blue: '#0052C9',
  yellow: '#FEB81B',
  charcoal: '#1A202C',
  pageBed: '#F4F7FF',
  midBlue: '#3A7FDE',
  sky: '#B0C8F0',
  amber: '#E0A000',
  white: '#FFFFFF',
  red: '#D64545',
  green: '#1A7A4A',
  teal: '#0D9488',
};

// Pixel shadow utility
const pixelShadow = (color = BRAND.charcoal) => `4px 4px 0 ${color}`;
const pixelShadowSm = (color = BRAND.charcoal) => `2px 2px 0 ${color}`;

// Tier badge config
const TIER_CONFIG = {
  calf: { label: 'CALF', bg: '#e5e7eb', color: BRAND.charcoal },
  cow:  { label: 'COW',  bg: BRAND.sky,  color: BRAND.blue },
  bull: { label: 'BULL', bg: '#BBF7D0',  color: '#166534' },
};

// Status badge config
const STATUS_CONFIG = {
  active:      { label: 'ACTIVE',      bg: '#BBF7D0', color: '#166534' },
  suspended:   { label: 'SUSPENDED',   bg: '#FEE2E2', color: '#991B1B' },
  deactivated: { label: 'DEACTIVATED', bg: '#e5e7eb', color: '#374151' },
  payment_failed: { label: 'FAILED',   bg: '#FEF3C7', color: '#92400E' },
};

// Pixel badge component
function Badge({ type = 'tier', value, style = {} }) {
  const cfg = type === 'tier' ? TIER_CONFIG[value] : STATUS_CONFIG[value];
  if (!cfg) return null;
  return (
    <span style={{
      display: 'inline-block',
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '9px',
      padding: '3px 7px',
      background: cfg.bg,
      color: cfg.color,
      border: `2px solid ${BRAND.charcoal}`,
      boxShadow: pixelShadowSm(),
      letterSpacing: '0.04em',
      ...style
    }}>{cfg.label}</span>
  );
}

// Severity badge for alerts
const SEVERITY_CONFIG = {
  critical: { label: 'CRITICAL', bg: '#D64545', color: '#fff' },
  high:     { label: 'HIGH',     bg: '#E0A000', color: '#fff' },
  medium:   { label: 'MEDIUM',   bg: '#0052C9', color: '#fff' },
  low:      { label: 'LOW',      bg: '#e5e7eb', color: BRAND.charcoal },
};

function SeverityBadge({ level }) {
  const cfg = SEVERITY_CONFIG[level] || SEVERITY_CONFIG.low;
  return (
    <span style={{
      display: 'inline-block',
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '8px',
      padding: '3px 6px',
      background: cfg.bg,
      color: cfg.color,
      border: `2px solid ${BRAND.charcoal}`,
      letterSpacing: '0.03em',
    }}>{cfg.label}</span>
  );
}

// Generic action button
function Btn({ children, variant = 'primary', size = 'md', onClick, style = {}, disabled = false }) {
  const base = {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: size === 'sm' ? '9px' : size === 'lg' ? '13px' : '10px',
    padding: size === 'sm' ? '6px 10px' : size === 'lg' ? '14px 24px' : '8px 14px',
    border: `3px solid ${BRAND.charcoal}`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'box-shadow 0.08s, transform 0.08s',
    letterSpacing: '0.03em',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    position: 'relative',
  };
  const variants = {
    primary:  { background: BRAND.yellow,  color: BRAND.charcoal, boxShadow: pixelShadow() },
    blue:     { background: BRAND.blue,    color: BRAND.white,    boxShadow: pixelShadow() },
    ghost:    { background: 'transparent', color: BRAND.charcoal, boxShadow: pixelShadow() },
    danger:   { background: BRAND.red,     color: BRAND.white,    boxShadow: pixelShadow() },
    dark:     { background: BRAND.charcoal,color: BRAND.yellow,   boxShadow: `4px 4px 0 ${BRAND.blue}` },
  };
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...base, ...variants[variant], ...style,
        boxShadow: hovered && !disabled ? 'none' : variants[variant].boxShadow,
        transform: hovered && !disabled ? 'translate(2px,2px)' : 'none',
      }}
    >{children}</button>
  );
}

// Pixel-style input
function Input({ label, value, onChange, placeholder, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && <label style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: BRAND.blue, letterSpacing: '0.05em' }}>{label}</label>}
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px',
          padding: '8px 10px',
          border: `3px solid ${BRAND.charcoal}`,
          background: BRAND.white,
          outline: 'none',
          color: BRAND.charcoal,
          ...style
        }}
      />
    </div>
  );
}

// Section eyebrow label
function Eyebrow({ children, style = {} }) {
  return (
    <span style={{
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '9px',
      color: BRAND.blue,
      letterSpacing: '0.08em',
      display: 'block',
      marginBottom: '6px',
      ...style
    }}>{children}</span>
  );
}

// Card container
function Card({ children, style = {}, onClick }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: BRAND.white,
        border: `3px solid ${BRAND.charcoal}`,
        boxShadow: hovered && onClick ? pixelShadowSm() : pixelShadow(),
        transform: hovered && onClick ? 'translate(2px,2px)' : 'none',
        transition: 'box-shadow 0.08s, transform 0.08s',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
    >{children}</div>
  );
}

// Trend arrow
function TrendArrow({ value }) {
  const up = value >= 0;
  return (
    <span style={{ color: up ? BRAND.green : BRAND.red, fontSize: '18px', lineHeight: 1 }}>
      {up ? '▲' : '▼'}
    </span>
  );
}

// Tab bar
function TabBar({ tabs, active, onSelect, style = {} }) {
  return (
    <div style={{ display: 'flex', gap: '0', borderBottom: `3px solid ${BRAND.charcoal}`, ...style }}>
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => onSelect(t)}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '9px',
            padding: '10px 14px',
            border: 'none',
            borderRight: `2px solid ${BRAND.charcoal}`,
            borderBottom: active === t ? `3px solid ${BRAND.yellow}` : '3px solid transparent',
            background: active === t ? BRAND.pageBed : BRAND.white,
            color: active === t ? BRAND.blue : BRAND.charcoal,
            cursor: 'pointer',
            letterSpacing: '0.04em',
            marginBottom: '-3px',
          }}
        >{t}</button>
      ))}
    </div>
  );
}

// Expose to window
Object.assign(window, {
  BRAND, pixelShadow, pixelShadowSm,
  Badge, SeverityBadge, Btn, Input, Eyebrow, Card, TrendArrow, TabBar,
  TIER_CONFIG, STATUS_CONFIG, SEVERITY_CONFIG,
});
