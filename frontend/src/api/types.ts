/**
 * Core types for the API layer.
 * Consolidated from legacy /src/types/api.ts and /src/api/types.ts
 *
 * Defines all API-related interfaces:
 * - Request/Response structures (ApiResponse, ErrorResponse)
 * - Pagination (PaginationMetadata, PaginationParams)
 * - Authentication (Tokens, TokenStore)
 * - Errors (ApiError, ErrorResponse)
 */

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
 * Normalized API error structure (frontend representation).
 */
export interface ApiError {
  status: number;
  errorCode?: string;
  message: string;
  details?: unknown;
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

/**
 * Pagination metadata structure used in ApiResponse.metadata field.
 * Matches Spring Data Page structure from backend.
 */
export interface PaginationMetadata {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/**
 * Common pagination request parameters for list endpoints.
 *
 * @example
 * const params: PaginationParams = {
 *   page: 0,
 *   size: 20,
 *   sort: 'createdAt,desc'
 * };
 */
export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}

/**
 * Generic paginated response wrapper.
 * Combines data array with pagination metadata.
 * Used by services that return paginated lists.
 *
 * @example
 * const users: Paginated<UserDetails> = await userService.getUsers();
 * const logs: Paginated<AuditLogEntry> = await auditService.getAuditLogs();
 */
export interface Paginated<T> {
  data: T[];
  pagination: PaginationMetadata;
}

// ============================================================================
// Type Guards & Utilities
// ============================================================================

/**
 * Type guard to check if a response has pagination metadata.
 * Validates both existence and types of all required pagination fields.
 *
 * @param response ApiResponse to check
 * @returns true if response has valid pagination metadata with correct types
 */
export function hasPaginationMetadata(
  response: ApiResponse<unknown>,
): response is ApiResponse<unknown> & { metadata: PaginationMetadata } {
  const meta = response.metadata;
  return (
    meta !== undefined &&
    meta !== null &&
    typeof meta === 'object' &&
    'page' in meta &&
    typeof meta.page === 'number' &&
    'size' in meta &&
    typeof meta.size === 'number' &&
    'totalElements' in meta &&
    typeof meta.totalElements === 'number' &&
    'totalPages' in meta &&
    typeof meta.totalPages === 'number' &&
    'first' in meta &&
    typeof meta.first === 'boolean' &&
    'last' in meta &&
    typeof meta.last === 'boolean'
  );
}

/**
 * Extract pagination metadata from ApiResponse, with fallback for non-paginated responses.
 *
 * @param response ApiResponse that may contain pagination metadata
 * @returns PaginationMetadata or null if not present
 */
export function getPaginationMetadata(response: ApiResponse<unknown>): PaginationMetadata | null {
  if (hasPaginationMetadata(response)) {
    return response.metadata as PaginationMetadata;
  }
  return null;
}
