/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // THE DESK — an instrument panel for a metal that trades daily
        base: '#070A0F',
        panel: '#0D121A',
        raised: '#131A24',
        line: '#1F2A38',
        text: '#E8EEF6',
        mute: '#8A97A8',
        signal: { DEFAULT: '#4DA3FF', dim: '#2E6FB8', light: '#7CC0FF' },
        sale: '#FFC46B',
        buy: '#5CD6A5',
        // legacy names remapped so untouched views stay coherent
        void: '#070A0F',
        sheet: '#070A0F',
        card: '#0D121A',
        ink: '#E8EEF6',
        body: '#B7C2D0',
        graphite: '#070A0F',
        silver: '#B7C2D0',
        silverhi: '#E8EEF6',
        steel: '#8A97A8',
        gold: { DEFAULT: '#4DA3FF', deep: '#2E6FB8', light: '#7CC0FF' },
        vermilion: { DEFAULT: '#4DA3FF', deep: '#2E6FB8', light: '#7CC0FF' },
        ivory: '#0D121A',
        deep: '#070A0F',
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        body: ['Sora', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        np: ['Mukta', 'Sora', 'sans-serif'],
      },
      animation: {
        bob: 'bob 2.6s ease-in-out infinite',
        marquee: 'marquee 40s linear infinite',
        sweep: 'sweep 3.5s ease-in-out infinite',
      },
      keyframes: {
        bob: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(9px)' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        sweep: { '0%,100%': { opacity: 0.15 }, '50%': { opacity: 0.5 } },
      },
    },
  },
  plugins: [],
};
