/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Use RGB channel format so Tailwind opacity modifiers work (bg-rpg-accent/20 etc.)
        'rpg-bg':      'rgb(var(--rpg-bg) / <alpha-value>)',
        'rpg-panel':   'rgb(var(--rpg-panel) / <alpha-value>)',
        'rpg-accent':  'rgb(var(--rpg-accent) / <alpha-value>)',
        'rpg-gold':    'rgb(var(--rpg-gold) / <alpha-value>)',
        'rpg-danger':  'rgb(var(--rpg-danger) / <alpha-value>)',
        'rpg-success': 'rgb(var(--rpg-success) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
