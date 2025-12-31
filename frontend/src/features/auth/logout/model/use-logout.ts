/**
 * Logout hook.
 *
 * Provides a consistent interface for logout with UX side-effects.
 */

import { useCallback } from 'react';
import { useAuthStore } from '@/entities/auth';

/**
 * Options for useLogout hook.
 */
export interface UseLogoutOptions {
  /**
   * Callback after logout completes.
   */
  onLogout?: () => void;
}

/**
 * Hook for user logout.
 *
 * @example
 * ```tsx
 * function LogoutButton() {
 *   const navigate = useNavigate();
 *   const { logout } = useLogout({
 *     onLogout: () => {
 *       toast.success('Logged out successfully');
 *       navigate('/login');
 *     },
 *   });
 *
 *   return <button onClick={logout}>Logout</button>;
 * }
 * ```
 */
export function useLogout(options: UseLogoutOptions = {}) {
  const storeLogout = useAuthStore(state => state.logout);
  const { onLogout } = options;

  const logout = useCallback(() => {
    storeLogout();
    onLogout?.();
  }, [storeLogout, onLogout]);

  return { logout };
}
