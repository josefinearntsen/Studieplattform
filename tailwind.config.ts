import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FAFAF9',
        ink: '#1C1C1E',
        muted: '#6B6B6E',
        line: '#E7E5E4',
        accent: '#3F5B87',
        accentSoft: '#EAF0F8',
        warn: '#B5651D',
        warnSoft: '#FBF0E4',
        good: '#3F7A5B',
        goodSoft: '#EAF4EE',
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(28,28,30,0.04), 0 6px 20px rgba(28,28,30,0.05)',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
