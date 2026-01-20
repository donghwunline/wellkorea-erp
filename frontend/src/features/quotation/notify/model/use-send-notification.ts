/**
 * Send Quotation Notification Mutation Hook.
 *
 * Handles sending revision notification email for a quotation.
 *
 * Features Layer: Isolated user action
 * - Contains mutation logic
 * - Handles cache invalidation (status may change to SENT)
 * - UX side-effects (toast) belong here
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  sendQuotationNotification,
  quotationQueries,
  type SendNotificationInput,
} from '@/entities/quotation';

export interface UseSendNotificationOptions {
  /**
   * Called on successful notification.
   */
  onSuccess?: () => void;

  /**
   * Called on error.
   */
  onError?: (error: Error) => void;
}

/**
 * Hook for sending revision notification email.
 *
 * Only valid for quotations with status = APPROVED or SENT.
 *
 * @example
 * ```tsx
 * function SendNotificationButton({ quotation }: { quotation: Quotation }) {
 *   const { mutate, isPending } = useSendNotification({
 *     onSuccess: () => toast.success('Notification sent'),
 *     onError: (error) => toast.error(error.message),
 *   });
 *
 *   if (!quotationRules.canSend(quotation)) return null;
 *
 *   return (
 *     <Button
 *       onClick={() => mutate({ quotationId: quotation.id })}
 *       loading={isPending}
 *     >
 *       Send Email
 *     </Button>
 *   );
 * }
 * ```
 */
export function useSendNotification(options: UseSendNotificationOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendNotificationInput) => sendQuotationNotification(input),

    onSuccess: () => {
      // Invalidate detail (status may change to SENT)
      queryClient.invalidateQueries({ queryKey: quotationQueries.details() });
      // Invalidate lists (status column may update)
      queryClient.invalidateQueries({ queryKey: quotationQueries.lists() });
      options.onSuccess?.();
    },

    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}
