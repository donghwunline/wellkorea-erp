/**
 * Connect mail OAuth2 hook.
 *
 * Initiates the Microsoft OAuth2 authorization flow.
 */

import { useMutation } from '@tanstack/react-query';
import { getAuthorizationUrl } from '@/entities/mail-config';

/**
 * Options for useConnectMail hook.
 */
export interface UseConnectMailOptions {
  /**
   * Callback when authorization URL is retrieved successfully.
   * Default behavior: redirect to the authorization URL.
   */
  onSuccess?: (authorizationUrl: string) => void;

  /**
   * Callback when an error occurs.
   */
  onError?: (error: Error) => void;
}

/**
 * Hook for initiating mail OAuth2 connection.
 *
 * @example
 * ```tsx
 * function ConnectMailButton() {
 *   const { connect, isPending } = useConnectMail({
 *     onError: () => toast.error('Failed to start connection'),
 *   });
 *
 *   return (
 *     <button onClick={() => connect()} disabled={isPending}>
 *       {isPending ? 'Loading...' : 'Connect'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useConnectMail(options: UseConnectMailOptions = {}) {
  const { onSuccess, onError } = options;

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await getAuthorizationUrl();
      return response.authorizationUrl;
    },
    onSuccess: (authorizationUrl: string) => {
      if (onSuccess) {
        onSuccess(authorizationUrl);
      } else {
        // Default: redirect to Microsoft authorization
        window.location.href = authorizationUrl;
      }
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  return {
    connect: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
