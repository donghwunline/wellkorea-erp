/**
 * Disconnect mail OAuth2 hook.
 *
 * Removes the stored OAuth2 configuration.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { disconnectMail, mailConfigQueries } from '@/entities/mail-config';

/**
 * Options for useDisconnectMail hook.
 */
export interface UseDisconnectMailOptions {
  /**
   * Callback when disconnection succeeds.
   */
  onSuccess?: () => void;

  /**
   * Callback when an error occurs.
   */
  onError?: (error: Error) => void;
}

/**
 * Hook for disconnecting mail OAuth2.
 *
 * @example
 * ```tsx
 * function DisconnectMailButton() {
 *   const { disconnect, isPending } = useDisconnectMail({
 *     onSuccess: () => toast.success('Mail disconnected'),
 *     onError: () => toast.error('Failed to disconnect'),
 *   });
 *
 *   return (
 *     <button onClick={() => disconnect()} disabled={isPending}>
 *       {isPending ? 'Disconnecting...' : 'Disconnect'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useDisconnectMail(options: UseDisconnectMailOptions = {}) {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: disconnectMail,
    onSuccess: () => {
      // Invalidate status query to refresh UI
      queryClient.invalidateQueries({ queryKey: mailConfigQueries.all() });
      onSuccess?.();
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  return {
    disconnect: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
