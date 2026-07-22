/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  safelist: [
    {
      pattern:
        /^(bg|text|border|fill|stroke)-(ink|lime|coral|muted|cream|magenta|aqua|grape)$/,
    },
    { pattern: /^(bg|text|border|fill|stroke)-cream-2$/ },
    { pattern: /^(bg|text|border|fill|stroke)-lime-100$/ },
    { pattern: /^shadow-hard(-sm|-lg|-lime|-coral|-magenta|-aqua|-grape)?$/ },
    { pattern: /^decoration-(lime|coral|ink)$/ },
    { pattern: /^divide-(ink|cream|lime)$/ },
    { pattern: /^animate-(fade-up|fade-in)$/ },
    {
      pattern:
        /^(bg|text|border)-(ink|lime|coral|muted|cream)\/(5|10|20|30|40|50|60|70|80|90)$/,
    },
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          900: "#14532d",
          950: "#052e16",
        },
        cream: "rgb(var(--cream) / <alpha-value>)",
        "cream-2": "rgb(var(--cream-2) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        lime: "rgb(var(--lime) / <alpha-value>)",
        "lime-100": "rgb(var(--lime-100) / <alpha-value>)",
        coral: "rgb(var(--coral) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        magenta: "rgb(var(--magenta) / <alpha-value>)",
        aqua: "rgb(var(--aqua) / <alpha-value>)",
        grape: "rgb(var(--grape) / <alpha-value>)",
      },
      fontFamily: {
        sans: ['"Bricolage Grotesque"', "sans-serif"],
      },
      boxShadow: {
        hard: "4px 4px 0 0 rgb(var(--ink))",
        "hard-sm": "2px 2px 0 0 rgb(var(--ink))",
        "hard-lg": "6px 6px 0 0 rgb(var(--ink))",
        "hard-lime": "4px 4px 0 0 rgb(var(--lime))",
        "hard-coral": "4px 4px 0 0 rgb(var(--coral))",
        "hard-magenta": "4px 4px 0 0 rgb(var(--magenta))",
        "hard-aqua": "4px 4px 0 0 rgb(var(--aqua))",
        "hard-grape": "4px 4px 0 0 rgb(var(--grape))",
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease forwards",
        "fade-in": "fadeIn 0.3s ease forwards",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
