/**
 * Shared layer barrel export.
 *
 * Contains reusable code with no upward dependencies:
 * - api: HTTP client, token storage, endpoint constants
 * - hooks: Shared React hooks (useAuth, usePaginatedSearch)
 * - types: TypeScript type definitions
 * - utils: Pure utility functions
 *
 * This is the "lowest layer" in the architecture.
 * No code in shared/ can import from features/pages/stores/services.
 */

// Re-export API layer
export * from './api';

// Re-export all hooks
export * from './hooks';

// Re-export all types
export * from './types';

// Re-export all utils
export * from './utils';
