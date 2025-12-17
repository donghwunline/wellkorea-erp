import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
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
  {
    files: ['src/{pages,components,stores,shared}/**/*.{ts,tsx}'],
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
            // ========================================
            // MANDATORY RULES (Architectural Boundaries)
            // ========================================

            // Rule 1: Nobody imports from pages (pages는 최상위)
            {
              target: './src/!(pages)/**',
              from: './src/pages',
              message: '❌ Pages are top-level orchestrators. Never import from pages.',
            },

            // Rule 2: UI components stay dumb (재사용 UI는 dumb)
            {
              target: './src/components/ui',
              from: './src/{services,stores,components/features}',
              message:
                '❌ UI components must receive data via props. Use components/features/ for smart components.',
            },

            // Rule 3: API only imported by services (HTTP 계층 격리)
            {
              target: './src/{components,shared,stores,pages}',
              from: './src/api',
              except: ['./src/api/types.ts'],
              message: '❌ Use @/services instead of importing @/api directly.',
            },

            // Rule 4: Shared layers cannot import upward (shared는 아무도 모름)
            {
              target: './src/{shared/types,shared/utils,components/ui}',
              from: './src/{components/features,pages,stores,services}',
              message:
                '❌ Shared utilities (shared/types/utils, ui) cannot depend on features/pages/stores/services.',
            },

            // Rule 5: Pages cannot import stores or services directly
            // (pages must use feature hooks which encapsulate service calls)
            {
              target: './src/pages',
              from: './src/{stores,services}',
              message:
                '❌ Pages should import from @/components/features (which encapsulate stores/services) or @/shared/hooks.',
            },

            // Rule 6: Shared hooks can only use stores (not services directly)
            {
              target: './src/shared/hooks',
              from: './src/services',
              message:
                '❌ Shared hooks should only use stores. Feature-specific hooks go in @/components/features/**/hooks.',
            },

            // ========================================
            // RECOMMENDED RULES (Best Practices)
            // ========================================

            // Rule 7: Encourage barrel exports in services
            {
              target: './src/{components,stores}',
              from: './src/services/{auth,users,audit}',
              except: ['./index.ts'],
              message: '⚠️  Use barrel export: import from @/services instead.',
            },

            // Allowed patterns (no restrictions):
            // - stores → services (orchestration pattern)
            // - features → services/stores (smart components)
            // - features/hooks → services (encapsulated service calls)
          ],
        },
      ],
    },
  },
]);
