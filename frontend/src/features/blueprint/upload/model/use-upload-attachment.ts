/**
 * Mutation hook for uploading blueprint attachments.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadAttachment, blueprintQueries } from '@/entities/blueprint-attachment';
import type { CommandResult } from '@/entities/blueprint-attachment';

interface UseUploadAttachmentOptions {
  onSuccess?: (result: CommandResult) => void;
  onError?: (error: Error) => void;
}

export function useUploadAttachment(options: UseUploadAttachmentOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadAttachment,
    onSuccess: (result) => {
      // Invalidate flow-level and node-level queries
      queryClient.invalidateQueries({
        queryKey: blueprintQueries.lists(),
      });
      options.onSuccess?.(result);
    },
    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}
