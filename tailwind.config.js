/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        nude:     '#D7B6B1',
        beige:    '#EADCC8',
        gold:     '#C9A96A',
        'off-white': '#F9F6F2',
        muted:    '#8A7A74',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        sans:    ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
