/**
 * Task Flow Modal Widget - Public API.
 *
 * Fullscreen modal for viewing and editing project task flows.
 * Composes TaskFlowCanvas widget with loading and error states.
 */

export { TaskFlowModal, type TaskFlowModalProps } from './ui/TaskFlowModal';
export {
  useTaskFlowModal,
  type UseTaskFlowModalOptions,
  type UseTaskFlowModalReturn,
} from './model/use-task-flow-modal';
