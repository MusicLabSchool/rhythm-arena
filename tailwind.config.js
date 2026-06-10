/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'game-bg': '#0a0a0f',
        'lane-kick': '#ef4444',
        'lane-snare': '#3b82f6',
        'lane-hihat': '#10b981',
        'lane-crash': '#f59e0b',
      },
      fontFamily: {
        game: ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
