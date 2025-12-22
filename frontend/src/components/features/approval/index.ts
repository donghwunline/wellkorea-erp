/**
 * Approval feature components barrel export.
 */

// Feature components
export { ApprovalRejectModal, type ApprovalRejectModalProps } from './ApprovalRejectModal';
export { ApprovalRequestCard, type ApprovalRequestCardProps } from './ApprovalRequestCard';

// Utils
export { APPROVAL_STATUS_LABELS, APPROVAL_STATUS_BADGE_VARIANTS } from './approvalUtils';

// Hooks
export {
  useApprovalActions,
  type UseApprovalActionsReturn,
  useApprovalChainConfig,
  type UseApprovalChainConfigReturn,
  useApprovalList,
  type UseApprovalListParams,
  type UseApprovalListReturn,
} from './hooks';
