/**
 * Services barrel export.
 * Exports all domain services and utilities.
 *
 * Usage:
 * ```typescript
 * import { authService, userService, auditService } from '@/services';
 *
 * // Login
 * const response = await authService.login({ username, password });
 *
 * // Get users
 * const { data: users, pagination } = await userService.getUsers({ page: 0, size: 10 });
 *
 * // Get audit logs
 * const { data: logs, pagination } = await auditService.getAuditLogs({ username: 'admin' });
 * ```
 */

// Auth service
export { authService, authEvents } from './auth/authService';
export type { AuthEvent } from './auth/authService';
export type { LoginRequest, LoginResponse, User, RoleName } from './auth/types';

// User service
export { userService } from './users/userService';
export type {
  UserDetails,
  UserListParams,
  PaginatedUsers,
  CreateUserRequest,
  UpdateUserRequest,
  AssignRolesRequest,
  ChangePasswordRequest,
} from './users/types';

// Audit service
export { auditService } from './audit/auditService';
export type { AuditLogEntry, AuditLogListParams, PaginatedAuditLogs } from './audit/types';

// Customer service
export { customerService } from './customers';
export type { CustomerDetails, CustomerListParams, PaginatedCustomers } from './customers';

// Project service
export { projectService, projectSummaryService, PROJECT_STATUS_LABELS } from './projects';
export type {
  ProjectDetails,
  ProjectListParams,
  PaginatedProjects,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectStatus,
  // Project summary types
  ProjectSection,
  ProjectSectionSummary,
  ProjectSummary,
} from './projects';

// Quotation services
export {
  quotationService,
  approvalService,
  approvalChainService,
  productService,
  QUOTATION_STATUS_LABELS,
  QUOTATION_STATUS_COLORS,
  APPROVAL_STATUS_LABELS,
} from './quotations';
export type {
  // CQRS types
  CommandResult,
  // Quotation types
  QuotationStatus,
  QuotationLineItem,
  QuotationDetails,
  LineItemRequest,
  CreateQuotationRequest,
  UpdateQuotationRequest,
  QuotationListParams,
  PaginatedQuotations,
  // Approval types
  ApprovalStatus,
  EntityType,
  LevelDecision,
  ApprovalDetails,
  ApprovalHistoryEntry,
  ApproveRequest,
  RejectRequest,
  ApprovalListParams,
  PaginatedApprovals,
  // Approval chain types
  ChainLevel,
  ChainTemplate,
  ChainLevelRequest,
  UpdateChainLevelsRequest,
  // Product types
  ProductSearchResult,
  ProductSearchParams,
  PaginatedProducts,
} from './quotations';

// Error utilities (re-exported from @/shared/utils for convenience)
export {
  errorMessages,
  getErrorMessage,
  getErrorDisplayStrategy,
  isValidationError,
  isAuthenticationError,
  isAuthorizationError,
  isAuthError,
  isBusinessError,
  isServerError,
  isNotFoundError,
} from '@/shared/utils';

// Re-export common types from API layer for convenience
export type { PaginationMetadata, Paginated, ApiError, ErrorResponse } from '@/api/types';

// Re-export auth constants for component use
export { ALL_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/shared/types/auth';
