/**
 * API response type definitions matching backend structure.
 * These types ensure type safety across the frontend-backend boundary.
 */

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
 *     totalPages: 8,
 *     first: true,
 *     last: false
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
 * Type guard to check if a response has pagination metadata.
 * Validates both existence and types of all required pagination fields.
 *
 * @param response ApiResponse to check
 * @returns true if response has valid pagination metadata with correct types
 */
export function hasPaginationMetadata(
  response: ApiResponse<unknown>
): response is ApiResponse<unknown> & {metadata: PaginationMetadata} {
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
export function getPaginationMetadata(
  response: ApiResponse<unknown>
): PaginationMetadata | null {
  if (hasPaginationMetadata(response)) {
    return response.metadata as PaginationMetadata;
  }
  return null;
}
