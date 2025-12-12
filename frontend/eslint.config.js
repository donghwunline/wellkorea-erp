import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },

  // Layer encapsulation (excluding tests)
  {
    files: ['src/{pages,components,stores,hooks}/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'src/test/**'],
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.app.json',
        },
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/{pages,components,stores,hooks}',
              from: './src/api',
              message: 'Use @/services instead of @/api directly.',
            },
            {
              target: './src/{pages,components,stores}',
              from: './src/services/{auth,users,audit}',
              except: ['./index.ts'],
              message: 'Use barrel export: import from @/services instead.',
            },
          ],
        },
      ],
    },
  },
]);
