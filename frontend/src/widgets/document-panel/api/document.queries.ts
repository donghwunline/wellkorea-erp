/**
 * Document query factory for the DocumentPanel widget.
 *
 * Uses TanStack Query v5 queryOptions pattern.
 * Fetches unified documents from the /api/documents endpoint.
 */

import { queryOptions } from '@tanstack/react-query';
import { httpClient } from '@/shared/api';
import type { ProjectDocument } from '@/shared/domain';

/**
 * Query factory for project document queries.
 * Usage: useQuery(documentQueries.byProject(projectId))
 */
export const documentQueries = {
  /**
   * Base query key for all document queries.
   */
  all: () => ['documents'] as const,

  /**
   * Query key for list queries.
   */
  lists: () => [...documentQueries.all(), 'list'] as const,

  /**
   * Query options for fetching all documents for a project.
   * Aggregates blueprints, delivery photos, and invoice documents.
   */
  byProject: (projectId: number) =>
    queryOptions({
      queryKey: [...documentQueries.lists(), 'project', projectId],
      queryFn: async (): Promise<ProjectDocument[]> => {
        return httpClient.get<ProjectDocument[]>(
          `/documents?projectId=${projectId}`
        );
      },
      enabled: projectId > 0,
      // Documents don't change frequently, cache for 5 minutes
      staleTime: 5 * 60 * 1000,
    }),
};
