/**
 * Project Actions Hook
 *
 * Encapsulates project service calls for use by pages.
 * Following architecture rule: pages should not import services directly.
 */

import { useCallback, useState } from 'react';
import { projectService } from '@/services';
import type { CreateProjectRequest, ProjectDetails, UpdateProjectRequest } from '@/services';

/**
 * Hook for project CRUD actions.
 */
export function useProjectActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProject = useCallback(async (data: CreateProjectRequest): Promise<ProjectDetails> => {
    setIsLoading(true);
    setError(null);
    try {
      const project = await projectService.createProject(data);
      return project;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create project';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProject = useCallback(
    async (id: number, data: UpdateProjectRequest): Promise<ProjectDetails> => {
      setIsLoading(true);
      setError(null);
      try {
        const project = await projectService.updateProject(id, data);
        return project;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update project';
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getProject = useCallback(async (id: number): Promise<ProjectDetails> => {
    setIsLoading(true);
    setError(null);
    try {
      const project = await projectService.getProject(id);
      return project;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load project';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    createProject,
    updateProject,
    getProject,
    clearError,
  };
}
