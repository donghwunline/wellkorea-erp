/**
 * Authentication hook.
 * Convenience wrapper around useAuthStore for cleaner component API.
 *
 * Performance: Uses selector with shallow equality to prevent unnecessary re-renders.
 * Components only re-render when the specific fields they use actually change.
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

import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '@/stores';

/**
 * Hook to access authentication state and actions.
 *
 * Uses Zustand's useShallow hook to optimize re-renders.
 * Only re-renders when the selected fields actually change, not when
 * any field in the store changes.
 */
export function useAuth() {
  return useAuthStore(
    useShallow(s => ({
      user: s.user,
      isAuthenticated: s.isAuthenticated,
      isLoading: s.isLoading,
      accessToken: s.accessToken,
      login: s.login,
      logout: s.logout,
      hasRole: s.hasRole,
      hasAnyRole: s.hasAnyRole,
    })),
  );
}
