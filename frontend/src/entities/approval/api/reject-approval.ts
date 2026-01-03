/**
 * Reject Approval Command Function.
 *
 * Command function for rejecting an approval at the current level.
 * Used by features layer via useMutation.
 */

import { httpClient, APPROVAL_ENDPOINTS } from '@/shared/api';
import type { CommandResult } from './approval.mapper';

// =============================================================================
// REQUEST TYPE (internal)
// =============================================================================

/**
 * Request for rejecting.
 */
interface RejectRequest {
  reason: string;
  comments?: string;
}

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
// MAPPING
// =============================================================================

/**
 * Map reject input to API request.
 */
function toRejectRequest(input: RejectApprovalInput): RejectRequest {
  return {
    reason: input.reason.trim(),
    comments: input.comments?.trim() || undefined,
  };
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
export async function rejectApproval(input: RejectApprovalInput): Promise<CommandResult> {
  validateRejectInput(input);
  const request = toRejectRequest(input);
  return httpClient.post<CommandResult>(APPROVAL_ENDPOINTS.reject(input.id), request);
}
