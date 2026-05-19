# WS A — Brand Drift: Close lib/brand.ts vs Brandguide Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `lib/brand.ts` into complete parity with `brandguide/Shipping Cow Brand Guide _standalone_(1).html` by adding TYPOGRAPHY constants, semantic color aliases, SPACING scale, and BORDER_RADIUS sentinel, then unit-test everything added.

**Architecture:** All additions go into `lib/brand.ts` as new named exports — no new files, no breaking changes to existing exports. The `components/ui/button.tsx` already implements button variants correctly using `BRAND` + `px()` directly; this plan does NOT refactor it. Brand guide tokens are encoded as plain TypeScript constants so they're tree-shakeable and usable in both `style={{}}` and Tailwind theme.

**Tech Stack:** TypeScript strict · Vitest · `lib/brand.ts` · `tailwind.config.ts`

---

## Brandguide → brand.ts gap analysis

Current `lib/brand.ts` exports: `BRAND` (12 colors) · `px()` · `pxSm()` · `FONT` (3 families).

**Missing vs brandguide:**

| Gap | Details |
|-----|---------|
| Semantic color aliases | `success`, `warning`, `danger` aliases to `BRAND.green`, `BRAND.amber`, `BRAND.red` |
| `TYPOGRAPHY` constant | Display: Black Han Sans 400, UPPERCASE, letter-spacing +0.01em, line-height 1.1 · Body: DM Sans 400/500/700, sentence case, ls 0, lh 1.6 · Label: Press Start 2P ALL CAPS |
| `SPACING` scale | xs=4 sm=8 md=16 lg=24 xl=48 (px integers matching brandguide section padding) |
| `BORDER_RADIUS` | `0` — explicit sentinel, enforces zero-radius globally, safe to use in Tailwind theme |
| `LETTER_SPACING` | `display: '0.01em'`, `body: '0'`, `pixel: '0.03em'` (from button.tsx usage) |

The 12 hex colors in `BRAND` already match the brandguide exactly. Shadow helpers `px()`/`pxSm()` match. Font family strings in `FONT` match. No colors need changing.

---

## Task 1: Read the brandguide and confirm token values

**Files:**
- Read: `brandguide/Shipping Cow Brand Guide _standalone_(1).html`
- Read: `lib/brand.ts`

- [ ] **Step 1: Open both files side-by-side and confirm these exact values match the brandguide**

Open `brandguide/Shipping Cow Brand Guide _standalone_(1).html` in a browser or text editor. Verify each token in the table below against what the guide renders:

| Token | Expected value | In brand.ts? |
|-------|---------------|--------------|
| Cow Blue | `#0052C9` | ✓ `BRAND.blue` |
| Box Yellow | `#FEB81B` | ✓ `BRAND.yellow` |
| Charcoal | `#1A202C` | ✓ `BRAND.charcoal` |
| Page Bed | `#F4F7FF` | ✓ `BRAND.pageBed` |
| Mid Blue | `#3A7FDE` | ✓ `BRAND.midBlue` |
| Sky | `#B0C8F0` | ✓ `BRAND.sky` |
| Amber | `#E0A000` | ✓ `BRAND.amber` |
| Green (success) | `#1A7A4A` | ✓ `BRAND.green` |
| Red (danger) | `#D64545` | ✓ `BRAND.red` |
| Teal | `#0D9488` | ✓ `BRAND.teal` |
| Display font | Black Han Sans | ✓ `FONT.display` |
| Body font | DM Sans | ✓ `FONT.body` |
| Pixel font | Press Start 2P | ✓ `FONT.pixel` |
| Pixel shadow | 4px 4px 0 charcoal | ✓ `px()` |
| Sm pixel shadow | 2px 2px 0 charcoal | ✓ `pxSm()` |

If any value differs from the guide, note the correct value before proceeding to Task 2.

- [ ] **Step 2: Note any additional tokens in the guide NOT in this table**

Write them down — they'll be added in Task 2.

---

## Task 2: Add TYPOGRAPHY, SPACING, BORDER_RADIUS, LETTER_SPACING, semantic aliases

**Files:**
- Modify: `lib/brand.ts`

- [ ] **Step 1: Add the new exports to `lib/brand.ts`**

Open `lib/brand.ts`. After the existing `FONT` export, append:

