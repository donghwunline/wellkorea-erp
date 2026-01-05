/**
 * Update Step Status Mutation Hook.
 *
 * Handles updating work progress step status (start, complete, skip, reset).
 *
 * Features Layer: Isolated user action
 * - Contains mutation logic
 * - Handles cache invalidation
 * - UX side-effects (toast) belong here
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  startStep,
  completeStep,
  skipStep,
  resetStep,
  workProgressQueries,
  type WorkProgressStep,
  type StartStepInput,
  type CompleteStepInput,
  type SkipStepInput,
} from '@/entities/work-progress';

export interface UseUpdateStepOptions {
  /**
   * Called on successful update.
   */
  onSuccess?: (step: WorkProgressStep) => void;

  /**
   * Called on error.
   */
  onError?: (error: Error) => void;
}

/**
 * Hook for starting a work progress step.
 *
 * @example
 * ```tsx
 * function StartButton({ step }: { step: WorkProgressStep }) {
 *   const { mutate, isPending } = useStartStep({
 *     onSuccess: () => toast.success('작업 시작'),
 *   });
 *
 *   return (
 *     <Button onClick={() => mutate({ sheetId: step.sheetId, stepId: step.id })} loading={isPending}>
 *       시작
 *     </Button>
 *   );
 * }
 * ```
 */
export function useStartStep(options: UseUpdateStepOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: StartStepInput) => startStep(input),

    onSuccess: (step) => {
      // Invalidate the sheet detail query
      queryClient.invalidateQueries({ queryKey: workProgressQueries.details() });
      queryClient.invalidateQueries({ queryKey: workProgressQueries.lists() });
      queryClient.invalidateQueries({ queryKey: workProgressQueries.summaries() });
      options.onSuccess?.(step);
    },

    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}

/**
 * Hook for completing a work progress step.
 *
 * @example
 * ```tsx
 * function CompleteButton({ step }: { step: WorkProgressStep }) {
 *   const { mutate, isPending } = useCompleteStep({
 *     onSuccess: () => toast.success('작업 완료'),
 *   });
 *
 *   return (
 *     <Button onClick={() => mutate({ sheetId: step.sheetId, stepId: step.id })} loading={isPending}>
 *       완료
 *     </Button>
 *   );
 * }
 * ```
 */
export function useCompleteStep(options: UseUpdateStepOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CompleteStepInput) => completeStep(input),

    onSuccess: (step) => {
      queryClient.invalidateQueries({ queryKey: workProgressQueries.details() });
      queryClient.invalidateQueries({ queryKey: workProgressQueries.lists() });
      queryClient.invalidateQueries({ queryKey: workProgressQueries.summaries() });
      options.onSuccess?.(step);
    },

    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}

/**
 * Hook for skipping a work progress step.
 */
export function useSkipStep(options: UseUpdateStepOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SkipStepInput) => skipStep(input),

    onSuccess: (step) => {
      queryClient.invalidateQueries({ queryKey: workProgressQueries.details() });
      queryClient.invalidateQueries({ queryKey: workProgressQueries.lists() });
      queryClient.invalidateQueries({ queryKey: workProgressQueries.summaries() });
      options.onSuccess?.(step);
    },

    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}

/**
 * Hook for resetting a work progress step to NOT_STARTED.
 */
export function useResetStep(options: UseUpdateStepOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sheetId, stepId }: { sheetId: number; stepId: number }) =>
      resetStep(sheetId, stepId),

    onSuccess: (step) => {
      queryClient.invalidateQueries({ queryKey: workProgressQueries.details() });
      queryClient.invalidateQueries({ queryKey: workProgressQueries.lists() });
      queryClient.invalidateQueries({ queryKey: workProgressQueries.summaries() });
      options.onSuccess?.(step);
    },

    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}
