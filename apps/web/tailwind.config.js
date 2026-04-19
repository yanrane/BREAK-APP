/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  safelist: [
    { pattern: /^(bg|text|border|fill|stroke)-(ink|lime|coral|muted|cream)$/ },
    { pattern: /^(bg|text|border|fill|stroke)-cream-2$/ },
    { pattern: /^(bg|text|border|fill|stroke)-lime-100$/ },
    { pattern: /^shadow-hard(-sm|-lg|-lime|-coral)?$/ },
    { pattern: /^decoration-(lime|coral|ink)$/ },
    { pattern: /^divide-(ink|cream|lime)$/ },
    { pattern: /^animate-(fade-up|fade-in)$/ },
    { pattern: /^(bg|text|border)-(ink|lime|coral|muted|cream)\/(5|10|20|30|40|50|60|70|80|90)$/ },
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d',
          950: '#052e16',
        },
        cream: '#F8F4EC',
        'cream-2': '#EDE8DC',
        ink: '#13120E',
        lime: '#C2F13B',
        'lime-100': '#EBF9C0',
        coral: '#F04D25',
        muted: '#857F6F',
      },
      fontFamily: {
        sans: ['"Bricolage Grotesque"', 'sans-serif'],
      },
      boxShadow: {
        hard: '4px 4px 0 0 #13120E',
        'hard-sm': '2px 2px 0 0 #13120E',
        'hard-lg': '6px 6px 0 0 #13120E',
        'hard-lime': '4px 4px 0 0 #C2F13B',
        'hard-coral': '4px 4px 0 0 #F04D25',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
