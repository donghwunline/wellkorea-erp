/**
 * Authentication hook.
 * Convenience wrapper around useAuthStore for cleaner component API.
 *
 * Usage:
 * ```typescript
 * const { user, isAuthenticated, login, logout, hasRole } = useAuth();
 *
 * if (hasRole('ROLE_ADMIN')) {
 *   // Admin-only UI
 * }
 * ```
 */

import { useAuthStore } from '@/stores';

/**
 * Hook to access authentication state and actions.
 * This is a thin wrapper around useAuthStore for backward compatibility
 * and cleaner API.
 */
export function useAuth() {
  return useAuthStore();
}
