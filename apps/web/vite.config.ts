import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: [
      '@master-sheet/contracts',
      '@master-sheet/contracts/defaults',
      '@master-sheet/contracts/schemas',
      '@master-sheet/sheet-engine',
      '@master-sheet/sheet-engine/formula',
      '@master-sheet/sheet-engine/graph',
      '@master-sheet/sheet-engine/validation',
    ],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/, /packages[\\/](contracts|sheet-engine)[\\/]/],
    },
  },
});
