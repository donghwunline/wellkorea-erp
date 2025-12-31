/**
 * Services barrel export.
 * Exports all domain services and utilities.
 *
 * NOTE: User and Auth services have been migrated to FSD entities.
 * - New code should import from @/entities/user and @/entities/auth
 * - Legacy method names are provided here for backwards compatibility
 *
 * Usage:
 * ```typescript
 * import { userService, auditService } from '@/services';
 *
 * // Get users (uses legacy method names for compatibility)
 * const { data: users, pagination } = await userService.getUsers({ page: 0, size: 10 });
 *
 * // Get audit logs
 * const { data: logs, pagination } = await auditService.getAuditLogs({ username: 'admin' });
 * ```
 */

import {
  authApi,
  authEvents as entityAuthEvents,
  type AuthEvent as EntityAuthEvent,
} from '@/entities/auth';
import {
  userApi,
  type UserDetails as EntityUserDetails,
  type User as EntityUser,
  type RoleName as EntityRoleName,
  type CreateUserRequestDTO,
  type UpdateUserRequestDTO,
  type AssignRolesRequestDTO,
  type ChangePasswordRequestDTO,
  type UserListParamsDTO,
  type PaginatedUsersDTO,
} from '@/entities/user';

// ============================================================================
// AUTH SERVICE - Compatibility layer
// ============================================================================

export const authEvents = entityAuthEvents;
export type AuthEvent = EntityAuthEvent;

/**
 * Legacy auth service interface.
 * Maps to the new authApi with old method signatures.
 */
export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const result = await authApi.login(credentials);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken ?? undefined,
      user: result.user,
    };
  },
  async logout(): Promise<void> {
    return authApi.logout();
  },
  async getCurrentUser() {
    return authApi.getCurrentUser();
  },
};

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: EntityUser;
}

// ============================================================================
// USER SERVICE - Compatibility layer
// ============================================================================

// Re-export types with legacy names
export type User = EntityUser;
export type RoleName = EntityRoleName;
export type UserDetails = EntityUserDetails;
export type CreateUserRequest = CreateUserRequestDTO;
export type UpdateUserRequest = UpdateUserRequestDTO;
export type AssignRolesRequest = AssignRolesRequestDTO;
export type ChangePasswordRequest = ChangePasswordRequestDTO;
export type UserListParams = UserListParamsDTO;
export type PaginatedUsers = PaginatedUsersDTO;

/**
 * Legacy user service interface.
 * Maps to the new userApi with old method signatures.
 */
export const userService = {
  /** Get paginated list of users */
  async getUsers(params?: UserListParams): Promise<PaginatedUsers> {
    return userApi.getList(params ?? {});
  },

  /** Get user by ID */
  async getUser(id: number): Promise<UserDetails> {
    return userApi.getById(id);
  },

  /** Create a new user */
  async createUser(request: CreateUserRequest): Promise<UserDetails> {
    return userApi.create(request);
  },

  /** Update an existing user */
  async updateUser(id: number, request: UpdateUserRequest): Promise<UserDetails> {
    return userApi.update(id, request);
  },

  /** Assign roles to a user */
  async assignRoles(id: number, request: AssignRolesRequest): Promise<void> {
    return userApi.assignRoles(id, request);
  },

  /** Change user password */
  async changePassword(id: number, request: ChangePasswordRequest): Promise<void> {
    return userApi.changePassword(id, request);
  },

  /** Activate a deactivated user */
  async activateUser(id: number): Promise<void> {
    return userApi.activate(id);
  },

  /** Deactivate (delete) a user */
  async deleteUser(id: number): Promise<void> {
    return userApi.deactivate(id);
  },

  /** Get customer assignments for a user */
  async getUserCustomers(id: number): Promise<number[]> {
    return userApi.getCustomers(id);
  },

  /** Assign customers to a user */
  async assignCustomers(id: number, customerIds: number[]): Promise<void> {
    return userApi.assignCustomers(id, { customerIds });
  },
};

// Audit service
export { auditService } from './audit/auditService';
export type { AuditLogEntry, AuditLogListParams, PaginatedAuditLogs } from './audit/types';

// Company service (unified Customer + Vendor + Outsource)
export { companyService, ROLE_TYPE_LABELS } from './companies';
export type {
  RoleType,
  CompanyRole,
  AddRoleRequest,
  CompanySummary,
  CompanyDetails,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  CompanyCommandResult,
  CompanyListParams,
  PaginatedCompanies,
} from './companies';

// Project service
export { projectService, projectSummaryService, PROJECT_STATUS_LABELS } from './projects';
export type {
  ProjectDetails,
  ProjectListItem,
  ProjectListParams,
  PaginatedProjects,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectCommandResult,
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
} from './quotations';

// Product service (Items → Products tab)
export { productService } from './products';
export type {
  ProductType,
  ProductSummary,
  ProductDetails,
  CreateProductRequest,
  UpdateProductRequest,
  ProductCommandResult,
  ProductListParams,
  PaginatedProducts,
} from './products';

// Catalog service (Items → Purchased Items tab)
export { serviceCategoryService } from './catalog';
export type {
  ServiceCategorySummary,
  ServiceCategoryDetails,
  CreateServiceCategoryRequest,
  UpdateServiceCategoryRequest,
  ServiceCategoryCommandResult,
  ServiceCategoryListParams,
  PaginatedServiceCategories,
  VendorServiceOffering,
  CreateVendorOfferingRequest,
  UpdateVendorOfferingRequest,
  VendorOfferingCommandResult,
  VendorOfferingListParams,
  PaginatedVendorOfferings,
} from './catalog';

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
export type { PaginationMetadata, Paginated, ApiError, ErrorResponse } from '@/shared/api/types';

// Re-export auth constants for component use
export { ALL_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/entities/user';
