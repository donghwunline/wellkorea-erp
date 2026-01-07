/**
 * Entity API Layer Test Utilities.
 *
 * Provides reusable test helpers for testing:
 * - Query factories (TanStack Query queryOptions)
 * - Command functions (validation, mapping, API calls)
 * - Mappers (DTO → Domain transformations)
 * - Mutation hooks (useMutation wrappers)
 *
 * Usage:
 * ```typescript
 * import {
 *   createHttpClientMock,
 *   expectValidationError,
 *   createQueryWrapper,
 * } from '@/test/entity-test-utils';
 * ```
 */

import { vi, expect, type Mock } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DomainValidationError } from '@/shared/lib/errors/domain-validation-error';
import type { ReactNode } from 'react';

// ============================================================================
// HTTP Client Mock Factory
// ============================================================================

/**
 * HTTP method types supported by httpClient.
 */
type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/**
 * Mock httpClient object with all methods as vi.fn().
 */
export interface MockHttpClient {
  get: Mock;
  post: Mock;
  put: Mock;
  patch: Mock;
  delete: Mock;
}

/**
 * Creates a mock httpClient with utility methods for test setup.
 *
 * @example
 * ```typescript
 * const { httpClient, mockSuccess, reset } = createHttpClientMock();
 *
 * vi.mock('@/shared/api', async () => {
 *   const actual = await vi.importActual('@/shared/api');
 *   return { ...actual, httpClient };
 * });
 *
 * mockSuccess('post', { id: 1, message: 'Created' });
 * ```
 */
export function createHttpClientMock() {
  const httpClient: MockHttpClient = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };

  return {
    /** The mock httpClient object */
    httpClient,

    /** Reset all mock functions */
    reset: () => {
      Object.values(httpClient).forEach((mock) => mock.mockReset());
    },

    /** Clear all mock functions (keeps implementation) */
    clear: () => {
      Object.values(httpClient).forEach((mock) => mock.mockClear());
    },

    /** Mock a successful response for a method */
    mockSuccess: <T,>(method: HttpMethod, data: T) => {
      httpClient[method].mockResolvedValue(data);
    },

    /** Mock an error response for a method */
    mockError: (method: HttpMethod, error: Error) => {
      httpClient[method].mockRejectedValue(error);
    },

    /** Mock a successful response once */
    mockSuccessOnce: <T,>(method: HttpMethod, data: T) => {
      httpClient[method].mockResolvedValueOnce(data);
    },

    /** Mock an error response once */
    mockErrorOnce: (method: HttpMethod, error: Error) => {
      httpClient[method].mockRejectedValueOnce(error);
    },
  };
}

// ============================================================================
// Query Factory Test Helpers
// ============================================================================

/**
 * Creates a QueryClient configured for testing.
 *
 * Configuration:
 * - No retries (fail fast in tests)
 * - No garbage collection delay
 * - No stale time
 *
 * @example
 * ```typescript
 * const queryClient = createTestQueryClient();
 * ```
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Creates a wrapper component for testing hooks that require QueryClientProvider.
 *
 * @param queryClient - Optional QueryClient instance. If not provided, creates a new test client.
 *
 * @example
 * ```typescript
 * // Basic usage - creates its own QueryClient
 * const { result } = renderHook(() => useCreateQuotation(), {
 *   wrapper: createQueryWrapper(),
 * });
 *
 * // With custom QueryClient for spying on methods
 * const queryClient = createTestQueryClient();
 * const spy = vi.spyOn(queryClient, 'invalidateQueries');
 * const { result } = renderHook(() => useCreateQuotation(), {
 *   wrapper: createQueryWrapper(queryClient),
 * });
 * ```
 */
