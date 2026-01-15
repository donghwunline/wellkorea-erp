/**
 * Get presigned upload URL for direct MinIO upload.
 */

import { httpClient, DomainValidationError } from '@/shared/api';
import { BLUEPRINT_ENDPOINTS } from '@/shared/config/endpoints';
import { fileTypeRules, MAX_FILE_SIZE } from '../model/allowed-file-type';

/**
 * Input for getting presigned upload URL.
 */
export interface GetUploadUrlInput {
  flowId: number;
  nodeId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

/**
 * Response containing presigned upload URL and object key.
 */
export interface UploadUrlResponse {
  uploadUrl: string;
  objectKey: string;
}

/**
 * Validates get upload URL input.
 *
 * @throws DomainValidationError if validation fails
 */
function validateInput(input: GetUploadUrlInput): void {
  if (!input.flowId || input.flowId <= 0) {
    throw new DomainValidationError('REQUIRED', 'flowId', 'TaskFlow is required');
  }

  if (!input.nodeId || input.nodeId.trim().length === 0) {
    throw new DomainValidationError('REQUIRED', 'nodeId', 'Node ID is required');
  }

  if (!input.fileName || input.fileName.trim().length === 0) {
    throw new DomainValidationError('REQUIRED', 'fileName', 'File name is required');
  }

  if (!fileTypeRules.isAllowedExtension(input.fileName)) {
    throw new DomainValidationError(
      'INVALID',
      'fileName',
      `File type not allowed. Allowed types: ${fileTypeRules.getAllowedExtensionsString()}`
    );
  }

  if (input.fileSize <= 0) {
    throw new DomainValidationError('INVALID', 'fileSize', 'File is empty');
  }

  if (input.fileSize > MAX_FILE_SIZE) {
    throw new DomainValidationError(
      'OUT_OF_RANGE',
      'fileSize',
      `File size exceeds maximum of ${fileTypeRules.getMaxFileSizeFormatted()}`
    );
  }
}

/**
 * Get a presigned URL for direct upload to MinIO.
 */
export async function getUploadUrl(input: GetUploadUrlInput): Promise<UploadUrlResponse> {
  validateInput(input);

  return httpClient.post<UploadUrlResponse>(
    BLUEPRINT_ENDPOINTS.uploadUrl(input.flowId, input.nodeId),
    {
      fileName: input.fileName,
      fileSize: input.fileSize,
      contentType: input.contentType,
    }
  );
}
