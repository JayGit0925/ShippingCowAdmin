import { BRAND, pxSm } from '@/lib/brand';

const TIER = {
  calf: { label: 'CALF', bg: '#e5e7eb', color: BRAND.charcoal },
  cow: { label: 'COW', bg: BRAND.sky, color: BRAND.blue },
  bull: { label: 'BULL', bg: '#BBF7D0', color: '#166534' },
} as const;

const STATUS = {
  active: { label: 'ACTIVE', bg: '#BBF7D0', color: '#166534' },
  suspended: { label: 'SUSPENDED', bg: '#FEE2E2', color: '#991B1B' },
  deactivated: { label: 'DEACTIVATED', bg: '#e5e7eb', color: '#374151' },
  payment_failed: { label: 'FAILED', bg: '#FEF3C7', color: '#92400E' },
} as const;

const SEV = {
  critical: { label: 'CRITICAL', bg: '#D64545', color: '#fff' },
  high: { label: 'HIGH', bg: '#E0A000', color: '#fff' },
  medium: { label: 'MEDIUM', bg: '#0052C9', color: '#fff' },
  opportunity: { label: 'OPPORTUNITY', bg: '#1A7A4A', color: '#fff' },
  warning: { label: 'WARNING', bg: '#E0A000', color: '#fff' },
  low: { label: 'LOW', bg: '#e5e7eb', color: BRAND.charcoal },
} as const;

type TierValue = keyof typeof TIER;
type StatusValue = keyof typeof STATUS;
type SeverityValue = keyof typeof SEV;

export function Badge(
  props:
    | { type: 'tier'; value: TierValue }
    | { type: 'status'; value: StatusValue },
) {
  const cfg = props.type === 'tier' ? TIER[props.value] : STATUS[props.value];
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 9,
        padding: '3px 7px',
        background: cfg.bg,
        color: cfg.color,
        border: `2px solid ${BRAND.charcoal}`,
        boxShadow: pxSm(),
        letterSpacing: '0.04em',
      }}
    >
      {cfg.label}
    </span>
  );
}

export function SeverityBadge({ level }: { level: SeverityValue }) {
  const cfg = SEV[level];
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 8,
        padding: '3px 6px',
        background: cfg.bg,
        color: cfg.color,
        border: `2px solid ${BRAND.charcoal}`,
        letterSpacing: '0.03em',
      }}
    >
      {cfg.label}
    </span>
  );
}
