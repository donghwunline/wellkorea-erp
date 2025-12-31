/**
 * Shared stores barrel export.
 *
 * Global state stores that are cross-cutting concerns.
 * Authentication is the primary example as it's needed across all layers.
 */

export { useAuthStore } from './authStore';
export type { AuthStore } from './authStore';
