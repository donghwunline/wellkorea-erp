/**
 * Auth event emitter.
 *
 * Located in shared layer because it has no dependencies.
 * This avoids circular dependency issues when httpClient needs to emit events.
 *
 * Events are used ONLY for:
 * - 'unauthorized': Token refresh failed, session expired (emitted by httpClient)
 * - 'refresh': Token successfully refreshed (emitted by httpClient)
 *
 * Note: 'login' and 'logout' events removed - these are intentional user actions
 * handled directly by the store for simpler flow.
 */

/**
 * Auth event types.
 */
export type AuthEvent =
  | { type: 'refresh'; payload: { accessToken: string } }
  | { type: 'unauthorized' };

type AuthEventListener = (event: AuthEvent) => void;

/**
 * Simple event emitter for auth events.
 */
class AuthEventEmitter {
  private listeners: AuthEventListener[] = [];

  subscribe(listener: AuthEventListener): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit(event: AuthEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in auth event listener:', error);
      }
    });
  }
}

/**
 * Singleton auth event emitter.
 * Used by httpClient to notify store of session changes.
 */
export const authEvents = new AuthEventEmitter();
