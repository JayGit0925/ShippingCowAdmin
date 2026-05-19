export const BRAND = {
  blue: '#0052C9',
  yellow: '#FEB81B',
  charcoal: '#1A202C',
  muted: '#3a4454',
  pageBed: '#F4F7FF',
  midBlue: '#3A7FDE',
  sky: '#B0C8F0',
  amber: '#E0A000',
  white: '#FFFFFF',
  red: '#D64545',
  green: '#1A7A4A',
  teal: '#0D9488',
} as const;

export const px = (c: string = BRAND.charcoal) => `4px 4px 0 ${c}`;
export const pxSm = (c: string = BRAND.charcoal) => `2px 2px 0 ${c}`;

export const FONT = {
  display: "'Black Han Sans', sans-serif",
  body: "'DM Sans', sans-serif",
  pixel: "'Press Start 2P', monospace",
} as const;

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

export const COLOR = {
  success: BRAND.green,
  warning: BRAND.amber,
  danger: BRAND.red,
  info: BRAND.blue,
  muted: BRAND.muted,
} as const;
