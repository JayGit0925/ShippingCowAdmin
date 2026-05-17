import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#0052C9',
          yellow: '#FEB81B',
          charcoal: '#1A202C',
          muted: '#3a4454',
          'page-bed': '#F4F7FF',
          'mid-blue': '#3A7FDE',
          sky: '#B0C8F0',
          amber: '#E0A000',
          red: '#D64545',
          green: '#1A7A4A',
          teal: '#0D9488',
        },
      },
      fontFamily: {
        display: ["'Black Han Sans'", 'sans-serif'],
        body: ["'DM Sans'", 'sans-serif'],
        pixel: ["'Press Start 2P'", 'monospace'],
      },
      borderRadius: { none: '0' },
      boxShadow: {
        px: '4px 4px 0 #1A202C',
        'px-sm': '2px 2px 0 #1A202C',
      },
    },
  },
  plugins: [],
} satisfies Config;
