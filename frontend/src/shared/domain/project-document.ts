/**
 * Unified project document types.
 *
 * Represents documents aggregated from multiple sources:
 * - Blueprint attachments (from TaskFlow nodes)
 * - Delivery photos (from DELIVERED deliveries)
 * - Invoice documents (future)
 */

/**
 * Document type discriminator.
 */
export type ProjectDocumentType = 'BLUEPRINT' | 'DELIVERY_PHOTO' | 'INVOICE';

/**
 * Unified project document entity.
 * Returned by the /api/documents endpoint.
 */
export interface ProjectDocument {
  readonly id: number;
  readonly documentType: ProjectDocumentType;
  readonly fileName: string;
  readonly fileType: string; // JPG, PNG, PDF, DXF, DWG
  readonly fileSize: number;
  readonly uploadedByName: string;
  readonly uploadedAt: string; // ISO datetime string
  readonly downloadUrl: string;
  readonly sourceId: number; // deliveryId, taskFlowId, or invoiceId
  readonly sourceLabel: string; // "Delivery 2024-01-15", "Node: Design", etc.
}

/**
 * Business rules for project documents.
 */
export const projectDocumentRules = {
  /**
   * Format file size in bytes to human-readable string.
   * @param bytes - File size in bytes
   * @returns Formatted string (e.g., "1.5 MB", "256 KB", "512 B")
   */
  formatFileSize(bytes: number): string {
    if (bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },

  /**
   * Check if document is an image.
   */
  isImage(doc: ProjectDocument): boolean {
    return doc.fileType === 'JPG' || doc.fileType === 'PNG';
  },

  /**
   * Check if document is a PDF.
   */
  isPdf(doc: ProjectDocument): boolean {
    return doc.fileType === 'PDF';
  },

  /**
   * Check if document is a CAD file.
   */
  isCadFile(doc: ProjectDocument): boolean {
    return doc.fileType === 'DXF' || doc.fileType === 'DWG';
  },

  /**
   * Check if document is a blueprint attachment.
   */
  isBlueprint(doc: ProjectDocument): boolean {
    return doc.documentType === 'BLUEPRINT';
  },

  /**
   * Check if document is a delivery photo.
   */
  isDeliveryPhoto(doc: ProjectDocument): boolean {
    return doc.documentType === 'DELIVERY_PHOTO';
  },

  /**
   * Check if document is an invoice document.
   */
  isInvoiceDocument(doc: ProjectDocument): boolean {
    return doc.documentType === 'INVOICE';
  },

  /**
   * Group documents by type.
   */
  groupByType(
    documents: readonly ProjectDocument[]
  ): Record<ProjectDocumentType, ProjectDocument[]> {
    const grouped: Record<ProjectDocumentType, ProjectDocument[]> = {
      BLUEPRINT: [],
      DELIVERY_PHOTO: [],
      INVOICE: [],
    };

    for (const doc of documents) {
      grouped[doc.documentType].push(doc);
    }

    return grouped;
  },
};
