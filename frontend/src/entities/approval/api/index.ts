/**
 * Approval API Layer - Public API.
 *
 * Exports DTOs, mappers, and API functions.
 */

// DTOs (for low-level API calls only)
export type {
  CommandResult,
  ApprovalDetailsDTO,
  LevelDecisionDTO,
  ApprovalHistoryDTO,
  ApprovalListParamsDTO,
  ApproveRequestDTO,
  RejectRequestDTO,
} from './approval.dto';

// Mappers
export {
  approvalMapper,
  approvalLevelMapper,
  approvalHistoryMapper,
} from './approval.mapper';

// API functions
export { approvalApi } from './approval.api';
