/**
 * Register attachment after successful direct upload to MinIO.
 */

import { httpClient } from '@/shared/api';
import { BLUEPRINT_ENDPOINTS } from '@/shared/config/endpoints';
import type { CommandResult } from './blueprint-attachment.mapper';

/**
 * Input for registering an attachment after direct upload.
 */
export interface RegisterAttachmentInput {
  flowId: number;
  nodeId: string;
  fileName: string;
  fileSize: number;
  objectKey: string;
}

/**
 * Register an attachment after successful direct upload to MinIO.
 * Called by client after uploading file to MinIO using presigned URL.
 */
export async function registerAttachment(
  input: RegisterAttachmentInput
): Promise<CommandResult> {
  return httpClient.post<CommandResult>(
    BLUEPRINT_ENDPOINTS.register(input.flowId, input.nodeId),
    {
      fileName: input.fileName,
      fileSize: input.fileSize,
      objectKey: input.objectKey,
    }
  );
}
