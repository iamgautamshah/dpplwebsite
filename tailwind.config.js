/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // The Day Sheet palette — cool polished-sheet greys, sindoor accent
        sheet: '#EDEFF2',
        card: '#F8F9FB',
        ink: '#14161A',
        body: '#3A4048',
        mute: '#6C737C',
        line: '#CDD2D8',
        vermilion: { DEFAULT: '#B5122E', deep: '#8E0E24', light: '#D0233C' },
        deep: '#14171C',
        // legacy names kept so untouched views stay coherent
        void: '#14171C',
        graphite: '#EDEFF2',
        panel: '#F8F9FB',
        silver: '#3A4048',
        silverhi: '#14161A',
        steel: '#6C737C',
        gold: { DEFAULT: '#B5122E', deep: '#8E0E24', light: '#D0233C' },
        ivory: '#F8F9FB',
      },
      fontFamily: {
        display: ['Space Grotesk', 'Helvetica Neue', 'sans-serif'],
        body: ['Source Serif 4', 'Georgia', 'serif'],
        np: ['Mukta', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      animation: { bob: 'bob 2.6s ease-in-out infinite', marquee: 'marquee 36s linear infinite' },
      keyframes: {
        bob: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(9px)' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
    },
  },
  plugins: [],
};
