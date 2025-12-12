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

import { httpClient } from '@/api';
import type { LoginRequest, LoginResponse, User } from './types';

/**
 * Auth events that can be subscribed to.
 */
export type AuthEvent =
  | { type: 'login'; payload: { user: User; accessToken: string } }
  | { type: 'logout' }
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
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>('/auth/login', credentials);

    // DTO → Domain transformation (normalize data)
    const normalized = {
      ...response,
      user: {
        ...response.user,
        email: response.user.email.toLowerCase(), // Normalize email
        fullName: response.user.fullName.trim(), // Trim whitespace
      },
    };

    // Emit login event
    authEvents.emit({
      type: 'login',
      payload: {
        user: normalized.user,
        accessToken: normalized.accessToken,
      },
    });

    return normalized;
  },

  /**
   * Logout current user.
   */
  async logout(): Promise<void> {
    await httpClient.post<void>('/auth/logout');

    // Emit logout event
    authEvents.emit({ type: 'logout' });
  },

  /**
   * Get current authenticated user info.
   */
  async getCurrentUser(): Promise<User> {
    const user = await httpClient.get<User>('/auth/me');

    // Normalize user data
    return {
      ...user,
      email: user.email.toLowerCase(),
      fullName: user.fullName.trim(),
    };
  },
};
