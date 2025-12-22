/**
 * Hook for approval actions.
 * Encapsulates approval service calls with loading and error state.
 *
 * CQRS Pattern: Command actions (approve, reject) return CommandResult
 * with only { id, message }. Use getApproval() to fetch full details
 * after a command operation if needed.
 */

import { useCallback, useState } from 'react';
import { approvalService } from '@/services';
import type {
  ApprovalDetails,
  ApprovalListParams,
  CommandResult,
  PaginatedApprovals,
} from '@/services';

export interface UseApprovalActionsReturn {
  isLoading: boolean;
  error: string | null;
  getApprovals: (params?: ApprovalListParams) => Promise<PaginatedApprovals>;
  getApproval: (id: number) => Promise<ApprovalDetails>;
  approve: (id: number, comment?: string) => Promise<CommandResult>;
  reject: (id: number, reason: string) => Promise<CommandResult>;
  clearError: () => void;
}

/**
 * Hook that provides approval action handlers with loading and error state.
 */
export function useApprovalActions(): UseApprovalActionsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getApprovals = useCallback(async (params?: ApprovalListParams): Promise<PaginatedApprovals> => {
    setIsLoading(true);
    setError(null);
    try {
      return await approvalService.getApprovals(params);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch approvals';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getApproval = useCallback(async (id: number): Promise<ApprovalDetails> => {
    setIsLoading(true);
    setError(null);
    try {
      return await approvalService.getApproval(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch approval';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const approve = useCallback(async (id: number, comment?: string): Promise<CommandResult> => {
    setIsLoading(true);
    setError(null);
    try {
      return await approvalService.approve(id, comment);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reject = useCallback(async (id: number, reason: string): Promise<CommandResult> => {
    setIsLoading(true);
    setError(null);
    try {
      return await approvalService.reject(id, reason);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    getApprovals,
    getApproval,
    approve,
    reject,
    clearError,
  };
}
