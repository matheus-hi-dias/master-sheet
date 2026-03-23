/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class', // Importante para o suporte a temas
  theme: {
    extend: {
      colors: {
        // Mapeamento das cores do seu projeto web
        bg: {
          app: 'var(--color-bg-app)',
          panel: 'var(--color-bg-panel)',
          card: 'var(--color-bg-card)',
        },
        text: {
          main: 'var(--color-text-main)',
          muted: 'var(--color-text-muted)',
        },
        gold: {
          DEFAULT: '#d4af37',
          dim: '#9a7d26',
        },
        border: '#3d3d3d',
        danger: '#c0392b',
        success: '#27ae60',
        warning: '#e67e22',
        link: '#2e78b7',
      },
      fontFamily: {
        display: ['Cinzel'], // Certifique-se de instalar as fontes no Expo
        body: ['Lato'],
      },
      borderRadius: {
        card: '8px',
      },
    },
  },
  plugins: [],
};
