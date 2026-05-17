// Shared formatting helpers — used by calculator components.
// No side effects; all functions are pure.

/**
 * Format a number with 1 decimal place.
 * Used by _dim-calculator (DIM weight display).
 */
export function fmt1(n: number): string {
  return n.toFixed(1);
}

/**
 * Format a number as dollars with a $ prefix.
 * For values >= 1000 uses compact K notation (e.g. $1.2K).
 * For values < 1000 uses 2 decimal places (e.g. $45.30).
 * Used by _dim-calculator (savings callout).
 */
export function fmtDollar(n: number): string {
  if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'K';
  return '$' + n.toFixed(2);
}

/**
 * Format a number as integer dollars with a $ prefix and locale separators.
 * Rounds to nearest integer (e.g. $1,234).
 * Used by _shrink-calculator (revenue / profit / totals).
 */
export function fmtInt(n: number): string {
  return '$' + Math.round(n).toLocaleString();
}

/**
 * Format a number as 2-decimal dollars with a $ prefix (e.g. $17.90).
 * Used by _shrink-calculator (per-label rates).
 */
export function fmtDollar2(n: number): string {
  return '$' + n.toFixed(2);
}
