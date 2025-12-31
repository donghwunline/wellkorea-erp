/**
 * Shared stores barrel export.
 *
 * Global state stores that are cross-cutting concerns.
 * Authentication is the primary example as it's needed across all layers.
 *
 * NOTE: Auth store has moved to @/entities/auth. This re-exports for backwards
 * compatibility. Prefer importing from @/entities/auth directly.
 */

export { useAuthStore, type AuthStore } from '@/entities/auth';
