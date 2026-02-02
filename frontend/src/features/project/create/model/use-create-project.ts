/**
 * Create Project mutation hook.
 *
 * Features Layer: Isolated user action for creating projects.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createProject,
  type CreateProjectInput,
  type ProjectCommandResult,
  projectQueries,
} from '@/entities/project';

export interface UseCreateProjectOptions {
  onSuccess?: (result: ProjectCommandResult) => void;
  onError?: (error: Error) => void;
}

export function useCreateProject(options: UseCreateProjectOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) => createProject(input),

    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey: projectQueries.lists() });
      options.onSuccess?.(result);
    },

    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}
