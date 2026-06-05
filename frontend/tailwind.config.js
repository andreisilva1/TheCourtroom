/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wood-dark': '#2b1a10',
        'wood': '#3d2817',
        'wood-light': '#5a3a23',
        'gold': '#d4a23a',
        'gold-bright': '#f4cf6b',
        'parchment': '#f3e7cf',
        'ink': '#1a1208',
        'court-red': '#c0182a',
        'court-red-bright': '#ff2d44',
        'court-blue': '#2c6fb0',
        'court-blue-bright': '#4aa3ff',
        'court-green': '#2e8b50',
      },
      fontFamily: {
        title: ['Oswald', 'sans-serif'],
        serif: ['"Crimson Pro"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
