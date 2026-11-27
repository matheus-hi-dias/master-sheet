const designTokens = require('@master-sheet/design-tokens/tailwind-preset');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset'), designTokens],
  darkMode: 'class', // Importante para o suporte a temas
  theme: {
    extend: {},
  },
  plugins: [],
};
