/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'rpg-bg':      'var(--rpg-bg)',
        'rpg-panel':   'var(--rpg-panel)',
        'rpg-accent':  'var(--rpg-accent)',
        'rpg-gold':    'var(--rpg-gold)',
        'rpg-danger':  'var(--rpg-danger)',
        'rpg-success': 'var(--rpg-success)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
