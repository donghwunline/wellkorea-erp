/**
 * Delivery photo upload API functions.
 * Handles the 3-step upload flow:
 * 1. Get presigned URL from backend
 * 2. Upload file directly to MinIO
 * 3. Register attachment and mark as delivered
 */

import { httpClient } from '@/shared/api';
import { attachmentRules, ATTACHMENT_MAX_SIZE } from '@/shared/domain';
import { DELIVERY_ENDPOINTS } from '@/shared/config/endpoints';
import type { CommandResult } from './delivery.mapper';

/**
 * Response from upload URL endpoint.
 */
interface UploadUrlResponse {
  uploadUrl: string;
  objectKey: string;
}

/**
 * Input for getting photo upload URL.
 */
export interface GetPhotoUploadUrlInput {
  deliveryId: number;
  fileName: string;
  fileSize: number;
  contentType: string;
}

/**
 * Input for uploading delivery photo and marking as delivered.
 */
export interface UploadDeliveryPhotoInput {
  deliveryId: number;
  file: File;
}

/**
 * Get presigned URL for delivery photo upload.
 * @internal - Used by uploadDeliveryPhoto
 */
async function getPhotoUploadUrl(input: GetPhotoUploadUrlInput): Promise<UploadUrlResponse> {
  return httpClient.post(DELIVERY_ENDPOINTS.photoUploadUrl(input.deliveryId), {
    fileName: input.fileName,
    fileSize: input.fileSize,
    contentType: input.contentType,
  });
}

/**
 * Upload a delivery photo and mark the delivery as delivered.
 *
 * This is a 3-step process:
 * 1. Get a presigned upload URL from the backend
 * 2. Upload the file directly to MinIO using the presigned URL
 * 3. Register the attachment and mark the delivery as delivered
 *
 * @throws Error if file type is not allowed (only JPG/PNG)
 * @throws Error if file size exceeds 10MB limit
 * @throws Error if upload to MinIO fails
 */
export async function uploadDeliveryPhoto(input: UploadDeliveryPhotoInput): Promise<CommandResult> {
  const { deliveryId, file } = input;

  // Validate file type (images only for delivery photos)
  if (!attachmentRules.isAllowedImage(file.name)) {
    throw new Error('파일 형식이 올바르지 않습니다. JPG 또는 PNG 이미지만 허용됩니다.');
  }

  // Validate file size
  if (!attachmentRules.isValidSize(file.size)) {
    throw new Error(`파일 크기가 너무 큽니다. 최대 ${attachmentRules.formatFileSize(ATTACHMENT_MAX_SIZE)}까지 허용됩니다.`);
  }

  // Step 1: Get presigned URL from backend
  const contentType = attachmentRules.getContentType(file.name);
  const { uploadUrl, objectKey } = await getPhotoUploadUrl({
    deliveryId,
    fileName: file.name,
    fileSize: file.size,
    contentType,
  });

  // Step 2: Upload file directly to MinIO
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': contentType,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error('파일 업로드에 실패했습니다. 다시 시도해 주세요.');
  }

  // Step 3: Register attachment and mark as delivered
  return httpClient.post(DELIVERY_ENDPOINTS.registerPhotoAndDeliver(deliveryId), {
    fileName: file.name,
    fileSize: file.size,
    objectKey,
  });
}
