// tests/unit/brand.test.ts
import { describe, it, expect } from 'vitest';
import {
  BRAND,
  FONT,
  px,
  pxSm,
  BORDER_RADIUS,
  LETTER_SPACING,
  TYPOGRAPHY,
  SPACING,
  COLOR,
} from '@/lib/brand';

describe('BRAND — existing tokens unchanged', () => {
  it('blue is Cow Blue', () => expect(BRAND.blue).toBe('#0052C9'));
  it('yellow is Box Yellow', () => expect(BRAND.yellow).toBe('#FEB81B'));
  it('charcoal is Charcoal', () => expect(BRAND.charcoal).toBe('#1A202C'));
  it('pageBed is Page Bed', () => expect(BRAND.pageBed).toBe('#F4F7FF'));
});

describe('px / pxSm shadow helpers', () => {
  it('px() returns 4px pixel shadow in charcoal', () =>
    expect(px()).toBe('4px 4px 0 #1A202C'));
  it('pxSm() returns 2px pixel shadow in charcoal', () =>
    expect(pxSm()).toBe('2px 2px 0 #1A202C'));
  it('px(color) uses the supplied color', () =>
    expect(px('#FF0000')).toBe('4px 4px 0 #FF0000'));
});

describe('BORDER_RADIUS', () => {
  it('is 0', () => expect(BORDER_RADIUS).toBe(0));
});

describe('LETTER_SPACING', () => {
  it('display is 0.01em', () => expect(LETTER_SPACING.display).toBe('0.01em'));
  it('body is 0', () => expect(LETTER_SPACING.body).toBe('0'));
  it('pixel is 0.03em', () => expect(LETTER_SPACING.pixel).toBe('0.03em'));
});

describe('TYPOGRAPHY', () => {
  it('display uses Black Han Sans', () =>
    expect(TYPOGRAPHY.display.fontFamily).toContain('Black Han Sans'));
  it('display is uppercase', () =>
    expect(TYPOGRAPHY.display.textTransform).toBe('uppercase'));
  it('display lineHeight is 1.1', () =>
    expect(TYPOGRAPHY.display.lineHeight).toBe(1.1));
  it('body uses DM Sans', () =>
    expect(TYPOGRAPHY.body.fontFamily).toContain('DM Sans'));
  it('body lineHeight is 1.6', () =>
    expect(TYPOGRAPHY.body.lineHeight).toBe(1.6));
  it('label uses Press Start 2P', () =>
    expect(TYPOGRAPHY.label.fontFamily).toContain('Press Start 2P'));
  it('label is uppercase', () =>
    expect(TYPOGRAPHY.label.textTransform).toBe('uppercase'));
});

describe('SPACING', () => {
  it('xs is 4', () => expect(SPACING.xs).toBe(4));
  it('sm is 8', () => expect(SPACING.sm).toBe(8));
  it('md is 16', () => expect(SPACING.md).toBe(16));
  it('lg is 24', () => expect(SPACING.lg).toBe(24));
  it('xl is 48', () => expect(SPACING.xl).toBe(48));
});

describe('COLOR semantic aliases', () => {
  it('success maps to BRAND.green', () => expect(COLOR.success).toBe(BRAND.green));
  it('warning maps to BRAND.amber', () => expect(COLOR.warning).toBe(BRAND.amber));
  it('danger maps to BRAND.red',   () => expect(COLOR.danger).toBe(BRAND.red));
  it('info maps to BRAND.blue',    () => expect(COLOR.info).toBe(BRAND.blue));
});
