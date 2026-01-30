/**
 * Auth event emitter - re-exported from shared layer.
 *
 * The implementation is in @/shared/events to avoid circular dependencies
 * between httpClient and entities/auth.
 *
 * @see @/shared/events/auth-events.ts for implementation
 */
export { authEvents, type AuthEvent } from '@/shared/events';
