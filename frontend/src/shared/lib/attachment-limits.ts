/**
 * Centralized attachment limit constants.
 *
 * Keep in sync with backend: AttachmentLimits.java
 * (com.wellkorea.backend.shared.constant.AttachmentLimits)
 */

export const ATTACHMENT_LIMITS = {
  /** Maximum individual file size (50MB) */
  MAX_FILE_SIZE: 50 * 1024 * 1024,

  /** Maximum total attachment size per entity (20MB) */
  MAX_TOTAL_SIZE: 20 * 1024 * 1024,

  /** Maximum number of attachments per entity */
  MAX_ATTACHMENT_COUNT: 20,
} as const;

/**
 * Format bytes to human-readable size (e.g., "2.5 MB").
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}
