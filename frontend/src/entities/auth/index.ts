/**
 * Auth Entity - Public API.
 *
 * Provides authentication state and actions for the application.
 *
 * @example
 * ```tsx
 * import { useAuth, type LoginCredentials } from '@/entities/auth';
 *
 * function MyComponent() {
 *   const { user, isAuthenticated, hasRole } = useAuth();
 *
 *   if (!isAuthenticated) return <LoginPage />;
 *   if (!hasRole('ROLE_ADMIN')) return <AccessDenied />;
 *
 *   return <Dashboard user={user} />;
 * }
 * ```
 */

// ==================== HOOKS ====================
// Primary interface for consuming auth state
export { useAuth } from './hooks';

// Low-level store access (for features that need direct store manipulation)
export { useAuthStore } from './store';

// ==================== TYPES ====================
// Types needed by consumers
export type { LoginCredentials, AuthStore } from './model';

// ==================== EVENTS ====================
// Auth events for cross-domain coordination (e.g., logout → clear cache)
export { authEvents, type AuthEvent } from './store';
