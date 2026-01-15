/**
 * List item component displaying a single blueprint attachment.
 * Read-only display - actions are delegated via callback props.
 */

import type { BlueprintAttachment } from '../model/blueprint-attachment';
import { blueprintRules } from '../model/blueprint-attachment';
import { FileTypeBadge } from './FileTypeBadge';

interface AttachmentListItemProps {
  attachment: BlueprintAttachment;
  onDownload?: (attachment: BlueprintAttachment) => void;
  onDelete?: (attachment: BlueprintAttachment) => void;
  showActions?: boolean;
  className?: string;
}

export function AttachmentListItem({
  attachment,
  onDownload,
  onDelete,
  showActions = true,
  className = '',
}: AttachmentListItemProps) {
  return (
    <div
      className={`flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <FileTypeBadge fileType={attachment.fileType} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {attachment.fileName}
          </p>
          <p className="text-xs text-gray-500">
            {attachment.formattedFileSize} &bull;{' '}
            {blueprintRules.formatUploadDate(attachment)}
          </p>
        </div>
      </div>

      {showActions && (onDownload || onDelete) && (
        <div className="flex items-center gap-2 ml-4">
          {onDownload && (
            <button
              type="button"
              onClick={() => onDownload(attachment)}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Download"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(attachment)}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
              title="Delete"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
