import { config } from '@master-sheet/eslint-config/base';

export default [
  ...config,
  {
    ignores: ['dist/**'],
  },
];
