/**
 * Approval Model Layer - Public API.
 *
 * Exports domain types and business rules for the approval domain.
 */

// Approval status
export {
  ApprovalStatus,
  ApprovalStatusConfig,
  getStatusLabel,
  getStatusColor,
} from './approval-status';
export type { StatusConfig, BadgeColor } from './approval-status';

// Entity type
export {
  EntityType,
  EntityTypeConfigs,
  getEntityTypeLabel,
} from './entity-type';
export type { EntityTypeConfig } from './entity-type';

// Approval level
export type { ApprovalLevel } from './approval-level';
export { approvalLevelRules } from './approval-level';

// Approval
export type { Approval, ApprovalListItem } from './approval';
export { approvalRules } from './approval';

// Approval history
export {
  ApprovalHistoryAction,
  approvalHistoryRules,
} from './approval-history';
export type { ApprovalHistory } from './approval-history';
