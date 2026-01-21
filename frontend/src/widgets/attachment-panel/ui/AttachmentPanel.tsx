/**
 * Attachment panel widget for task node detail view.
 * Combines attachment listing with upload, download, and delete features.
 *
 * Supports two color variants:
 * - 'light': Default light theme (gray/white)
 * - 'dark': Dark theme for modal contexts (steel colors)
 */

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { BlueprintAttachment } from '@/entities/blueprint-attachment';
import { blueprintQueries } from '@/entities/blueprint-attachment';
import { AttachmentUploader } from '@/features/blueprint/upload';
import { DownloadButton } from '@/features/blueprint/download';
import { DeleteAttachmentButton } from '@/features/blueprint/delete';

export interface AttachmentPanelProps {
  flowId: number;
  nodeId: string;
  /** Color variant - 'light' for pages, 'dark' for modals */
  variant?: 'light' | 'dark';
  canUpload?: boolean;
  canDelete?: boolean;
  onUploadSuccess?: () => void;
  onDeleteSuccess?: () => void;
  onError?: (message: string) => void;
}

// Variant-specific styles
const variantStyles = {
  light: {
    container: '',
    header: 'text-gray-900',
    text: 'text-gray-500',
    textMuted: 'text-gray-400',
    item: 'bg-white border-gray-200 hover:bg-gray-50',
    itemText: 'text-gray-900',
    itemMeta: 'text-gray-500',
    empty: 'text-gray-500 bg-gray-50',
  },
  dark: {
    container: '',
    header: 'text-steel-300',
    text: 'text-steel-400',
    textMuted: 'text-steel-400',
    item: 'bg-steel-800/50 border-steel-700/50 hover:bg-steel-800/70',
    itemText: 'text-white',
    itemMeta: 'text-steel-400',
    empty: 'text-steel-400 bg-steel-800/30',
  },
} as const;

export function AttachmentPanel({
  flowId,
  nodeId,
  variant = 'light',
  canUpload = true,
  canDelete = true,
  onUploadSuccess,
  onDeleteSuccess,
  onError,
}: Readonly<AttachmentPanelProps>) {
  const { t } = useTranslation('widgets');
  const styles = variantStyles[variant];
  const {
    data: attachments = [],
    isLoading,
    error,
  } = useQuery(blueprintQueries.byNode(flowId, nodeId));

  if (isLoading) {
    return (
      <div className={`p-4 text-center ${styles.text}`}>
        <svg className="mx-auto h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="mt-2 text-sm">{t('attachmentPanel.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p className="text-sm">{t('attachmentPanel.loadError')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-medium ${styles.header}`}>{t('attachmentPanel.title', { count: attachments.length })}</h3>
      </div>

      {/* Upload area */}
      {canUpload && (
        <AttachmentUploader
          flowId={flowId}
          nodeId={nodeId}
          onSuccess={onUploadSuccess}
          onError={onError}
        />
      )}

      {/* Attachment list */}
      {attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map(attachment => (
            <AttachmentItem
              key={attachment.id}
              attachment={attachment}
              variant={variant}
              canDelete={canDelete}
              onDeleteSuccess={onDeleteSuccess}
              onError={onError}
            />
          ))}
        </div>
      ) : (
        <div className={`rounded-lg p-4 text-center ${styles.empty}`}>
          <svg
            className={`mx-auto h-8 w-8 ${styles.textMuted}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mt-2 text-sm">{t('attachmentPanel.empty')}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Single attachment item with action buttons.
 */
interface AttachmentItemProps {
  attachment: BlueprintAttachment;
  variant: 'light' | 'dark';
  canDelete: boolean;
  onDeleteSuccess?: () => void;
  onError?: (message: string) => void;
}

function AttachmentItem({
  attachment,
  variant,
  canDelete,
  onDeleteSuccess,
  onError,
}: Readonly<AttachmentItemProps>) {
  const styles = variantStyles[variant];

  return (
    <div className={`flex items-center justify-between rounded-lg border p-3 ${styles.item}`}>
      <div className="flex min-w-0 items-center gap-3">
        <FileTypeIcon fileType={attachment.fileType} />
        <div className="min-w-0">
          <p className={`truncate text-sm font-medium ${styles.itemText}`}>{attachment.fileName}</p>
          <p className={`text-xs ${styles.itemMeta}`}>{attachment.formattedFileSize}</p>
        </div>
      </div>

      <div className="ml-4 flex items-center gap-1">
        <DownloadButton attachment={attachment} onError={onError} />
        {canDelete && (
          <DeleteAttachmentButton
            attachment={attachment}
            onSuccess={onDeleteSuccess}
            onError={onError}
          />
        )}
      </div>
    </div>
  );
}

/**
 * File type icon component.
 */
function FileTypeIcon({ fileType }: Readonly<{ fileType: string }>) {
  const getColor = () => {
    switch (fileType) {
      case 'PDF':
        return 'text-red-500';
      case 'DXF':
      case 'DWG':
        return 'text-blue-500';
      case 'JPG':
      case 'PNG':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={`flex-shrink-0 ${getColor()}`}>
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" />
      </svg>
    </div>
  );
}
