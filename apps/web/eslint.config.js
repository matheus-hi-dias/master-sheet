import { config as sharedConfig } from '@master-sheet/eslint-config/react-internal';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  ...sharedConfig,
  globalIgnores(['dist']),
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    ...reactRefresh.configs.vite,
    rules: {
      ...reactRefresh.configs.vite.rules,
      'react/prop-types': 'off',
    },
  },
]);
