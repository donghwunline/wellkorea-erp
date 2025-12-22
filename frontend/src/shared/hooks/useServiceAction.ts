/**
 * Generic hook for service actions with loading and error state.
 *
 * Eliminates boilerplate in action hooks by providing a reusable wrapper
 * for async service calls with consistent loading/error handling.
 *
 * @example
 * ```tsx
 * // Instead of repeating try/catch/finally in every action:
 * const { execute: createUser, isLoading, error, clearError } = useServiceAction(
 *   userService.createUser,
 *   'Failed to create user'
 * );
 *
 * // Usage in component:
 * const handleSubmit = async (data) => {
 *   const user = await createUser(data);
 *   navigate(`/users/${user.id}`);
 * };
 * ```
 */

import { useCallback, useState } from 'react';

/**
 * Return type for useServiceAction hook.
 */
export interface UseServiceActionReturn<T, Args extends unknown[]> {
  /** Execute the service action */
  execute: (...args: Args) => Promise<T>;
  /** Whether the action is currently in progress */
  isLoading: boolean;
  /** Error message if the action failed, null otherwise */
  error: string | null;
  /** Clear the current error */
  clearError: () => void;
}

/**
 * Extracts the error message from an unknown error.
 */
function extractErrorMessage(err: unknown, fallbackMessage: string): string {
  if (err instanceof Error) {
    return err.message;
  }
  return fallbackMessage;
}

/**
 * Hook that wraps a service function with loading and error state management.
 *
 * @param serviceFn - The service function to wrap
 * @param fallbackErrorMessage - Message to show if error doesn't have a message
 * @returns Object with execute function, loading state, error state, and clearError
 *
 * @example
 * ```tsx
 * // Single action
 * const { execute: getUser, isLoading, error } = useServiceAction(
 *   (id: number) => userService.getUser(id),
 *   'Failed to load user'
 * );
 *
 * // Multiple actions with shared state (use useServiceActions instead)
 * ```
 */
export function useServiceAction<T, Args extends unknown[]>(
  serviceFn: (...args: Args) => Promise<T>,
  fallbackErrorMessage = 'An error occurred'
): UseServiceActionReturn<T, Args> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const execute = useCallback(
    async (...args: Args): Promise<T> => {
      setIsLoading(true);
      setError(null);
      try {
        return await serviceFn(...args);
      } catch (err) {
        const message = extractErrorMessage(err, fallbackErrorMessage);
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [serviceFn, fallbackErrorMessage]
  );

  return { execute, isLoading, error, clearError };
}

/**
 * Return type for useServiceActions hook (multiple actions with shared state).
 */
export interface UseServiceActionsReturn {
  /** Whether any action is currently in progress */
  isLoading: boolean;
  /** Error message if any action failed, null otherwise */
  error: string | null;
  /** Clear the current error */
  clearError: () => void;
  /** Wrap a service function with the shared loading/error state */
  wrapAction: <T, Args extends unknown[]>(
    serviceFn: (...args: Args) => Promise<T>,
    fallbackErrorMessage?: string
  ) => (...args: Args) => Promise<T>;
}

/**
 * Hook that provides shared loading and error state for multiple service actions.
 *
 * Use this when you have multiple related actions that should share loading/error state
 * (e.g., CRUD operations for a single entity).
 *
 * @returns Object with shared state and wrapAction function
 *
 * @example
 * ```tsx
 * function useUserActions() {
 *   const { isLoading, error, clearError, wrapAction } = useServiceActions();
 *
 *   const getUser = useCallback(
 *     wrapAction(userService.getUser, 'Failed to load user'),
 *     [wrapAction]
 *   );
 *
 *   const createUser = useCallback(
 *     wrapAction(userService.createUser, 'Failed to create user'),
 *     [wrapAction]
 *   );
 *
 *   return { isLoading, error, clearError, getUser, createUser };
 * }
 * ```
 */
export function useServiceActions(): UseServiceActionsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const wrapAction = useCallback(
    <T, Args extends unknown[]>(
      serviceFn: (...args: Args) => Promise<T>,
      fallbackErrorMessage = 'An error occurred'
    ) => {
      return async (...args: Args): Promise<T> => {
        setIsLoading(true);
        setError(null);
        try {
          return await serviceFn(...args);
        } catch (err) {
          const message = extractErrorMessage(err, fallbackErrorMessage);
          setError(message);
          throw err;
        } finally {
          setIsLoading(false);
        }
      };
    },
    []
  );

  return { isLoading, error, clearError, wrapAction };
}
