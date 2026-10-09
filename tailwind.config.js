/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Redefining navy to black/neutral to apply the Spendly theme globally
        navy: {
          900: '#000000', // Pure black background
          800: '#0a0a0a', // Slightly lighter for cards
          700: '#171717', // Hover states
        },
        slate: {
          900: '#171717',
          800: '#262626',
          700: '#404040',
        },
        // Redefining mint to orange to match the Spendly accent
        mint: {
          400: '#f97316', // Orange-500
          500: '#ea580c', // Orange-600
        }
      }
    },
  },
  plugins: [],
}