export function createQueryWrapper(
  queryClient?: QueryClient
): ({ children }: { children: ReactNode }) => ReactNode {
  const client = queryClient ?? createTestQueryClient();
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

/**
 * Minimal interface for queryOptions result.
 * Compatible with TanStack Query v5 queryOptions() return type.
 *
 * Uses permissive types to work with any queryOptions() return value.
 * The queryFn type is intentionally loose to avoid complex generic inference issues.
 */
interface QueryOptionsLike {
  queryKey: readonly unknown[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryFn?: (context: any) => any;
}

/**
 * Asserts that an object has valid queryOptions structure.
 *
 * @example
 * ```typescript
 * const options = quotationQueries.detail(1);
 * expectValidQueryOptions(options);
 * ```
 */
export function expectValidQueryOptions(options: QueryOptionsLike): void {
  expect(options).toHaveProperty('queryKey');
  expect(options).toHaveProperty('queryFn');
  expect(Array.isArray(options.queryKey)).toBe(true);
  expect(options.queryKey.length).toBeGreaterThan(0);
  expect(typeof options.queryFn).toBe('function');
}

/**
 * Helper to invoke queryFn from queryOptions with minimal context.
 * Use this in tests instead of calling options.queryFn() directly.
 *
 * @example
 * ```typescript
 * const options = quotationQueries.detail(1);
 * const result = await invokeQueryFn(options);
 * ```
 */
export async function invokeQueryFn<T = unknown>(options: QueryOptionsLike): Promise<T> {
  if (!options.queryFn) {
    throw new Error('queryFn is undefined');
  }
  // Provide minimal context for queryFn - using any to avoid strict type requirements
  const context = {
    queryKey: options.queryKey,
    signal: new AbortController().signal,
    meta: undefined,
  };
  return options.queryFn(context) as T;
}

/**
 * Asserts that a query key matches the expected structure.
 *
 * @example
 * ```typescript
 * expectQueryKey(quotationQueries.all(), ['quotations']);
 * expectQueryKey(quotationQueries.detail(1), ['quotations', 'detail', 1]);
 * ```
 */
export function expectQueryKey(
  actual: readonly unknown[],
  expected: readonly unknown[]
): void {
  expect(actual).toEqual(expected);
}

// ============================================================================
// Command Function Test Helpers
// ============================================================================

/**
 * Asserts that a function throws a DomainValidationError with expected properties.
 *
 * @param fn - The function to test (sync or async)
 * @param expectedCode - Expected error code (e.g., 'REQUIRED', 'OUT_OF_RANGE')
 * @param expectedField - Expected field path (e.g., 'projectId', 'lineItems[0].quantity')
 * @param expectedMessagePattern - Optional message pattern to match
 *
 * @example
 * ```typescript
 * expectValidationError(
 *   () => createQuotation({ projectId: null }),
 *   'REQUIRED',
 *   'projectId',
 *   'Project is required'
 * );
 * ```
 */
export function expectValidationError(
  fn: () => void | Promise<void>,
  expectedCode: string,
  expectedField: string,
  expectedMessagePattern?: string | RegExp
): void {
  expect(fn).toThrow(DomainValidationError);

  try {
    fn();
    // If we get here, the function didn't throw
    throw new Error('Expected function to throw DomainValidationError');
  } catch (error) {
    if (!(error instanceof DomainValidationError)) {
      throw error; // Re-throw if not a DomainValidationError
    }

    expect(error.code).toBe(expectedCode);
    expect(error.fieldPath).toBe(expectedField);

    if (expectedMessagePattern) {
      if (typeof expectedMessagePattern === 'string') {
        expect(error.message).toContain(expectedMessagePattern);
      } else {
        expect(error.message).toMatch(expectedMessagePattern);
      }
    }
  }
}

/**
 * Asserts that a function throws a DomainValidationError with the specified code.
 * Less strict than expectValidationError - only checks the error code.
 *
 * @example
 * ```typescript
 * expectValidationCode(() => createQuotation({ projectId: null }), 'REQUIRED');
 * ```
 */
export function expectValidationCode(fn: () => void, expectedCode: string): void {
  expect(fn).toThrow(DomainValidationError);

  try {
    fn();
  } catch (error) {
    if (error instanceof DomainValidationError) {
      expect(error.code).toBe(expectedCode);
    } else {
      throw error;
    }
  }
}

/**
 * Creates a mock CommandResult object.
 *
 * @example
 * ```typescript
 * mockSuccess('post', createCommandResult(1));
 * ```
 */
export function createCommandResult(
  id: number,
  message = 'Success'
): { id: number; message: string } {
  return { id, message };
}

/**
 * Creates a mock CommandResult for create operations.
 */
export function createCreatedResult(id: number): { id: number; message: string } {
  return createCommandResult(id, 'Created successfully');
}

/**
 * Creates a mock CommandResult for update operations.
 */
export function createUpdatedResult(id: number): { id: number; message: string } {
  return createCommandResult(id, 'Updated successfully');
}

/**
 * Creates a mock CommandResult for delete operations.
 */
export function createDeletedResult(id: number): { id: number; message: string } {
  return createCommandResult(id, 'Deleted successfully');
}

// ============================================================================
// Mapper Test Helpers
// ============================================================================

/**
 * Asserts that an object has all the expected properties.
 *
 * @example
 * ```typescript
 * const quotation = quotationMapper.toDomain(response);
 * expectDomainShape(quotation, ['id', 'projectId', 'status', 'lineItems']);
 * ```
 */
export function expectDomainShape<T extends object>(
  result: T,
  expectedKeys: (keyof T)[]
): void {
  expectedKeys.forEach((key) => {
    expect(result).toHaveProperty(key as string);
  });
}

/**
 * Asserts that string fields are properly trimmed.
 *
 * @example
 * ```typescript
 * const quotation = quotationMapper.toDomain({ projectName: '  Test  ' });
 * expectTrimmedStrings(quotation, ['projectName']);
 * expect(quotation.projectName).toBe('Test');
 * ```
 */
export function expectTrimmedStrings<T extends object>(
  result: T,
  stringFields: (keyof T)[]
): void {
  stringFields.forEach((field) => {
    const value = result[field];
    if (typeof value === 'string') {
      expect(value).toBe(value.trim());
      // Also verify no leading/trailing whitespace
      expect(value).not.toMatch(/^\s|\s$/);
    }
  });
}

/**
 * Asserts that a date string is in ISO format.
 *
 * @example
 * ```typescript
 * expectIsoDateString(quotation.createdAt);
 * ```
 */
export function expectIsoDateString(value: string | null | undefined): void {
  if (value === null || value === undefined) return;

  // ISO 8601 date or datetime format
  const isoPattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
  expect(value).toMatch(isoPattern);
}

/**
 * Asserts that a value is a valid positive integer ID.
 */
export function expectValidId(value: number): void {
  expect(Number.isInteger(value)).toBe(true);
  expect(value).toBeGreaterThan(0);
}

// ============================================================================
// Async Test Helpers
// ============================================================================

/**
 * Waits for a mock function to be called.
 *
 * @example
 * ```typescript
 * const mockFn = vi.fn();
 * triggerAsyncAction();
 * await waitForMockCall(mockFn);
 * expect(mockFn).toHaveBeenCalledWith(expectedArgs);
 * ```
 */
export async function waitForMockCall(
  mockFn: Mock,
  timeout = 1000
): Promise<void> {
  const startTime = Date.now();

  while (!mockFn.mock.calls.length) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Mock function was not called within ${timeout}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

/**
 * Flushes all pending promises.
 * Useful for testing async state updates.
 */
export async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export { DomainValidationError, isDomainValidationError } from '@/shared/lib/errors/domain-validation-error';
