import { config } from '@master-sheet/eslint-config/base';

export default [
  ...config,
  {
    ignores: ['dist/**', 'dist-test/**'],
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'node:*',
                'fs',
                'path',
                'react-native',
                '@nestjs/*',
                '@master-sheet/sheet-engine',
                '@master-sheet/api',
                '@master-sheet/web',
                '@master-sheet/mobile',
              ],
              message:
                'Shared contracts must stay platform-neutral and depend on no other workspace package.',
            },
          ],
        },
      ],
    },
  },
];
