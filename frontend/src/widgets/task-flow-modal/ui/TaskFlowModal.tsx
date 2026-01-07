/**
 * Fullscreen modal for viewing and editing a project's task flow.
 * Contains the TaskFlowCanvas widget with loading and error states.
 */

import { Modal, LoadingState, ErrorAlert } from '@/shared/ui';
import { TaskFlowCanvas } from '@/widgets/task-flow-canvas';
import { useTaskFlowModal } from '../model/use-task-flow-modal';

export interface TaskFlowModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Project ID to load task flow for */
  projectId: number;
  /** Project name for modal title */
  projectName?: string;
  /** Called when modal should close */
  onClose: () => void;
}

/**
 * Fullscreen modal containing the task flow canvas.
 */
export function TaskFlowModal({
  isOpen,
  projectId,
  projectName,
  onClose,
}: TaskFlowModalProps) {
  const { flow, isLoading, error, isSaving, save } = useTaskFlowModal({
    projectId,
    isOpen,
  });

  const title = projectName ? `Task Flow: ${projectName}` : 'Task Flow';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="fullscreen"
      closeOnBackdrop={false}
    >
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <LoadingState message="Loading task flow..." />
        </div>
      ) : error ? (
        <div className="flex h-full items-center justify-center p-8">
          <ErrorAlert
            title="Failed to load task flow"
            message={error.message}
          />
        </div>
      ) : flow ? (
        <TaskFlowCanvas
          flow={flow}
          isSaving={isSaving}
          onSave={save}
        />
      ) : null}
    </Modal>
  );
}
