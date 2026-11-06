import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import turboPlugin from 'eslint-plugin-turbo';
import tseslint from 'typescript-eslint';

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@master-sheet/api',
                '@master-sheet/web',
                '@master-sheet/mobile',
              ],
              message: 'Applications must not import from other applications.',
            },
            {
              group: ['../../apps/*', '../../../apps/*', '../../../../apps/*'],
              message: 'Applications must not import from other applications.',
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ['dist/**'],
  },
];
