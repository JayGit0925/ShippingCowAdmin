import { BRAND } from '@/lib/brand';

export function TrendArrow({ value }: { value: number }) {
  return (
    <span style={{ color: value >= 0 ? BRAND.green : BRAND.red, fontSize: 18, lineHeight: 1 }}>
      {value >= 0 ? '▲' : '▼'}
    </span>
  );
}
