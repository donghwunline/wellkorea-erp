/**
 * Approval API DTOs.
 *
 * Data transfer objects matching the backend API contract.
 * These types are internal to the API layer - use domain models externally.
 */

/**
 * Command result from CQRS command endpoints.
 * Commands return only ID - fetch fresh data via query endpoints.
 */
export interface CommandResult {
  id: number;
  message: string;
}

/**
 * Level decision DTO from API response.
 */
export interface LevelDecisionDTO {
  levelOrder: number;
  levelName: string;
  expectedApproverUserId: number;
  expectedApproverName: string;
  decision: string; // Will be cast to ApprovalStatus
  decidedByUserId: number | null;
  decidedByName: string | null;
  decidedAt: string | null;
  comments: string | null;
}

/**
 * Approval details DTO from API response.
 */
export interface ApprovalDetailsDTO {
  id: number;
  entityType: string; // Will be cast to EntityType
  entityId: number;
  entityDescription: string | null;
  currentLevel: number;
  totalLevels: number;
  status: string; // Will be cast to ApprovalStatus
  submittedById: number;
  submittedByName: string;
  submittedAt: string;
  completedAt: string | null;
  createdAt: string;
  levels: LevelDecisionDTO[] | null;
}

/**
 * Approval history entry DTO from API response.
 */
export interface ApprovalHistoryDTO {
  id: number;
  levelOrder: number | null;
  levelName: string | null;
  action: string; // Will be cast to ApprovalHistoryAction
  actorId: number;
  actorName: string;
  comments: string | null;
  createdAt: string;
}

/**
 * Request DTO for approving.
 */
export interface ApproveRequestDTO {
  comments?: string;
}

/**
 * Request DTO for rejecting.
 */
export interface RejectRequestDTO {
  reason: string;
  comments?: string;
}

/**
 * Query parameters for listing approvals.
 */
export interface ApprovalListParamsDTO {
  page?: number;
  size?: number;
  entityType?: string;
  status?: string;
  myPending?: boolean;
}

