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
      },
      fontFamily: {
        display: ['Marcellus', 'Georgia', 'serif'],
        body: ['Jost', 'Mukta', 'system-ui', 'sans-serif'],
        np: ['Mukta', 'Jost', 'sans-serif'],
        mono: ['Spline Sans Mono', 'ui-monospace', 'monospace'],
      },
      animation: { bob: 'bob 2.6s ease-in-out infinite', marquee: 'marquee 28s linear infinite' },
      keyframes: { bob: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(9px)' } }, marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } } },
    },
  },
  plugins: [],
};
