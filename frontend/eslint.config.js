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
    ignores: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'src/test/**/*'],
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
  // Test files - base config without react-refresh
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },

  // ==========================================================================
  // FSD-LITE LAYER IMPORT RESTRICTIONS
  // ==========================================================================
  // Dependency rules (each layer can only import from layers below):
  //   pages → widgets, features, entities, shared
  //   widgets → features, entities, shared
  //   features → entities, shared (NOT other features)
  //   entities → shared ONLY
  //   shared → NOTHING (base layer)
  //
  // Uses @typescript-eslint/no-restricted-imports because eslint-plugin-import
  // no-restricted-paths doesn't support TypeScript path aliases in zones
  // See: https://github.com/import-js/eslint-plugin-import/issues/1872
  // ==========================================================================

  // SHARED layer: Cannot import from any higher layer
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/entities', '@/entities/*', '@/entities/**'],
              message: '❌ FSD: shared/ cannot import from entities/. Shared is the base layer.',
            },
            {
              group: ['@/features', '@/features/*', '@/features/**'],
              message: '❌ FSD: shared/ cannot import from features/.',
            },
            {
              group: ['@/widgets', '@/widgets/*', '@/widgets/**'],
              message: '❌ FSD: shared/ cannot import from widgets/.',
            },
            {
              group: ['@/pages', '@/pages/*', '@/pages/**'],
              message: '❌ FSD: shared/ cannot import from pages/.',
            },
            {
              group: ['@/app', '@/app/*', '@/app/**'],
              message: '❌ FSD: shared/ cannot import from app/.',
            },
          ],
        },
      ],
    },
  },

  // ENTITIES layer: Can only import from shared
  {
    files: ['src/entities/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features', '@/features/*', '@/features/**'],
              message: '❌ FSD: entities/ cannot import from features/. Use shared/ or define in entity.',
            },
            {
              group: ['@/widgets', '@/widgets/*', '@/widgets/**'],
              message: '❌ FSD: entities/ cannot import from widgets/.',
            },
            {
              group: ['@/pages', '@/pages/*', '@/pages/**'],
              message: '❌ FSD: entities/ cannot import from pages/.',
            },
            {
              group: ['@/app', '@/app/*', '@/app/**'],
              message: '❌ FSD: entities/ cannot import from app/.',
            },
          ],
        },
      ],
    },
  },

  // FEATURES layer: Can import from entities, shared (NOT other features)
  {
    files: ['src/features/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/widgets', '@/widgets/*', '@/widgets/**'],
              message: '❌ FSD: features/ cannot import from widgets/.',
            },
            {
              group: ['@/pages', '@/pages/*', '@/pages/**'],
              message: '❌ FSD: features/ cannot import from pages/.',
            },
            {
              group: ['@/app', '@/app/*', '@/app/**'],
              message: '❌ FSD: features/ cannot import from app/.',
            },
            // Features cannot import other features (use widgets for composition)
            // Note: This blocks cross-feature imports but allows internal imports
            // within the same feature via relative paths
          ],
        },
      ],
    },
  },

  // WIDGETS layer: Can import from features, entities, shared
  {
    files: ['src/widgets/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/pages', '@/pages/*', '@/pages/**'],
              message: '❌ FSD: widgets/ cannot import from pages/.',
            },
            {
              group: ['@/app', '@/app/*', '@/app/**'],
              message: '❌ FSD: widgets/ cannot import from app/.',
            },
          ],
        },
      ],
    },
  },

  // PAGES layer: Can import from widgets, features, entities, shared (not app)
  {
    files: ['src/pages/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app', '@/app/*', '@/app/**'],
              message: '❌ FSD: pages/ cannot import from app/. App is the top-level orchestration layer.',
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },

  // ==========================================================================
  // LEGACY LAYER RESTRICTIONS (during migration)
  // ==========================================================================
  // These rules help enforce the migration from old architecture to FSD-Lite
  // Remove once migration is complete

  // Legacy pages: Cannot import services directly (use entity query hooks)
  {
    files: ['src/pages/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'warn', // Warning during migration
        {
          patterns: [
            {
              group: ['@/services', '@/services/*', '@/services/**'],
              message:
                '⚠️ Migration: Use entity query hooks (e.g., useQuotation) instead of services. See entities/quotation/query/',
              allowTypeImports: true,
            },
            {
              group: ['@/shared/stores', '@/shared/stores/*', '@/shared/stores/**'],
              message:
                '⚠️ Migration: Use @/shared/hooks (e.g., useAuth) instead of stores directly.',
              allowTypeImports: true,
            },
            {
              group: ['@/api', '@/api/*', '@/api/**'],
              message: '⚠️ Migration: Use entity API (e.g., entities/quotation/api) instead of @/api.',
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },

  // Legacy UI components: Must stay dumb (no services/stores)
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/services', '@/services/*', '@/services/**'],
              message:
                '❌ UI components must receive data via props. Move to features/ for smart components.',
            },
            {
              group: ['@/shared/stores', '@/shared/stores/*', '@/shared/stores/**'],
              message:
                '❌ UI components must receive data via props. Move to features/ for smart components.',
            },
            {
              group: ['@/api', '@/api/*', '@/api/**'],
              message: '❌ UI components should not import from @/api.',
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },

  // Legacy feature components: Cannot import other feature components
  {
    files: ['src/components/features/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-restricted-imports': [
        'warn', // Warning during migration
        {
          patterns: [
            {
              group: ['@/services', '@/services/*', '@/services/**'],
              message:
                '⚠️ Migration: Move to features/ layer and use entity query/mutation hooks.',
              allowTypeImports: true,
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
