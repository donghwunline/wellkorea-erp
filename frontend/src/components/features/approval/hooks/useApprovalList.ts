/**
 * Hook for approval list.
 * Fetches and manages pending approvals for the current user.
 */

import { useCallback, useEffect, useState } from 'react';
import { approvalService } from '@/services';
import type { ApprovalDetails, ApprovalStatus, PaginationMetadata } from '@/services';

export interface UseApprovalListParams {
  page: number;
  status?: ApprovalStatus;
  refreshTrigger?: number;
}

export interface UseApprovalListReturn {
  approvals: ApprovalDetails[];
  pagination: PaginationMetadata | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook that provides approval list with loading state.
 */
export function useApprovalList({
  page,
  status,
  refreshTrigger = 0,
}: UseApprovalListParams): UseApprovalListReturn {
  const [approvals, setApprovals] = useState<ApprovalDetails[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refetch = useCallback(() => {
    setTrigger(t => t + 1);
  }, []);

  useEffect(() => {
    const fetchApprovals = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await approvalService.getApprovals({
          page,
          size: 10,
          status,
          myPending: true,
        });
        setApprovals(result.data);
        setPagination(result.pagination);
      } catch {
        setError('Failed to load approvals');
        setApprovals([]);
        setPagination(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApprovals();
  }, [page, status, refreshTrigger, trigger]);

  return {
    approvals,
    pagination,
    isLoading,
    error,
    refetch,
  };
}
