/**
 * Hook for downloading blueprint attachments.
 * Uses presigned URL for direct download.
 */

import { useQuery } from '@tanstack/react-query';
import { blueprintQueries } from '@/entities/blueprint-attachment';
import type { BlueprintAttachment } from '@/entities/blueprint-attachment';

interface UseDownloadAttachmentOptions {
  enabled?: boolean;
  expiryMinutes?: number;
}

/**
 * Hook to get download URL for an attachment.
 * Returns the presigned URL when enabled.
 */
export function useDownloadUrl(
  attachmentId: number,
  options: UseDownloadAttachmentOptions = {}
) {
  const { enabled = true, expiryMinutes = 15 } = options;

  return useQuery({
    ...blueprintQueries.downloadUrl(attachmentId, expiryMinutes),
    enabled: enabled && attachmentId > 0,
  });
}

/**
 * Opens a new tab/window to download the attachment using presigned URL.
 */
export async function downloadAttachment(
  attachment: BlueprintAttachment,
  getDownloadUrl: () => Promise<string>
): Promise<void> {
  try {
    const url = await getDownloadUrl();
    window.open(url, '_blank');
  } catch {
    throw new Error(`Failed to download ${attachment.fileName}`);
  }
}

/**
 * Trigger browser download with specific filename.
 * Uses anchor element click to initiate download.
 */
export function triggerDownload(url: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
