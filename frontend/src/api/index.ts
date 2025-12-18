/**
 * API layer entry point.
 * Exports singleton httpClient instance and types.
 */

import { HttpClient } from './httpClient';
import { tokenStore } from './tokenStore';
import { navigation } from '@/shared/utils';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/**
 * Callback when token refresh fails.
 * Emits unauthorized event via authService.
 *
 * NOTE: Uses dynamic import to avoid circular dependency:
 * - api/httpClient.ts imports from api/index.ts
 * - services/auth/authService.ts imports httpClient from @/api
 * - If we statically import authService here, we get: httpClient ← authService ← httpClient
 */
const onUnauthorized = () => {
  // Emit unauthorized event (dynamic import prevents circular dependency)
  import('@/services/auth/authService')
    .then(({ authEvents }) => {
      authEvents.emit({ type: 'unauthorized' });
    })
    .catch(err => {
      console.error('Failed to emit unauthorized event:', err);
    });

  // Redirect to login (happens immediately, doesn't wait for event)
  navigation.redirectToLogin();
};

/**
 * Singleton HTTP client instance.
 * Use this for all API calls.
 */
export const httpClient = new HttpClient(BASE_URL, tokenStore, onUnauthorized);

// Re-export types
export type { Tokens, ApiError } from './types';
export { HttpClient } from './httpClient';
export { tokenStore } from './tokenStore';
