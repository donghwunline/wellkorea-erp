/**
 * Allowed file types for blueprint attachments.
 * Must match backend AllowedFileType enum.
 */
export type AllowedFileType = 'PDF' | 'DXF' | 'DWG' | 'JPG' | 'PNG';

/**
 * File type metadata including MIME type and display label.
 */
export interface FileTypeInfo {
  readonly type: AllowedFileType;
  readonly mimeType: string;
  readonly label: string;
  readonly extension: string;
}

/**
 * File type metadata lookup.
 */
const FILE_TYPE_INFO: Record<AllowedFileType, FileTypeInfo> = {
  PDF: { type: 'PDF', mimeType: 'application/pdf', label: 'PDF Document', extension: '.pdf' },
  DXF: { type: 'DXF', mimeType: 'application/dxf', label: 'AutoCAD DXF', extension: '.dxf' },
  DWG: { type: 'DWG', mimeType: 'application/acad', label: 'AutoCAD DWG', extension: '.dwg' },
  JPG: { type: 'JPG', mimeType: 'image/jpeg', label: 'JPEG Image', extension: '.jpg' },
  PNG: { type: 'PNG', mimeType: 'image/png', label: 'PNG Image', extension: '.png' },
};

/**
 * All allowed file extensions (lowercase).
 */
const ALLOWED_EXTENSIONS = ['.pdf', '.dxf', '.dwg', '.jpg', '.jpeg', '.png'];

/**
 * Maximum file size in bytes (50MB).
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Business rules for allowed file types.
 */
export const fileTypeRules = {
  /**
   * Get file type info by type.
   */
  getInfo(type: AllowedFileType): FileTypeInfo {
    return FILE_TYPE_INFO[type];
  },

  /**
   * Get MIME type for a file type.
   */
  getMimeType(type: AllowedFileType): string {
    return FILE_TYPE_INFO[type].mimeType;
  },

  /**
   * Get display label for a file type.
   */
  getLabel(type: AllowedFileType): string {
    return FILE_TYPE_INFO[type].label;
  },

  /**
   * Check if a file extension is allowed.
   */
  isAllowedExtension(fileName: string): boolean {
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return ALLOWED_EXTENSIONS.includes(ext);
  },

  /**
   * Get allowed extensions as a comma-separated string.
   */
  getAllowedExtensionsString(): string {
    return ALLOWED_EXTENSIONS.join(', ');
  },

  /**
   * Get accept attribute value for file input.
   */
  getAcceptAttribute(): string {
    return ALLOWED_EXTENSIONS.join(',');
  },

  /**
   * Check if file size is valid.
   */
  isValidSize(size: number): boolean {
    return size > 0 && size <= MAX_FILE_SIZE;
  },

  /**
   * Format file size for display.
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  },

  /**
   * Get maximum file size formatted for display.
   */
  getMaxFileSizeFormatted(): string {
    return fileTypeRules.formatFileSize(MAX_FILE_SIZE);
  },
};
