/**
 * Dark-themed variant of AttachmentPanel for modal contexts.
 * Uses steel color palette for consistency with dark modals.
 */

import { AttachmentPanel } from './AttachmentPanel';

export interface AttachmentPanelDarkProps {
  flowId: number;
  nodeId: string;
  canUpload?: boolean;
  canDelete?: boolean;
  onUploadSuccess?: () => void;
  onDeleteSuccess?: () => void;
  onError?: (message: string) => void;
}

export function AttachmentPanelDark(props: Readonly<AttachmentPanelDarkProps>) {
  return (
    <div
      className="
        [&_h3]:text-steel-300
        [&_.bg-gray-50]:bg-steel-800/30
        [&_.text-gray-900]:text-white
        [&_.text-gray-500]:text-steel-400
        [&_.text-gray-600]:text-steel-300
        [&_.border-gray-200]:border-steel-700/50
        [&_.border-gray-300]:border-steel-600
        [&_.bg-white]:bg-steel-800/50
        [&_.text-gray-400]:text-steel-400
        [&_.rounded-lg]:rounded-lg
      "
    >
      <AttachmentPanel {...props} />
    </div>
  );
}
