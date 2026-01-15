/**
 * Attachment panel widget for task node detail view.
 * Combines attachment listing with upload, download, and delete features.
 */

import { useQuery } from '@tanstack/react-query';
import { blueprintQueries } from '@/entities/blueprint-attachment';
import type { BlueprintAttachment } from '@/entities/blueprint-attachment';
import { AttachmentUploader } from '@/features/blueprint/upload';
import { DownloadButton } from '@/features/blueprint/download';
import { DeleteAttachmentButton } from '@/features/blueprint/delete';

interface AttachmentPanelProps {
  flowId: number;
  nodeId: string;
  canUpload?: boolean;
  canDelete?: boolean;
  onUploadSuccess?: () => void;
  onDeleteSuccess?: () => void;
  onError?: (message: string) => void;
}

export function AttachmentPanel({
  flowId,
  nodeId,
  canUpload = true,
  canDelete = true,
  onUploadSuccess,
  onDeleteSuccess,
  onError,
}: AttachmentPanelProps) {
  const {
    data: attachments = [],
    isLoading,
    error,
  } = useQuery(blueprintQueries.byNode(flowId, nodeId));

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <svg
          className="w-6 h-6 mx-auto animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
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
        <p className="mt-2 text-sm">Loading attachments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p className="text-sm">Failed to load attachments</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">
          Blueprints ({attachments.length})
        </h3>
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
          {attachments.map((attachment) => (
            <AttachmentItem
              key={attachment.id}
              attachment={attachment}
              canDelete={canDelete}
              onDeleteSuccess={onDeleteSuccess}
              onError={onError}
            />
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
          <svg
            className="w-8 h-8 mx-auto text-gray-400"
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
          <p className="mt-2 text-sm">No blueprints attached</p>
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
  canDelete: boolean;
  onDeleteSuccess?: () => void;
  onError?: (message: string) => void;
}

function AttachmentItem({
  attachment,
  canDelete,
  onDeleteSuccess,
  onError,
}: AttachmentItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
      <div className="flex items-center gap-3 min-w-0">
        <FileTypeIcon fileType={attachment.fileType} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {attachment.fileName}
          </p>
          <p className="text-xs text-gray-500">
            {attachment.formattedFileSize}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 ml-4">
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
function FileTypeIcon({ fileType }: { fileType: string }) {
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
