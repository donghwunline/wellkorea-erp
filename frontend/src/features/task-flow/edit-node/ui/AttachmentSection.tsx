/**
 * Attachment section for task node modal.
 * Shows "save first" message for new nodes, or attachment panel for saved nodes.
 */

import { useQueryClient } from '@tanstack/react-query';
import { AttachmentPanelDark } from '@/widgets/attachment-panel';
import { blueprintQueries } from '@/entities/blueprint-attachment';

interface AttachmentSectionProps {
  flowId: number;
  nodeId: string | null; // null for unsaved nodes
}

export function AttachmentSection({ flowId, nodeId }: AttachmentSectionProps) {
  const queryClient = useQueryClient();

  // For unsaved nodes, show placeholder
  if (!nodeId) {
    return (
      <div className="rounded-lg border border-steel-700/50 bg-steel-800/30 p-4">
        <div className="flex items-center gap-2 text-steel-400">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm">Save task first to attach blueprints</span>
        </div>
      </div>
    );
  }

  // Invalidate queries on upload/delete to update attachment counts everywhere
  const handleSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: blueprintQueries.lists(),
    });
  };

  return (
    <AttachmentPanelDark
      flowId={flowId}
      nodeId={nodeId}
      canUpload={true}
      canDelete={true}
      onUploadSuccess={handleSuccess}
      onDeleteSuccess={handleSuccess}
    />
  );
}
