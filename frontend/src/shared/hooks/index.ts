/**
 * Shared hooks barrel export.
 *
 * These hooks are reusable across the application and have no
 * feature-specific dependencies (only stores, types).
 *
 * Categories:
 * - Auth: useAuth (store wrapper for authentication)
 * - UI Primitives: useFocusTrap, useBodyScrollLock (pure React hooks for accessibility)
 * - Pagination: usePaginatedSearch (generic pagination/search state)
 */

export { useAuth } from './useAuth';
export { usePaginatedSearch } from './usePaginatedSearch';
export type { UsePaginatedSearchOptions, UsePaginatedSearchReturn } from './usePaginatedSearch';

// UI primitive hooks (accessibility and overlay support)
export { useFocusTrap } from './useFocusTrap';
export type { UseFocusTrapOptions } from './useFocusTrap';
export { useBodyScrollLock } from './useBodyScrollLock';

// Service action hooks (loading/error state for async operations)
export { useServiceAction, useServiceActions } from './useServiceAction';
export type { UseServiceActionReturn, UseServiceActionsReturn } from './useServiceAction';
