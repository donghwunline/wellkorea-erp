/**
 * Core types for the API layer.
 *
 * Defines all API-related interfaces:
 * - Request/Response structures (ApiResponse, ErrorResponse)
 * - Backend pagination (PagedResponse)
 * - Authentication (Tokens, TokenStore)
 * - Errors (ApiError, ErrorResponse)
 *
 * Note: Paginated<T> and PaginationMetadata are in @/shared/pagination
 */

// Re-export pagination types for backward compatibility
export type { Paginated, PaginationMetadata } from '@/shared/lib/pagination';

// ============================================================================
// Authentication & Token Types
// ============================================================================

/**
 * Token pair for authentication.
 */
export interface Tokens {
  accessToken: string;
  refreshToken: string | null;
}

/**
 * Token storage interface for dependency injection.
 */
export interface TokenStore {
  getTokens(): Tokens | null;

  setTokens(tokens: Tokens): void;

  clear(): void;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard success response wrapper from backend.
 * All successful API calls return data wrapped in this structure.
 *
 * @example
 * // Single entity response
 * const response: ApiResponse<Project> = {
 *   success: true,
 *   message: "Project retrieved successfully",
 *   data: { id: 1, jobCode: "WK2025-000001-20250101", ... },
 *   timestamp: "2025-12-05T10:30:00",
 *   metadata: null
 * };
 *
 * @example
 * // List response with pagination metadata
 * const response: ApiResponse<Project[]> = {
 *   success: true,
 *   message: "Projects retrieved successfully",
 *   data: [{ id: 1, ... }, { id: 2, ... }],
 *   timestamp: "2025-12-05T10:30:00",
 *   metadata: {
 *     page: 0,
 *     size: 20,
 *     totalElements: 150,
 *     totalPages: 8
 *   }
 * };
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Standard error response from backend.
 * Returned by GlobalExceptionHandler for all error scenarios.
 *
 * @example
 * {
 *   timestamp: "2025-12-05T10:30:00",
 *   status: 404,
 *   errorCode: "RES_001",
 *   message: "Project not found with id: 123",
 *   path: "/api/projects/123"
 * }
 */
export interface ErrorResponse {
  timestamp: string;
  status: number;
  errorCode: string;
  message: string;
  path: string;
}

/**
 * Normalized API error class (frontend representation).
 * Extends Error to provide proper stack traces and instanceof checks.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly errorCode?: string;
  readonly details?: unknown;

  constructor(status: number, message: string, errorCode?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
  }
}

// ============================================================================
// Pagination Types
// ============================================================================

/**
 * Paged response structure from backend.
 * Used when backend returns paginated data objects directly in ApiResponse.data.
 *
 * This represents the backend's Page<T> structure, which differs from PaginationMetadata:
 * - Uses 'content' array for data
 * - Uses 'number' instead of 'page' for current page index
 *
 * @example
 * // Backend returns: ApiResponse<Page<UserResponse>>
 * const response = await httpClient.requestWithMeta<PagedResponse<User>>(...);
 * const users = response.data.content;
 * const currentPage = response.data.number;
 */
export interface PagedResponse<T> {
  content: T[];
  number: number; // Current page index (0-based)
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
