/**
 * Authentication service.
 * Business logic layer for authentication operations.
 *
 * Features:
 * - Login/logout/refresh operations
 * - DTO → Domain transformations
 * - Data normalization
 * - Event emitters for decoupled state updates
 */

import { httpClient, AUTH_ENDPOINTS } from '@/api';
import type { LoginRequest, LoginResponse, User } from './types';

/**
 * Auth events for global/unintentional session changes.
 *
 * Events are used ONLY for:
 * - 'unauthorized': Token refresh failed, session expired (emitted by httpClient)
 * - 'refresh': Token successfully refreshed (emitted by httpClient)
 *
 * Note: 'login' and 'logout' events removed - these are intentional user actions
 * handled directly by the store for simpler flow.
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

export const authEvents = new AuthEventEmitter();

/**
 * Authentication service endpoints.
 */
export const authService = {
  /**
   * Authenticate user with credentials.
   *
   * Returns normalized user data. Store handles state updates directly.
   * No event emitted - login is an intentional user action.
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>(AUTH_ENDPOINTS.LOGIN, credentials);

    // DTO → Domain transformation (normalize data)
    return {
      ...response,
      user: {
        ...response.user,
        email: response.user.email.toLowerCase(), // Normalize email
        fullName: response.user.fullName.trim(), // Trim whitespace
      },
    };
  },

  /**
   * Logout current user.
   *
   * Notifies backend to invalidate token. Store already cleared state before calling this.
   * No event emitted - logout is an intentional user action handled by store.
   */
  async logout(): Promise<void> {
    await httpClient.post<void>(AUTH_ENDPOINTS.LOGOUT);
  },

  /**
   * Get current authenticated user info.
   */
  async getCurrentUser(): Promise<User> {
    const user = await httpClient.get<User>(AUTH_ENDPOINTS.ME);

    // Normalize user data
    return {
      ...user,
      email: user.email.toLowerCase(),
      fullName: user.fullName.trim(),
    };
  },
};
