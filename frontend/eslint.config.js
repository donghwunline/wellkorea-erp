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
              target: './src/{components,hooks,stores,pages}',
              from: './src/api',
              except: ['./src/api/types.ts'],
              message: '❌ Use @/services instead of importing @/api directly.',
            },

            // Rule 4: Shared layers cannot import upward (shared는 아무도 모름)
            {
              target: './src/{utils,types,components/ui}',
              from: './src/{components/features,pages,stores,services}',
              message:
                '❌ Shared utilities (utils/types/ui) cannot depend on features/pages/stores/services.',
            },

            // ========================================
            // RECOMMENDED RULES (Best Practices)
            // ========================================

            // Rule 5: Encourage barrel exports in services
            {
              target: './src/{pages,components,stores}',
              from: './src/services/{auth,users,audit}',
              except: ['./index.ts'],
              message: '⚠️  Use barrel export: import from @/services instead.',
            },

            // Rule 6: Stores can use services (allowed pattern)
            // No restriction - stores → services is explicitly allowed

            // Rule 7: Feature components can use services/stores (allowed pattern)
            // No restriction - features → services/stores is explicitly allowed
          ],
        },
      ],
    },
  },
]);
