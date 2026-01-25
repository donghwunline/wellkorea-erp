/**
 * Photo uploader component - thin wrapper around FileUploader for image-only uploads.
 *
 * @deprecated Prefer using FileUploader from @/shared/ui directly for new code.
 * This component is kept for backwards compatibility with existing delivery photo upload.
 */

import { FileUploader, type FileUploaderProps } from '@/shared/ui';

/**
 * Props for PhotoUploader (subset of FileUploaderProps without accept).
 */
export type PhotoUploaderProps = Omit<FileUploaderProps, 'accept'>;

/**
 * Photo uploader for image-only uploads (JPG, PNG).
 * Uses FileUploader with accept="images".
 */
export function PhotoUploader(props: PhotoUploaderProps) {
  return <FileUploader {...props} accept="images" />;
}

PhotoUploader.displayName = 'PhotoUploader';
