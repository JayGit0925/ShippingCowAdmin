export const BRAND = {
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
} as const;

export const px = (c: string = BRAND.charcoal) => `4px 4px 0 ${c}`;
export const pxSm = (c: string = BRAND.charcoal) => `2px 2px 0 ${c}`;

export const FONT = {
  display: "'Black Han Sans', sans-serif",
  body: "'DM Sans', sans-serif",
  pixel: "'Press Start 2P', monospace",
} as const;
