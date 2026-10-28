/** @type {import('tailwindcss').Config} */
// "Mise en Place" design system. The palette and scales live in
// src/theme/tokens.js so that navigator chrome and inline styles — neither of
// which can use classNames — read from the same source as every class here.
const { colors, fontFamily, fontSize, letterSpacing, spacing } = require('./src/theme/tokens')

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: { colors, fontFamily, fontSize, letterSpacing, spacing },
  },
  plugins: [],
}
