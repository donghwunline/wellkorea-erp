/**
 * Purchase Request Attachment API.
 *
 * Command functions for linking/unlinking attachments to ServicePurchaseRequest.
 * Links existing files from TaskFlow blueprints (no new uploads).
 *
 * FSD Layer: entities
 */

import { httpClient, PURCHASE_REQUEST_ENDPOINTS } from '@/shared/api';

/**
 * Allowed file types for PR attachments.
 * Matches backend AllowedFileType enum and blueprint-attachment entity.
 */
type AttachmentFileType = 'PDF' | 'DXF' | 'DWG' | 'JPG' | 'PNG';

// ============================================================================
// Link Attachment
// ============================================================================

/**
 * Input for linking an existing blueprint to a purchase request.
 */
export interface LinkAttachmentInput {
  readonly purchaseRequestId: number;
  readonly fileName: string;
  readonly fileType: AttachmentFileType;
  readonly fileSize: number;
  readonly storagePath: string;
}

interface LinkAttachmentRequest {
  readonly fileName: string;
  readonly fileType: AttachmentFileType;
  readonly fileSize: number;
  readonly storagePath: string;
}

interface LinkAttachmentResult {
  readonly referenceId: string;
  readonly message: string;
}

/**
 * Link an existing blueprint attachment to a ServicePurchaseRequest.
 *
 * @param input - Attachment info from TaskFlow BlueprintAttachment
 * @returns Reference ID of the linked attachment
 */
export async function linkAttachment(input: LinkAttachmentInput): Promise<LinkAttachmentResult> {
  const request: LinkAttachmentRequest = {
    fileName: input.fileName,
    fileType: input.fileType,
    fileSize: input.fileSize,
    storagePath: input.storagePath,
  };

  return httpClient.post<LinkAttachmentResult>(
    `${PURCHASE_REQUEST_ENDPOINTS.BASE}/${input.purchaseRequestId}/attachments/link`,
    request
  );
}

// ============================================================================
// Unlink Attachment
// ============================================================================

/**
 * Input for unlinking an attachment from a purchase request.
 */
export interface UnlinkAttachmentInput {
  readonly purchaseRequestId: number;
  readonly referenceId: string;
}

interface UnlinkAttachmentResult {
  readonly referenceId: string;
  readonly message: string;
}

/**
 * Unlink an attachment from a ServicePurchaseRequest.
 * Does NOT delete the actual file (it belongs to TaskFlow).
 */
export async function unlinkAttachment(input: UnlinkAttachmentInput): Promise<UnlinkAttachmentResult> {
  return httpClient.delete<UnlinkAttachmentResult>(
    `${PURCHASE_REQUEST_ENDPOINTS.BASE}/${input.purchaseRequestId}/attachments/${input.referenceId}`
  );
}
