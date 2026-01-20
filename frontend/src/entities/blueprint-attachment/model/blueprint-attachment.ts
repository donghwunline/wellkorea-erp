/**
 * Blueprint attachment domain model.
 * Represents a file attachment on a TaskFlow node.
 */

import type { AllowedFileType } from './allowed-file-type';

/**
 * Blueprint attachment entity.
 */
export interface BlueprintAttachment {
  readonly id: number;
  readonly taskFlowId: number;
  readonly nodeId: string;
  readonly fileName: string;
  readonly fileType: AllowedFileType;
  readonly fileSize: number;
  readonly formattedFileSize: string;
  readonly storagePath: string;
  readonly uploadedById: number;
  readonly uploadedByName: string;
  readonly uploadedAt: string; // ISO datetime string
}

/**
 * Summary of attachments for a node (for badge display).
 */
export interface NodeAttachmentSummary {
  readonly nodeId: string;
  readonly count: number;
}

/**
 * Business rules for blueprint attachments.
 */
export const blueprintRules = {
  /**
   * Check if attachment is an image.
   */
  isImage(attachment: BlueprintAttachment): boolean {
    return attachment.fileType === 'JPG' || attachment.fileType === 'PNG';
  },

  /**
   * Check if attachment is a CAD file.
   */
  isCadFile(attachment: BlueprintAttachment): boolean {
    return attachment.fileType === 'DXF' || attachment.fileType === 'DWG';
  },

  /**
   * Check if attachment is a PDF.
   */
  isPdf(attachment: BlueprintAttachment): boolean {
    return attachment.fileType === 'PDF';
  },

  /**
   * Get icon name for file type (for UI rendering).
   */
  getFileIcon(
    attachment: BlueprintAttachment
  ): 'file-pdf' | 'file-image' | 'file-cad' {
    if (blueprintRules.isPdf(attachment)) return 'file-pdf';
    if (blueprintRules.isImage(attachment)) return 'file-image';
    return 'file-cad';
  },

  /**
   * Format upload date for display.
   */
  formatUploadDate(attachment: BlueprintAttachment): string {
    return new Date(attachment.uploadedAt).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  /**
   * Group attachments by node ID.
   */
  groupByNode(
    attachments: readonly BlueprintAttachment[]
  ): Map<string, BlueprintAttachment[]> {
    const grouped = new Map<string, BlueprintAttachment[]>();
    for (const attachment of attachments) {
      const existing = grouped.get(attachment.nodeId) ?? [];
      grouped.set(attachment.nodeId, [...existing, attachment]);
    }
    return grouped;
  },

  /**
   * Count attachments per node.
   */
  countByNode(
    attachments: readonly BlueprintAttachment[]
  ): Map<string, number> {
    const counts = new Map<string, number>();
    for (const attachment of attachments) {
      counts.set(attachment.nodeId, (counts.get(attachment.nodeId) ?? 0) + 1);
    }
    return counts;
  },

  /**
   * Get attachment count for a specific node.
   */
  getNodeAttachmentCount(
    attachments: readonly BlueprintAttachment[],
    nodeId: string
  ): number {
    return attachments.filter((a) => a.nodeId === nodeId).length;
  },
};