```typescript
export const BORDER_RADIUS = 0 as const;

export const LETTER_SPACING = {
  display: '0.01em',
  body: '0',
  pixel: '0.03em',
} as const;

export const TYPOGRAPHY = {
  display: {
    fontFamily: FONT.display,
    fontWeight: 400,
    textTransform: 'uppercase' as const,
    letterSpacing: LETTER_SPACING.display,
    lineHeight: 1.1,
  },
  body: {
    fontFamily: FONT.body,
    fontWeight: 400,
    letterSpacing: LETTER_SPACING.body,
    lineHeight: 1.6,
  },
  bodyBold: {
    fontFamily: FONT.body,
    fontWeight: 700,
    letterSpacing: LETTER_SPACING.body,
    lineHeight: 1.6,
  },
  label: {
    fontFamily: FONT.pixel,
    textTransform: 'uppercase' as const,
    letterSpacing: LETTER_SPACING.pixel,
    lineHeight: 1.4,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 48,
} as const;

// Semantic aliases — use these in component logic for semantic intent,
// use BRAND.* directly for design-token fidelity in style={{}} blocks.
export const COLOR = {
  success: BRAND.green,
  warning: BRAND.amber,
  danger: BRAND.red,
  info: BRAND.blue,
  muted: BRAND.muted,
} as const;
```

- [ ] **Step 2: Run typecheck to confirm no errors**

```bash
npm run typecheck
```

Expected: exit 0, no errors.

---

## Task 3: Unit test the new exports

**Files:**
- Create: `tests/unit/brand.test.ts`

- [ ] **Step 1: Write the tests**

```typescript
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
```

- [ ] **Step 2: Run — verify FAIL (module not exported yet)**

```bash
npx vitest run tests/unit/brand.test.ts
```

Expected: import errors for `BORDER_RADIUS`, `LETTER_SPACING`, `TYPOGRAPHY`, `SPACING`, `COLOR`.

- [ ] **Step 3: Confirm Task 2's additions are saved, then re-run**

```bash
npx vitest run tests/unit/brand.test.ts
```

Expected: all 24 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/brand.ts tests/unit/brand.test.ts
git commit -m "feat(brand): add TYPOGRAPHY, SPACING, COLOR, BORDER_RADIUS, LETTER_SPACING"
```

---

## Task 4: Extend Tailwind theme with new tokens

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Check what's already in the theme**

```bash
cat tailwind.config.ts
```

Note which `BRAND.*` tokens are already mapped to Tailwind utilities (e.g. `colors.brand-blue`, `boxShadow.px`).

- [ ] **Step 2: Add missing utilities for the new constants**

In `tailwind.config.ts`, inside `theme.extend`, add any of these that are missing:

```typescript
// Inside theme.extend:
spacing: {
  'xs': '4px',
  'sm-brand': '8px',   // 'sm' is reserved by Tailwind default scale
  'md-brand': '16px',
  'lg-brand': '24px',
  'xl-brand': '48px',
},
borderRadius: {
  'none': '0px',       // reinforce zero-radius default
},
letterSpacing: {
  'display': '0.01em',
  'pixel':   '0.03em',
},
lineHeight: {
  'display': '1.1',
  'body':    '1.6',
},
```

- [ ] **Step 3: Build to confirm no Tailwind errors**

```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat(tailwind): add spacing, letterSpacing, lineHeight tokens from brandguide"
```

---

## Self-Review

**Spec coverage:**
- All 12 BRAND hex values confirmed → Task 1 ✓
- TYPOGRAPHY added + tested → Tasks 2-3 ✓
- SPACING added + tested → Tasks 2-3 ✓
- BORDER_RADIUS added + tested → Tasks 2-3 ✓
- LETTER_SPACING added + tested → Tasks 2-3 ✓
- COLOR semantic aliases added + tested → Tasks 2-3 ✓
- Tailwind theme extended → Task 4 ✓

**Placeholder scan:** none — exact hex values, exact constant names, exact test assertions throughout.

**Type consistency:** `BORDER_RADIUS = 0 as const`, `LETTER_SPACING`, `TYPOGRAPHY`, `SPACING`, `COLOR` all use `as const` for TypeScript literal inference. All test imports match the export names exactly.
