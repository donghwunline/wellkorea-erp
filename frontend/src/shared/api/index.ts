/**
 * API layer entry point.
 * Exports singleton httpClient instance and types.
 */

import { HttpClient } from './httpClient';
import { tokenStore } from './tokenStore';
import { navigation } from '@/shared/lib/navigation';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/**
 * Callback when token refresh fails.
 * Emits unauthorized event via authEvents.
 *
 * NOTE: Uses dynamic import to avoid circular dependency:
 * - api/httpClient.ts imports from api/index.ts
 * - entities/auth/store imports httpClient from @/shared/api
 * - If we statically import authEvents here, we get: httpClient ← authStore ← httpClient
 */
const onUnauthorized = () => {
  // Emit unauthorized event (dynamic import prevents circular dependency)
  import('@/entities/auth')
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

// Re-export PagedResponse (deprecated from barrel - use @/shared/api/types directly)
export type { PagedResponse } from './types';

export { HttpClient } from './httpClient';
export { tokenStore } from './tokenStore';

// Error message utilities
export {
  getErrorMessage,
  getGenericErrorMessage,
  getErrorDisplayStrategy,
  isValidationError,
  isAuthenticationError,
  isAuthorizationError,
  isAuthError,
  isBusinessError,
  isServerError,
  isNotFoundError,
} from './errorMessages';

// Domain error utilities
export {
  DomainValidationError,
  isDomainValidationError,
  normalizeApiErrors,
  extractErrorMessage,
} from './errors';

// Re-export endpoint constants from config segment
export {
  AUTH_ENDPOINTS,
  USER_ENDPOINTS,
  AUDIT_ENDPOINTS,
  PROJECT_ENDPOINTS,
  QUOTATION_ENDPOINTS,
  APPROVAL_ENDPOINTS,
  APPROVAL_CHAIN_ENDPOINTS,
  PRODUCT_ENDPOINTS,
  SERVICE_CATEGORY_ENDPOINTS,
  COMPANY_ENDPOINTS,
  WORK_PROGRESS_ENDPOINTS,
  TASK_FLOW_ENDPOINTS,
  BLUEPRINT_ENDPOINTS,
  DELIVERY_ENDPOINTS,
  MATERIAL_ENDPOINTS,
  PURCHASE_REQUEST_ENDPOINTS,
  PURCHASE_ORDER_ENDPOINTS,
  MAIL_OAUTH2_ENDPOINTS,
} from '../config/endpoints';
