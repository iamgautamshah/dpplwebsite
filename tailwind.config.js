/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: '#050810',
        graphite: '#101520',
        panel: '#0C111C',
        silver: '#C9D1DE',
        silverhi: '#EEF1F6',
        steel: '#6B7890',
        gold: { DEFAULT: '#D8B36A', deep: '#B8934A', light: '#E9CA85' },
        ivory: '#F4F0E6',
        // aliases used by the journal, legal and 404 views
        base: '#101520',
        sheet: '#101520',
        card: '#0C111C',
        raised: '#141A28',
        line: '#1E2634',
        text: '#EEF1F6',
        body: '#C9D1DE',
        mute: '#6B7890',
        signal: { DEFAULT: '#D8B36A', dim: '#B8934A', light: '#E9CA85' },
        vermilion: { DEFAULT: '#D8B36A', deep: '#B8934A', light: '#E9CA85' },
        sale: '#D8B36A',
        buy: '#9FD8B4',
        deep: '#050810',
      },
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        body: ['Manrope', 'Mukta', 'system-ui', 'sans-serif'],
        np: ['Mukta', 'Manrope', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      animation: { bob: 'bob 2.6s ease-in-out infinite', marquee: 'marquee 28s linear infinite' },
      keyframes: { bob: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(9px)' } }, marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } } },
    },
  },
  plugins: [],
};
