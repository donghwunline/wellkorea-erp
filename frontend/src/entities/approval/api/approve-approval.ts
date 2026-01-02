/**
 * Approve Approval Command Function.
 *
 * Command function for approving an approval at the current level.
 * Used by features layer via useMutation.
 */

import { httpClient, APPROVAL_ENDPOINTS } from '@/shared/api';

// =============================================================================
// COMMAND RESULT TYPE
// =============================================================================

/**
 * Result from approval command.
 */
export interface ApprovalCommandResult {
  id: number;
  message: string;
}

// =============================================================================
// INPUT TYPE
// =============================================================================

/**
 * Input for approve command.
 */
export interface ApproveApprovalInput {
  /**
   * Approval ID to approve.
   */
  id: number;

  /**
   * Optional comments for the approval.
   */
  comments?: string;
}

// =============================================================================
// COMMAND FUNCTION
// =============================================================================

/**
 * Approve an approval at the current level.
 *
 * @param input - Approval input with id and optional comments
 * @returns Command result with id and message
 *
 * @example
 * ```tsx
 * const mutation = useMutation({
 *   mutationFn: approveApproval,
 *   onSuccess: () => queryClient.invalidateQueries({ queryKey: approvalQueries.all() }),
 * });
 *
 * mutation.mutate({ id: 123, comments: '승인합니다' });
 * ```
 */
export async function approveApproval(input: ApproveApprovalInput): Promise<ApprovalCommandResult> {
  const request = input.comments ? { comments: input.comments } : undefined;
  return httpClient.post<ApprovalCommandResult>(
    APPROVAL_ENDPOINTS.approve(input.id),
    request
  );
}
