/**
 * Error message mapping and utilities for user-friendly error handling.
 * Maps backend error codes to localized, user-friendly messages.
 *
 * Error display strategy based on error type:
 * - Validation errors (VAL_*): Inline near fields
 * - Auth errors (AUTH_*, AUTHZ_*): Banner/modal/dedicated error page
 * - Server errors (SRV_*): Toast notification
 * - Business errors (BUS_*): Context-dependent (inline or toast)
 */

import type {ErrorResponse} from '@/types/api';

/**
 * Mapping of backend error codes to user-friendly messages.
 * Keys match ErrorCode enum values from backend.
 */
export const errorMessages: Record<string, string> = {
  // ========== Validation Errors (400) ==========
  VAL_001: '입력값을 확인하고 다시 시도해 주세요.',
  VAL_002: '일부 필드에 유효하지 않은 값이 있습니다.',
  VAL_003: '잘못된 매개변수가 제공되었습니다.',

  // ========== Business Logic Errors (400-409) ==========
  BUS_001: '이 작업을 완료할 수 없습니다.',
  BUS_002: '현재 이 작업을 수행할 수 없습니다.',
  BUS_003: '이미 존재하는 항목입니다.',

  // ========== Authentication Errors (401) ==========
  AUTH_001: '아이디 또는 비밀번호가 올바르지 않습니다.',
  AUTH_002: '세션이 만료되었습니다. 다시 로그인해 주세요.',
  AUTH_003: '인증 정보가 만료되었습니다.',

  // ========== Authorization Errors (403) ==========
  AUTHZ_001: '이 작업을 수행할 권한이 없습니다.',
  AUTHZ_002: '허용되지 않는 작업입니다.',

  // ========== Resource Errors (404) ==========
  RES_001: '요청한 항목을 찾을 수 없습니다.',
  RES_002: '페이지를 찾을 수 없습니다.',

  // ========== Server Errors (500+) ==========
  SRV_001: '문제가 발생했습니다. 나중에 다시 시도해 주세요.',
  SRV_002: '데이터베이스 연결에 실패했습니다. 다시 시도해 주세요.',
  SRV_003: '외부 서비스를 사용할 수 없습니다.',
  SRV_004: '서비스를 일시적으로 사용할 수 없습니다.',
};

/**
 * Get user-friendly error message for an error code.
 * Falls back to backend's original message if no mapping exists.
 *
 * @param errorResponse Error response from backend
 * @returns User-friendly error message
 */
export function getErrorMessage(errorResponse: ErrorResponse): string {
  return errorMessages[errorResponse.errorCode] || errorResponse.message;
}

/**
 * Check if error is a validation error (should be displayed inline).
 *
 * @param errorCode Error code from backend
 * @returns true if validation error
 */
export function isValidationError(errorCode: string): boolean {
  return errorCode.startsWith('VAL_');
}

/**
 * Check if error is an authentication error (should redirect or show login modal).
 *
 * @param errorCode Error code from backend
 * @returns true if authentication error
 */
export function isAuthenticationError(errorCode: string): boolean {
  return errorCode.startsWith('AUTH_');
}

/**
 * Check if error is an authorization error (should show access denied page).
 *
 * @param errorCode Error code from backend
 * @returns true if authorization error
 */
export function isAuthorizationError(errorCode: string): boolean {
  return errorCode.startsWith('AUTHZ_');
}

/**
 * Check if error is any auth-related error (authentication or authorization).
 *
 * @param errorCode Error code from backend
 * @returns true if any auth error
 */
export function isAuthError(errorCode: string): boolean {
  return isAuthenticationError(errorCode) || isAuthorizationError(errorCode);
}

/**
 * Check if error is a business logic error (context-dependent display).
 *
 * @param errorCode Error code from backend
 * @returns true if business error
 */
export function isBusinessError(errorCode: string): boolean {
  return errorCode.startsWith('BUS_');
}

/**
 * Check if error is a server error (should be displayed as toast).
 *
 * @param errorCode Error code from backend
 * @returns true if server error
 */
export function isServerError(errorCode: string): boolean {
  return errorCode.startsWith('SRV_');
}

/**
 * Check if error is a resource not found error.
 *
 * @param errorCode Error code from backend
 * @returns true if resource not found
 */
export function isNotFoundError(errorCode: string): boolean {
  return errorCode.startsWith('RES_');
}

/**
 * Determine the appropriate display strategy for an error.
 *
 * @param errorCode Error code from backend
 * @returns Display strategy: 'inline', 'toast', 'banner', or 'modal'
 */
export function getErrorDisplayStrategy(
  errorCode: string
): 'inline' | 'toast' | 'banner' | 'modal' {
  if (isValidationError(errorCode)) {
    return 'inline';
  }
  if (isAuthenticationError(errorCode)) {
    return 'modal'; // Login modal or redirect
  }
  if (isAuthorizationError(errorCode)) {
    return 'banner'; // Access denied banner
  }
  if (isServerError(errorCode) || isBusinessError(errorCode)) {
    return 'toast'; // Global action feedback
  }
  if (isNotFoundError(errorCode)) {
    return 'banner'; // Not found page
  }
  return 'toast'; // Default to toast for unknown errors
}

/**
 * Enhanced error object with user-friendly message and display strategy.
 */
export interface EnhancedError extends Error {
  errorCode: string;
  userMessage: string;
  displayStrategy: 'inline' | 'toast' | 'banner' | 'modal';
  originalError: ErrorResponse;
}

/**
 * Enhance an error with user-friendly information.
 *
 * @param errorResponse Error response from backend
 * @returns Enhanced error object
 */
export function enhanceError(errorResponse: ErrorResponse): EnhancedError {
  const userMessage = getErrorMessage(errorResponse);
  const displayStrategy = getErrorDisplayStrategy(errorResponse.errorCode);

  const error = new Error(userMessage) as EnhancedError;
  error.errorCode = errorResponse.errorCode;
  error.userMessage = userMessage;
  error.displayStrategy = displayStrategy;
  error.originalError = errorResponse;

  return error;
}
