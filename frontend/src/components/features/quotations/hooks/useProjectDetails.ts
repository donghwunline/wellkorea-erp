/**
 * Hook for loading project details.
 * Fetches project data when ID changes.
 */

import { useEffect, useState } from 'react';
import { projectService } from '@/services';
import type { ProjectDetails } from '@/services';

export interface UseProjectDetailsReturn {
  project: ProjectDetails | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook that fetches project details by ID.
 */
export function useProjectDetails(projectId: number | null): UseProjectDetailsReturn {
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(!!projectId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when projectId becomes null
    if (!projectId) {
      setProject(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const loadProject = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await projectService.getProject(projectId);
        if (!cancelled) {
          setProject(data);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load project details');
          setProject(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadProject();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return { project, isLoading, error };
}
