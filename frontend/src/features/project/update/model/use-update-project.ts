/**
 * Update Project mutation hook.
 *
 * Features Layer: Isolated user action for updating projects.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateProject,
  projectQueries,
  type UpdateProjectInput,
  type ProjectCommandResult,
} from '@/entities/project';

export interface UseUpdateProjectOptions {
  onSuccess?: (result: ProjectCommandResult) => void;
  onError?: (error: Error) => void;
}

export function useUpdateProject(options: UseUpdateProjectOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateProjectInput }) =>
      updateProject(id, input),

    onSuccess: (result) => {
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: projectQueries.lists() });
      // Invalidate the specific project detail
      queryClient.invalidateQueries({ queryKey: projectQueries.details() });
      options.onSuccess?.(result);
    },

    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}
