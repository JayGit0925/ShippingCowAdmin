import { BRAND } from '@/lib/brand';

export type SeriesPoint = { x: string; y: number };

export function Sparkline({
  series,
  width = 600,
  height = 200,
  stroke = BRAND.blue,
  label = '',
}: {
  series: SeriesPoint[];
  width?: number;
  height?: number;
  stroke?: string;
  label?: string;
}) {
  if (series.length === 0) {
    return (
      <div
        style={{
          background: BRAND.white,
          border: `3px solid ${BRAND.charcoal}`,
          boxShadow: `4px 4px 0 ${BRAND.charcoal}`,
          padding: 24,
          textAlign: 'center',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: BRAND.charcoal,
        }}
      >
        No data yet.
      </div>
    );
  }

  const padX = 28;
  const padY = 14;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const ys = series.map((p) => p.y);
  const minY = Math.min(0, ...ys);
  const maxY = Math.max(1, ...ys);
  const range = maxY - minY || 1;
  const step = innerW / Math.max(1, series.length - 1);

  const points = series.map((p, i) => {
    const x = padX + i * step;
    const y = padY + innerH - ((p.y - minY) / range) * innerH;
    return { x, y, raw: p };
  });

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <div
      style={{
        background: BRAND.white,
        border: `3px solid ${BRAND.charcoal}`,
        boxShadow: `4px 4px 0 ${BRAND.charcoal}`,
        padding: 14,
      }}
    >
      {label ? (
        <div
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9,
            color: BRAND.blue,
            letterSpacing: '0.04em',
            marginBottom: 6,
          }}
        >
          {label}
        </div>
      ) : null}
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label || 'sparkline'}>
        <path d={path} fill="none" stroke={stroke} strokeWidth={3} />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill={stroke} />
        ))}
        {/* X-axis ticks: first, mid, last */}
        {[points[0], points[Math.floor(points.length / 2)], points[points.length - 1]].map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={height - 2}
            fontFamily="'Press Start 2P', monospace"
            fontSize="8"
            fill={BRAND.charcoal}
            textAnchor="middle"
          >
            {p.raw.x}
          </text>
        ))}
      </svg>
    </div>
  );
}
