/**
 * Project Summary Hook
 *
 * Fetches and manages project summary data for the navigation grid.
 * Encapsulates API calls and state management.
 */

import { useCallback, useEffect, useState } from 'react';
import { projectSummaryApi, type ProjectSectionsSummary } from '@/entities/project';

export interface UseProjectSummaryOptions {
  /** Project ID to fetch summary for */
  projectId: number;
  /** Whether to fetch immediately (default: true) */
  enabled?: boolean;
}

export interface UseProjectSummaryReturn {
  /** Project summary data */
  summary: ProjectSectionsSummary | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually refetch the summary */
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch project summary statistics.
 *
 * @example
 * ```typescript
 * const { summary, isLoading, error, refetch } = useProjectSummary({ projectId: 123 });
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorAlert message={error} onRetry={refetch} />;
 *
 * return <Grid sections={summary.sections} />;
 * ```
 */
export function useProjectSummary({
  projectId,
  enabled = true,
}: UseProjectSummaryOptions): UseProjectSummaryReturn {
  const [summary, setSummary] = useState<ProjectSectionsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!enabled || !projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await projectSummaryApi.getSummary(projectId);
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch project summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to load project summary');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, enabled]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    isLoading,
    error,
    refetch: fetchSummary,
  };
}
