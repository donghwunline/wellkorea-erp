/**
 * Project Actions Hook
 *
 * Encapsulates project service calls for use by pages.
 * Following architecture rule: pages should not import services directly.
 */

import { useCallback, useMemo } from 'react';
import { useServiceActions } from '@/shared/hooks';
import { projectService } from '@/services';
import type { CreateProjectRequest, UpdateProjectRequest } from '@/services';

/**
 * Hook for project CRUD actions.
 */
export function useProjectActions() {
  const { isLoading, error, clearError, wrapAction } = useServiceActions();

  const createProject = useCallback(
    (data: CreateProjectRequest) =>
      wrapAction(projectService.createProject, 'Failed to create project')(data),
    [wrapAction]
  );

  const updateProject = useCallback(
    (id: number, data: UpdateProjectRequest) =>
      wrapAction(
        (i: number, d: UpdateProjectRequest) => projectService.updateProject(i, d),
        'Failed to update project'
      )(id, data),
    [wrapAction]
  );

  const getProject = useCallback(
    (id: number) => wrapAction(projectService.getProject, 'Failed to load project')(id),
    [wrapAction]
  );

  return useMemo(
    () => ({
      isLoading,
      error,
      createProject,
      updateProject,
      getProject,
      clearError,
    }),
    [isLoading, error, createProject, updateProject, getProject, clearError]
  );
}
