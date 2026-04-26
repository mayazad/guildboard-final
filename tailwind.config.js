/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'rpg-bg':      '#0f172a',
        'rpg-panel':   '#1e293b',
        'rpg-accent':  '#3b82f6',
        'rpg-gold':    '#fbbf24',
        'rpg-danger':  '#ef4444',
        'rpg-success': '#22c55e',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
