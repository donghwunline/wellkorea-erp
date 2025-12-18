import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
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
  // Uses @typescript-eslint/no-restricted-imports because eslint-plugin-import
  // no-restricted-paths doesn't support TypeScript path aliases in zones
  // See: https://github.com/import-js/eslint-plugin-import/issues/1872
  {
    files: ['src/pages/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      // Rule: Pages cannot import stores or services directly
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/services', '@/services/*'],
              message:
                '❌ Pages should not import services directly. Use feature hooks from @/components/features/**/hooks instead.',
              allowTypeImports: true,
            },
            {
              group: ['@/stores', '@/stores/*'],
              message:
                '❌ Pages should not import stores directly. Use @/shared/hooks (e.g., useAuth) instead.',
              allowTypeImports: true,
            },
            {
              group: ['@/api', '@/api/*'],
              allowTypeImports: true,
              message: '❌ Pages should not import from @/api. Use @/services via feature hooks.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      // Rule: UI components must stay dumb (no services/stores)
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/services', '@/services/*'],
              message:
                '❌ UI components must receive data via props. Move to @/components/features/ for smart components.',
            },
            {
              group: ['@/stores', '@/stores/*'],
              message:
                '❌ UI components must receive data via props. Move to @/components/features/ for smart components.',
            },
            {
              group: ['@/api', '@/api/*'],
              allowTypeImports: true,
              message: '❌ UI components should not import from @/api.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/shared/hooks/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      // Rule: Shared hooks can only use stores, not services
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/services', '@/services/*'],
              message:
                '❌ Shared hooks should only use stores. Feature-specific hooks go in @/components/features/**/hooks.',
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/shared/{types,utils}/**/*.{ts,tsx}', 'src/components/ui/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      // Rule: Shared layers cannot import upward
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/pages', '@/pages/*'],
              message: '❌ Shared utilities cannot depend on pages.',
            },
            {
              group: ['@/components/features', '@/components/features/*'],
              message: '❌ Shared utilities cannot depend on feature components.',
            },
          ],
        },
      ],
    },
  },
  // Type imports allowed everywhere
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'src/test/**'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  },
]);
