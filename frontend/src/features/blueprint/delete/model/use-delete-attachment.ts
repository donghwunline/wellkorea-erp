/**
 * Mutation hook for deleting blueprint attachments.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteAttachment, blueprintQueries } from '@/entities/blueprint-attachment';
import type { CommandResult } from '@/entities/blueprint-attachment';

interface UseDeleteAttachmentOptions {
  onSuccess?: (result: CommandResult) => void;
  onError?: (error: Error) => void;
}

export function useDeleteAttachment(options: UseDeleteAttachmentOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAttachment,
    onSuccess: (result) => {
      // Invalidate all blueprint queries
      queryClient.invalidateQueries({
        queryKey: blueprintQueries.all(),
      });
      options.onSuccess?.(result);
    },
    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}
