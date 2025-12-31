/**
 * Project Actions Hook
 *
 * Encapsulates project API calls for use by pages.
 * Following architecture rule: pages should not import API directly.
 */

import { useCallback, useMemo } from 'react';
import { useServiceActions } from './useServiceAction';
import {
  projectApi,
  projectMapper,
  type CreateProjectRequest,
  type UpdateProjectRequest,
} from '@/entities/project';

/**
 * Hook for project CRUD actions.
 */
export function useProjectActions() {
  const { isLoading, error, clearError, wrapAction } = useServiceActions();

  const createProject = useCallback(
    (data: CreateProjectRequest) =>
      wrapAction(
        async (d: CreateProjectRequest) => projectMapper.toCommandResult(await projectApi.create(d)),
        'Failed to create project'
      )(data),
    [wrapAction]
  );

  const updateProject = useCallback(
    (id: number, data: UpdateProjectRequest) =>
      wrapAction(
        async (i: number, d: UpdateProjectRequest) =>
          projectMapper.toCommandResult(await projectApi.update(i, d)),
        'Failed to update project'
      )(id, data),
    [wrapAction]
  );

  const getProject = useCallback(
    (id: number) =>
      wrapAction(
        async (i: number) => projectMapper.toDomain(await projectApi.getById(i)),
        'Failed to load project'
      )(id),
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
