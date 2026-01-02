/**
 * Reject Approval Command Function.
 *
 * Command function for rejecting an approval at the current level.
 * Used by features layer via useMutation.
 */

import { httpClient, APPROVAL_ENDPOINTS } from '@/shared/api';
import type { ApprovalCommandResult } from './approve-approval';

// =============================================================================
// INPUT TYPE
// =============================================================================

/**
 * Input for reject command.
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

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate reject input.
 * @throws Error if validation fails
 */
function validateRejectInput(input: RejectApprovalInput): void {
  if (!input.reason?.trim()) {
    throw new Error('반려 사유를 입력해주세요');
  }
}

// =============================================================================
// COMMAND FUNCTION
// =============================================================================

/**
 * Reject an approval at the current level.
 *
 * @param input - Rejection input with id, reason, and optional comments
 * @returns Command result with id and message
 * @throws Error if reason is empty
 *
 * @example
 * ```tsx
 * const mutation = useMutation({
 *   mutationFn: rejectApproval,
 *   onSuccess: () => queryClient.invalidateQueries({ queryKey: approvalQueries.all() }),
 * });
 *
 * mutation.mutate({ id: 123, reason: '가격 검토 필요' });
 * ```
 */
export async function rejectApproval(input: RejectApprovalInput): Promise<ApprovalCommandResult> {
  validateRejectInput(input);

  return httpClient.post<ApprovalCommandResult>(
    APPROVAL_ENDPOINTS.reject(input.id),
    { reason: input.reason, comments: input.comments }
  );
}
