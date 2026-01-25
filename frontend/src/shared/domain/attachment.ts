/**
 * Attachment types and business rules.
 * Shared across entities that can have file attachments.
 */

/**
 * Types of entities that can own attachments.
 */
export type AttachmentOwnerType = 'DELIVERY' | 'QUOTATION' | 'INVOICE' | 'PROJECT';

/**
 * Allowed file types for attachments.
 */
export type AttachmentFileType = 'JPG' | 'PNG' | 'PDF';

/**
 * File attachment metadata.
 */
export interface Attachment {
  readonly id: number;
  readonly ownerType: AttachmentOwnerType;
  readonly ownerId: number;
  readonly fileName: string;
  readonly fileType: AttachmentFileType;
  readonly fileSize: number;
  readonly formattedFileSize: string;
  readonly uploadedByName: string;
  readonly uploadedAt: string;
  readonly downloadUrl: string;
}

/**
 * Maximum file size in bytes (10MB).
 */
export const ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024;

/**
 * Business rules for attachments.
 */
export const attachmentRules = {
  /**
   * Check if file is an allowed image type (JPG or PNG only).
   */
  isAllowedImage(fileName: string): boolean {
    const ext = fileName.toLowerCase().split('.').pop();
    return ext === 'jpg' || ext === 'jpeg' || ext === 'png';
  },

  /**
   * Check if file is an allowed type (JPG, PNG, or PDF).
   */
  isAllowed(fileName: string): boolean {
    const ext = fileName.toLowerCase().split('.').pop();
    return ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'pdf';
  },

  /**
   * Get accept attribute for image-only file input.
   */
  getImageAcceptAttribute(): string {
    return '.jpg,.jpeg,.png';
  },

  /**
   * Get accept attribute for all allowed file types.
   */
  getAllAcceptAttribute(): string {
    return '.jpg,.jpeg,.png,.pdf';
  },

  /**
   * Check if file size is valid (between 1 byte and 10MB).
   */
  isValidSize(size: number): boolean {
    return size > 0 && size <= ATTACHMENT_MAX_SIZE;
  },

  /**
   * Format file size for display.
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },

  /**
   * Get content type from file name.
   */
  getContentType(fileName: string): string {
    const ext = fileName.toLowerCase().split('.').pop();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  },
};
