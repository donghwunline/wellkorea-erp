/**
 * Upload blueprint attachment using presigned URL (direct to MinIO).
 *
 * Flow:
 * 1. Get presigned upload URL from backend
 * 2. Upload file directly to MinIO using presigned URL
 * 3. Register attachment metadata in backend
 */

import { DomainValidationError } from '@/shared/api';
import type { CommandResult } from './blueprint-attachment.mapper';
import { fileTypeRules, MAX_FILE_SIZE } from '../model/allowed-file-type';
import { getUploadUrl } from './get-upload-url';
import { registerAttachment } from './register-attachment';

/**
 * Input for uploading an attachment.
 */
export interface UploadAttachmentInput {
  flowId: number;
  nodeId: string;
  file: File;
}

/**
 * Validates upload attachment input.
 *
 * @throws DomainValidationError if validation fails
 */
function validateUploadInput(input: UploadAttachmentInput): void {
  if (!input.flowId || input.flowId <= 0) {
    throw new DomainValidationError('REQUIRED', 'flowId', 'TaskFlow is required');
  }

  if (!input.nodeId || input.nodeId.trim().length === 0) {
    throw new DomainValidationError('REQUIRED', 'nodeId', 'Node ID is required');
  }

  if (!input.file) {
    throw new DomainValidationError('REQUIRED', 'file', 'File is required');
  }

  if (!input.file.name || input.file.name.trim().length === 0) {
    throw new DomainValidationError('REQUIRED', 'file', 'File name is required');
  }

  if (!fileTypeRules.isAllowedExtension(input.file.name)) {
    throw new DomainValidationError(
      'INVALID',
      'file',
      `File type not allowed. Allowed types: ${fileTypeRules.getAllowedExtensionsString()}`
    );
  }

  if (input.file.size <= 0) {
    throw new DomainValidationError('INVALID', 'file', 'File is empty');
  }

  if (input.file.size > MAX_FILE_SIZE) {
    throw new DomainValidationError(
      'OUT_OF_RANGE',
      'file',
      `File size exceeds maximum of ${fileTypeRules.getMaxFileSizeFormatted()}`
    );
  }
}

/**
 * Upload a blueprint attachment using presigned URL flow:
 * 1. Get presigned upload URL from backend
 * 2. Upload file directly to MinIO
 * 3. Register attachment metadata in backend
 */
export async function uploadAttachment(input: UploadAttachmentInput): Promise<CommandResult> {
  validateUploadInput(input);

  // Step 1: Get presigned upload URL from backend
  const { uploadUrl, objectKey } = await getUploadUrl({
    flowId: input.flowId,
    nodeId: input.nodeId,
    fileName: input.file.name,
    fileSize: input.file.size,
    contentType: input.file.type || 'application/octet-stream',
  });

  // Step 2: Upload directly to MinIO using presigned URL
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: input.file,
    headers: {
      'Content-Type': input.file.type || 'application/octet-stream',
    },
  });

  if (!uploadResponse.ok) {
    throw new Error(
      `Direct upload to storage failed: ${uploadResponse.status} ${uploadResponse.statusText}`
    );
  }

  // Step 3: Register attachment metadata in backend
  return registerAttachment({
    flowId: input.flowId,
    nodeId: input.nodeId,
    fileName: input.file.name,
    fileSize: input.file.size,
    objectKey,
  });
}
