import { describe, it, expect } from 'vitest';
import { fmt1, fmtDollar, fmtInt, fmtDollar2 } from '@/lib/fmt';

// ─── fmt1 ─────────────────────────────────────────────────────────────────────

describe('fmt1', () => {
  it('formats integer as one decimal place', () => {
    expect(fmt1(3)).toBe('3.0');
  });

  it('formats fractional number to one decimal place', () => {
    expect(fmt1(3.456)).toBe('3.5');
  });

  it('formats negative number correctly', () => {
    expect(fmt1(-2.7)).toBe('-2.7');
  });
});

// ─── fmtDollar ────────────────────────────────────────────────────────────────

describe('fmtDollar', () => {
  it('formats values under 1000 as 2-decimal dollars', () => {
    expect(fmtDollar(45.3)).toBe('$45.30');
  });

  it('formats values >= 1000 with K notation (1 decimal)', () => {
    expect(fmtDollar(1200)).toBe('$1.2K');
  });

  it('formats exactly 1000 with K notation', () => {
    expect(fmtDollar(1000)).toBe('$1.0K');
  });

  it('formats negative value under 1000 correctly', () => {
    expect(fmtDollar(-5)).toBe('$-5.00');
  });
});

// ─── fmtInt ───────────────────────────────────────────────────────────────────

describe('fmtInt', () => {
  it('formats integer with $ prefix and locale separators', () => {
    expect(fmtInt(1234)).toBe('$1,234');
  });

  it('rounds to nearest integer before formatting', () => {
    expect(fmtInt(1234.7)).toBe('$1,235');
  });

  it('formats small value without separator', () => {
    expect(fmtInt(42)).toBe('$42');
  });

  it('formats negative value correctly', () => {
    expect(fmtInt(-500)).toBe('$-500');
  });
});

// ─── fmtDollar2 ───────────────────────────────────────────────────────────────

describe('fmtDollar2', () => {
  it('formats number as 2-decimal dollars', () => {
    expect(fmtDollar2(17.9)).toBe('$17.90');
  });

  it('formats whole number with trailing zeros', () => {
    expect(fmtDollar2(5)).toBe('$5.00');
  });

  it('formats negative value correctly', () => {
    expect(fmtDollar2(-3.5)).toBe('$-3.50');
  });
});
