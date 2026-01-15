/**
 * Blueprint attachment API response types and mappers.
 * Response types are internal - not exported from entity barrel.
 */

import type { BlueprintAttachment } from '../model/blueprint-attachment';
import type { AllowedFileType } from '../model/allowed-file-type';

/**
 * Command result for write operations.
 */
export interface CommandResult {
  id: number;
  message: string;
}

/**
 * Blueprint attachment response from backend (BlueprintAttachmentView).
 */
export interface BlueprintAttachmentResponse {
  id: number;
  taskFlowId: number;
  nodeId: string;
  fileName: string;
  fileType: AllowedFileType;
  fileSize: number;
  formattedFileSize: string;
  storagePath: string;
  uploadedById: number;
  uploadedByName: string;
  uploadedAt: string;
}

/**
 * Mappers for converting API responses to domain models.
 */
export const blueprintMapper = {
  /**
   * Map response to BlueprintAttachment domain model.
   */
  toDomain(response: BlueprintAttachmentResponse): BlueprintAttachment {
    return {
      id: response.id,
      taskFlowId: response.taskFlowId,
      nodeId: response.nodeId,
      fileName: response.fileName,
      fileType: response.fileType,
      fileSize: response.fileSize,
      formattedFileSize: response.formattedFileSize,
      storagePath: response.storagePath,
      uploadedById: response.uploadedById,
      uploadedByName: response.uploadedByName,
      uploadedAt: response.uploadedAt,
    };
  },

  /**
   * Map array of responses to domain models.
   */
  toDomainList(responses: BlueprintAttachmentResponse[]): BlueprintAttachment[] {
    return responses.map(blueprintMapper.toDomain);
  },
};
