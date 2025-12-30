/**
 * Shared layer barrel export.
 *
 * Contains reusable code with no upward dependencies:
 * - hooks: Shared React hooks (useAuth, usePaginatedSearch)
 * - types: TypeScript type definitions
 * - utils: Pure utility functions
 *
 * This is the "lowest layer" in the architecture.
 * No code in shared/ can import from features/pages/stores/services/api.
 */

// Re-export all hooks
export * from './hooks';

// Re-export all types
export * from './types';

// Re-export all utils
export * from './utils';
