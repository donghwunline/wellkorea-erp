/**
 * Approval Entity - Public API.
 *
 * Complete FSD entity module for approvals.
 *
 * Exports:
 * - Domain models and business rules
 * - Query hooks and keys
 * - UI components
 *
 * Note: Mutations (approve, reject) are in features/approval/
 */

// Model layer (domain types + business rules)
export type {
  ApprovalStatus,
  EntityType,
  ApprovalLevel,
  Approval,
  ApprovalHistory,
} from './model';

export {
  ApprovalStatus as ApprovalStatusEnum,
  ApprovalStatusConfig,
  EntityType as EntityTypeEnum,
  EntityTypeConfigs,
  approvalLevelRules,
  approvalRules,
  approvalHistoryRules,
} from './model';

// API layer (for advanced use cases)
export { approvalApi, approvalMapper, approvalLevelMapper, approvalHistoryMapper } from './api';
export type {
  ApprovalDetailsDTO,
  LevelDecisionDTO,
  ApprovalHistoryDTO,
  ApprovalListParamsDTO,
  ApproveRequestDTO,
  RejectRequestDTO,
  CommandResult,
} from './api';

// Query layer
export {
  approvalQueryKeys,
  approvalQueryFns,
  useApproval,
  useApprovals,
  useApprovalHistory,
} from './query';
export type {
  ApprovalListParams,
  PaginatedApprovals,
  UseApprovalOptions,
  UseApprovalsParams,
  UseApprovalsOptions,
  UseApprovalHistoryOptions,
} from './query';

// UI layer
export { ApprovalStatusBadge, ApprovalProgressBar, ApprovalLevelList, ApprovalRequestCard } from './ui';
export type {
  ApprovalStatusBadgeProps,
  ApprovalProgressBarProps,
  ApprovalLevelListProps,
  ApprovalRequestCardProps,
} from './ui';
