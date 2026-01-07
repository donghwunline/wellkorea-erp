/**
 * Hook for managing TaskFlowModal state.
 * Handles data loading and save operations.
 */

import { useQuery } from '@tanstack/react-query';
import { taskFlowQueries, type TaskFlow, type TaskNode, type TaskEdge } from '@/entities/task-flow';
import { useSaveFlow } from '@/features/task-flow/save-flow';

export interface UseTaskFlowModalOptions {
  /** Project ID to load task flow for */
  projectId: number;
  /** Whether the modal is open */
  isOpen: boolean;
}

export interface UseTaskFlowModalReturn {
  /** The task flow data */
  flow: TaskFlow | undefined;
  /** Whether the flow is loading */
  isLoading: boolean;
  /** Error if loading failed */
  error: Error | null;
  /** Whether save is in progress */
  isSaving: boolean;
  /** Save the current flow state */
  save: (nodes: readonly TaskNode[], edges: readonly TaskEdge[]) => void;
}

/**
 * Hook for managing task flow modal state and data.
 */
export function useTaskFlowModal({
  projectId,
  isOpen,
}: UseTaskFlowModalOptions): UseTaskFlowModalReturn {
  // Load task flow data
  const { data: flow, isLoading, error } = useQuery({
    ...taskFlowQueries.byProject(projectId),
    enabled: isOpen && projectId > 0,
  });

  // Save mutation
  const { mutate: save, isPending: isSaving } = useSaveFlow();

  // Handle save
  const handleSave = (nodes: readonly TaskNode[], edges: readonly TaskEdge[]) => {
    if (flow) {
      save({
        id: flow.id,
        nodes,
        edges,
      });
    }
  };

  return {
    flow,
    isLoading,
    error: error as Error | null,
    isSaving,
    save: handleSave,
  };
}
