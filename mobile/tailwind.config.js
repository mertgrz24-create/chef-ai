/** @type {import('tailwindcss').Config} */
// "Mise en Place" design system — mirrors the web app's tokens (app/globals.css)
// so both surfaces speak the same visual language.
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // brand
        pantry: '#1E3A2F', // deep pantry green — brand surfaces
        zest: '#CDF23E', // electric lime — the one bold accent
        ink: '#17180F', // warm near-black — text, dark surfaces
        chalk: '#F5F6F1', // cool paper — light base (not cream)

        // light surfaces
        surface: '#FFFFFF',
        'surface-2': '#ECEEE6',
        border: '#E2E4DA',

        // text
        'ink-2': '#4A4E42',
        'ink-muted': '#8A8E80',

        // dark surfaces
        'dark-bg': '#101109',
        'dark-surface': '#191B12',
        'dark-border': '#2E3125',
        'dark-text': '#F2F3EC',

        // functional
        clay: '#E8623D', // expiry / warmth
      },
      fontFamily: {
        display: ['BricolageGrotesque_600SemiBold'],
        sans: ['InstrumentSans_400Regular'],
        'sans-bold': ['InstrumentSans_600SemiBold'],
        mono: ['SpaceMono_400Regular'],
        'mono-bold': ['SpaceMono_700Bold'],
      },
    },
  },
  plugins: [],
}
