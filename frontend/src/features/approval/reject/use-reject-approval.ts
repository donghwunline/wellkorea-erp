/**
 * Reject Approval Mutation Hook.
 *
 * Handles rejection action with cache invalidation.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalApi, approvalQueryKeys } from '@/entities/approval';
import { quotationQueryKeys } from '@/entities/quotation';
import type { CommandResult } from '@/entities/approval';

/**
 * Input for reject mutation.
 */
export interface RejectApprovalInput {
  /**
   * Approval ID to reject.
   */
  id: number;

  /**
   * Rejection reason (required).
   */
  reason: string;

  /**
   * Optional additional comments.
   */
  comments?: string;
}

/**
 * Options for useRejectApproval hook.
 */
export interface UseRejectApprovalOptions {
  /**
   * Callback on successful rejection.
   */
  onSuccess?: (result: CommandResult) => void;

  /**
   * Callback on error.
   */
  onError?: (error: Error) => void;

  /**
   * Entity ID for related cache invalidation (e.g., quotation ID).
   * Used to invalidate the entity's detail cache after rejection.
   */
  entityId?: number;
}

/**
 * Mutation hook for rejecting an approval.
 *
 * Features:
 * - Requires rejection reason
 * - Invalidates approval and related entity caches
 * - Provides loading and error states
 * - UX callbacks for toast notifications
 *
 * @example
 * ```tsx
 * function RejectDialog({ approvalId, quotationId, onClose }: Props) {
 *   const [reason, setReason] = useState('');
 *   const { mutate: reject, isPending } = useRejectApproval({
 *     entityId: quotationId,
 *     onSuccess: () => {
 *       toast.success('반려되었습니다');
 *       onClose();
 *     },
 *     onError: (err) => toast.error(err.message),
 *   });
 *
 *   const handleReject = () => {
 *     if (!reason.trim()) {
 *       toast.error('반려 사유를 입력해주세요');
 *       return;
 *     }
 *     reject({ id: approvalId, reason });
 *   };
 *
 *   return (
 *     <Dialog>
 *       <textarea value={reason} onChange={(e) => setReason(e.target.value)} />
 *       <button onClick={handleReject} disabled={isPending}>
 *         {isPending ? '처리중...' : '반려'}
 *       </button>
 *     </Dialog>
 *   );
 * }
 * ```
 */
export function useRejectApproval(options: UseRejectApprovalOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError, entityId } = options;

  return useMutation({
    mutationFn: async (input: RejectApprovalInput): Promise<CommandResult> => {
      if (!input.reason?.trim()) {
        throw new Error('반려 사유를 입력해주세요');
      }
      return approvalApi.reject(input.id, input.reason, input.comments);
    },

    onSuccess: (result, input) => {
      // Invalidate approval caches
      queryClient.invalidateQueries({ queryKey: approvalQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: approvalQueryKeys.detail(input.id) });

      // Invalidate related quotation cache if entityId provided
      if (entityId) {
        queryClient.invalidateQueries({ queryKey: quotationQueryKeys.detail(entityId) });
        queryClient.invalidateQueries({ queryKey: quotationQueryKeys.lists() });
      }

      onSuccess?.(result);
    },

    onError: (error: Error) => {
      onError?.(error);
    },
  });
}
