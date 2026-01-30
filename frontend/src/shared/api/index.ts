/**
 * API layer entry point.
 * Exports singleton httpClient instance and types.
 */

import { HttpClient } from './httpClient';
import { tokenStore } from './tokenStore';
import { navigation } from '@/shared/lib/navigation';
import { authEvents } from '@/shared/events';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/**
 * Callback when token refresh fails.
 * Emits unauthorized event via authEvents, then redirects to login.
 */
const onUnauthorized = () => {
  authEvents.emit({ type: 'unauthorized' });
  navigation.redirectToLogin();
};

/**
 * Singleton HTTP client instance.
 * Use this for all API calls.
 */
export const httpClient = new HttpClient(BASE_URL, tokenStore, onUnauthorized);

// Re-export types
export type { Tokens } from './types';

// Re-export ApiError class (needed for instanceof checks)
export { ApiError } from './types';

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
