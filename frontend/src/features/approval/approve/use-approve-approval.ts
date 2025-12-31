/**
 * Approve Approval Mutation Hook.
 *
 * Handles approval action with optimistic updates and cache invalidation.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalApi, approvalQueryKeys } from '@/entities/approval';
import { quotationQueries } from '@/entities/quotation';
import type { CommandResult } from '@/entities/approval';

/**
 * Input for approve mutation.
 */
export interface ApproveApprovalInput {
  /**
   * Approval ID to approve.
   */
  id: number;

  /**
   * Optional approval comments.
   */
  comments?: string;
}

/**
 * Options for useApproveApproval hook.
 */
export interface UseApproveApprovalOptions {
  /**
   * Callback on successful approval.
   */
  onSuccess?: (result: CommandResult) => void;

  /**
   * Callback on error.
   */
  onError?: (error: Error) => void;

  /**
   * Entity ID for related cache invalidation (e.g., quotation ID).
   * Used to invalidate the entity's detail cache after approval.
   */
  entityId?: number;
}

/**
 * Mutation hook for approving an approval.
 *
 * Features:
 * - Invalidates approval and related entity caches
 * - Provides loading and error states
 * - UX callbacks for toast notifications
 *
 * @example
 * ```tsx
 * function ApproveButton({ approvalId, quotationId }: Props) {
 *   const { mutate: approve, isPending } = useApproveApproval({
 *     entityId: quotationId,
 *     onSuccess: () => toast.success('승인되었습니다'),
 *     onError: (err) => toast.error(err.message),
 *   });
 *
 *   const handleApprove = () => {
 *     approve({ id: approvalId, comments: '승인합니다' });
 *   };
 *
 *   return (
 *     <button onClick={handleApprove} disabled={isPending}>
 *       {isPending ? '처리중...' : '승인'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useApproveApproval(options: UseApproveApprovalOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError, entityId } = options;

  return useMutation({
    mutationFn: async (input: ApproveApprovalInput): Promise<CommandResult> => {
      return approvalApi.approve(input.id, input.comments);
    },

    onSuccess: (result, input) => {
      // Invalidate approval caches
      queryClient.invalidateQueries({ queryKey: approvalQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: approvalQueryKeys.detail(input.id) });

      // Invalidate related quotation cache if entityId provided
      if (entityId) {
        queryClient.invalidateQueries({ queryKey: quotationQueries.details() });
        queryClient.invalidateQueries({ queryKey: quotationQueries.lists() });
      }

      onSuccess?.(result);
    },

    onError: (error: Error) => {
      onError?.(error);
    },
  });
}
