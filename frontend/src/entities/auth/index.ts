/**
 * Auth Entity - Public API.
 *
 * This is the ONLY entry point for importing from the auth entity.
 * Internal modules (hooks/, store/, model/) should never be imported directly.
 *
 * Note: Auth entity uses hooks/ + store/ instead of model/api/query/
 * because authentication is primarily about state management, not data fetching.
 *
 * FSD Layer: entities
 * Can import from: shared
 * Cannot import from: features, widgets, pages
 *
 * @see docs/architecture/fsd-public-api-guidelines.md
 */

// =============================================================================
// AUTH HOOK
// Primary interface for consuming auth state
// =============================================================================

export { useAuth } from './hooks';

// =============================================================================
// AUTH STORE
// Low-level store access (for features that need direct store manipulation)
// =============================================================================

export { useAuthStore } from './store';

// =============================================================================
// TYPES
// Types needed by consumers
// =============================================================================

export type { LoginCredentials, AuthStore } from './model';

// =============================================================================
// EVENTS
// Auth events for cross-domain coordination (e.g., logout → clear cache)
// =============================================================================

export { authEvents, type AuthEvent } from './store';
