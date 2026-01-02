/**
 * Shared test fixtures for authentication and authorization testing.
 *
 * This module provides pre-configured mock data and factory functions
 * to eliminate duplication across test files and ensure consistency.
 *
 * Usage:
 * ```typescript
 * import { mockUsers, createMockUser } from '@/test/fixtures';
 *
 * // Use pre-configured fixtures
 * const adminUser = mockUsers.admin;
 *
 * // Or create custom users
 * const customUser = createMockUser({ roles: ['ROLE_ADMIN', 'ROLE_FINANCE'] });
 * ```
 */

// Import user and auth types from entities (public API only)
import type { RoleName, User, UserDetails } from '@/entities/user';
import type { AuthStore } from '@/entities/auth';
import type { Quotation, LineItem } from '@/entities/quotation';
import { QuotationStatus } from '@/entities/quotation';
import type { Approval, ApprovalHistory, ApprovalLevel, ApprovalStatus } from '@/entities/approval';
import type { ChainLevel, ChainTemplate } from '@/entities/approval-chain';
import type { ProductListItem } from '@/entities/product';
import type { AuditLog } from '@/entities/audit';

/**
 * Authentication state for test fixtures.
 * Derived from AuthStore to stay in sync with the actual store.
 */
type AuthState = Pick<AuthStore, 'user' | 'accessToken' | 'isAuthenticated' | 'isLoading'>;

/**
 * Factory function to create a mock User with sensible defaults.
 * All fields can be overridden via the optional parameter.
 *
 * @param overrides - Partial User object to override defaults
 * @returns Complete User object with defaults + overrides
 *
 * @example
 * ```typescript
 * const customUser = createMockUser({
 *   username: 'john',
 *   roles: ['ROLE_ADMIN', 'ROLE_SALES']
 * });
 * ```
 */
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 1,
  username: 'testuser',
  email: 'testuser@example.com',
  fullName: 'Test User',
  roles: ['ROLE_SALES'],
  ...overrides,
});

/**
 * Pre-configured user fixtures for common test scenarios.
 * Each fixture represents a user with a specific role or combination of roles.
 *
 * Available fixtures:
 * - admin: User with ADMIN role
 * - finance: User with FINANCE role
 * - sales: User with SALES role
 * - production: User with PRODUCTION role
 * - multiRole: User with both ADMIN and FINANCE roles
 */
export const mockUsers = {
  /**
   * Admin user with full system access
   */
  admin: createMockUser({
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    fullName: 'Admin User',
    roles: ['ROLE_ADMIN'],
  }),

  /**
   * Finance user for financial operations
   */
  finance: createMockUser({
    id: 2,
    username: 'finance',
    email: 'finance@example.com',
    fullName: 'Finance User',
    roles: ['ROLE_FINANCE'],
  }),

  /**
   * Sales user for quotations and customer management
   */
  sales: createMockUser({
    id: 3,
    username: 'alice',
    email: 'alice@example.com',
    fullName: 'Alice Sales',
    roles: ['ROLE_SALES'],
  }),

  /**
   * Production user for manufacturing operations
   */
  production: createMockUser({
    id: 4,
    username: 'production',
    email: 'production@example.com',
    fullName: 'Production User',
    roles: ['ROLE_PRODUCTION'],
  }),

  /**
   * User with multiple roles for testing role combinations
   */
  multiRole: createMockUser({
    id: 5,
    username: 'charlie',
    email: 'charlie@example.com',
    fullName: 'Charlie Multi',
    roles: ['ROLE_ADMIN', 'ROLE_SALES'],
  }),
};

/**
 * Factory function to create a mock AuthState with sensible defaults.
 * All fields can be overridden via the optional parameter.
 *
 * @param overrides - Partial AuthState object to override defaults
 * @returns Complete AuthState object with defaults + overrides
 *
 * @example
 * ```typescript
 * const loadingState = createMockAuthState({
 *   isLoading: true
 * });
 * ```
 */
export const createMockAuthState = (overrides?: Partial<AuthState>): AuthState => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  ...overrides,
});

/**
 * Pre-configured auth state fixtures for common test scenarios.
 *
 * Available fixtures:
 * - unauthenticated: No user logged in
 * - authenticated: Admin user logged in with token
 * - authenticatedSales: Sales user logged in with token
 * - loading: Authentication in progress
 */
export const mockAuthStates = {
  /**
   * Unauthenticated state - no user logged in
   */
  unauthenticated: createMockAuthState({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
  }),

  /**
   * Authenticated state - admin user logged in
   */
  authenticated: createMockAuthState({
    user: mockUsers.admin,
    accessToken: 'mock-token-123',
    isAuthenticated: true,
    isLoading: false,
  }),

  /**
   * Authenticated state - sales user logged in
   */
  authenticatedSales: createMockAuthState({
    user: mockUsers.sales,
    accessToken: 'mock-token-456',
    isAuthenticated: true,
    isLoading: false,
  }),

  /**
   * Loading state - authentication in progress
   */
  loading: createMockAuthState({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
  }),
};

/**
 * Factory function to create a mock UserDetails with sensible defaults.
 * All fields can be overridden via the optional parameter.
 *
 * @param overrides - Partial UserDetails object to override defaults
 * @returns Complete UserDetails object with defaults + overrides
 *
 * @example
 * ```typescript
 * const activeUser = createMockUserDetails({ isActive: true });
 * const inactiveUser = createMockUserDetails({ isActive: false });
 * ```
 */
export const createMockUserDetails = (overrides?: Partial<UserDetails>): UserDetails => ({
  id: 1,
  username: 'testuser',
  email: 'testuser@example.com',
  fullName: 'Test User',
  isActive: true,
  roles: ['ROLE_SALES'],
  createdAt: '2025-01-01T00:00:00Z',
  lastLoginAt: '2025-01-15T10:30:00Z',
  ...overrides,
});

/**
 * Pre-configured UserDetails fixtures for common test scenarios.
 *
 * Available fixtures:
 * - adminUser: Active admin user
 * - financeUser: Active finance user
 * - salesUser: Active sales user
 * - productionUser: Active production user
 * - multiRoleUser: User with multiple roles
 * - inactiveUser: Deactivated user
 * - neverLoggedIn: User who has never logged in
 */
export const mockUserDetails = {
  /**
   * Admin user with full system access
   */
  adminUser: createMockUserDetails({
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    fullName: 'Admin User',
    roles: ['ROLE_ADMIN'],
  }),

  /**
   * Finance user for financial operations
   */
  financeUser: createMockUserDetails({
    id: 2,
    username: 'finance',
    email: 'finance@example.com',
    fullName: 'Finance User',
    roles: ['ROLE_FINANCE'],
  }),

  /**
   * Sales user for quotations and customer management
   */
  salesUser: createMockUserDetails({
    id: 3,
    username: 'alice',
    email: 'alice@example.com',
    fullName: 'Alice Sales',
    roles: ['ROLE_SALES'],
  }),

  /**
   * Production user for manufacturing operations
   */
  productionUser: createMockUserDetails({
    id: 4,
    username: 'production',
    email: 'production@example.com',
    fullName: 'Production User',
    roles: ['ROLE_PRODUCTION'],
  }),

  /**
   * User with multiple roles for testing role combinations
   */
  multiRoleUser: createMockUserDetails({
    id: 5,
    username: 'charlie',
    email: 'charlie@example.com',
    fullName: 'Charlie Multi',
    roles: ['ROLE_ADMIN', 'ROLE_SALES'],
  }),

  /**
   * Inactive/deactivated user
   */
  inactiveUser: createMockUserDetails({
    id: 6,
    username: 'inactive',
    email: 'inactive@example.com',
    fullName: 'Inactive User',
    isActive: false,
    roles: ['ROLE_SALES'],
  }),

  /**
   * User who has never logged in
   */
  neverLoggedIn: createMockUserDetails({
    id: 7,
    username: 'newuser',
    email: 'newuser@example.com',
    fullName: 'New User',
    lastLoginAt: null,
  }),
};

// ============================================================================
// API Response Fixtures
// ============================================================================

/**
 * Creates a mock API response wrapper.
 * Matches the ApiResponse<T> structure from the backend.
 *
 * @example
 * ```typescript
 * const response = createMockApiResponse({ id: 1, name: 'Test' });
 * // { success: true, message: 'Success', data: {...}, timestamp: '...' }
 * ```
 */
export function createMockApiResponse<T>(
  data: T,
  metadata?: Record<string, unknown>
): {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  metadata?: Record<string, unknown>;
} {
  return {
    success: true,
    message: 'Success',
    data,
    timestamp: '2025-01-01T00:00:00Z',
    ...(metadata && { metadata }),
  };
}

/**
 * Creates a mock paginated response.
 * Matches the PagedResponse<T> structure from Spring Data.
 *
 * @example
 * ```typescript
 * const response = createMockPagedResponse([user1, user2], { page: 0, totalElements: 100 });
 * ```
 */
export function createMockPagedResponse<T>(
  content: T[],
  options: {
    page?: number;
    size?: number;
    totalElements?: number;
    totalPages?: number;
  } = {}
) {
  const { page = 0, size = 10, totalElements = content.length, totalPages = 1 } = options;

  return createMockApiResponse(
    {
      content,
      number: page,
      size,
      totalElements,
      totalPages,
      first: page === 0,
      last: page >= totalPages - 1,
    },
    {
      page,
      size,
      totalElements,
      totalPages,
      first: page === 0,
      last: page >= totalPages - 1,
    }
  );
}

/**
 * Creates a mock API error.
 * Matches the ApiError structure.
 *
 * @example
 * ```typescript
 * const error = createMockApiError(401, 'AUTH_001', 'Invalid credentials');
 * ```
 */
export function createMockApiError(
  status: number,
  errorCode: string,
  message: string,
  details?: unknown
): { status: number; errorCode: string; message: string; details?: unknown } {
  const result: { status: number; errorCode: string; message: string; details?: unknown } = {
    status,
    errorCode,
    message,
  };
  if (details !== undefined) {
    result.details = details;
  }
  return result;
}

/**
 * Pre-configured API error fixtures for common scenarios.
 */
export const mockApiErrors = {
  /** Invalid credentials (login failure) */
  invalidCredentials: createMockApiError(401, 'AUTH_001', 'Invalid credentials'),
  /** Invalid or malformed token */
  invalidToken: createMockApiError(401, 'AUTH_002', 'Invalid token'),
  /** Token has expired */
  tokenExpired: createMockApiError(401, 'AUTH_003', 'Token expired'),
  /** Resource not found */
  notFound: createMockApiError(404, 'RES_001', 'Resource not found'),
  /** Insufficient permissions */
  forbidden: createMockApiError(403, 'AUTH_005', 'Insufficient permissions'),
  /** Validation error */
  validation: createMockApiError(400, 'VAL_001', 'Validation failed'),
  /** Server error */
  serverError: createMockApiError(500, 'SERVER_001', 'Internal server error'),
};

// ============================================================================
// Audit Log Fixtures
// ============================================================================

/**
 * Factory function to create a mock AuditLog.
 *
 * @example
 * ```typescript
 * const log = createMockAuditLog({ action: 'DELETE', entityType: 'User' });
 * ```
 */
export function createMockAuditLog(overrides?: Partial<AuditLog>): AuditLog {
  return {
    id: 1,
    entityType: 'User',
    entityId: 123,
    action: 'CREATE',
    userId: 1,
    username: 'admin',
    ipAddress: '192.168.1.1',
    changes: '{"field": "value"}',
    metadata: null,
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Pre-configured audit log fixtures for common scenarios.
 */
export const mockAuditLogs = {
  /** User creation action */
  userCreate: createMockAuditLog({
    id: 1,
    entityType: 'User',
    entityId: 100,
    action: 'CREATE',
    changes: '{"username": "newuser"}',
  }),
  /** User update action */
  userUpdate: createMockAuditLog({
    id: 2,
    entityType: 'User',
    entityId: 100,
    action: 'UPDATE',
    changes: '{"email": "updated@example.com"}',
  }),
  /** User deletion action */
  userDelete: createMockAuditLog({
    id: 3,
    entityType: 'User',
    entityId: 100,
    action: 'DELETE',
    changes: null,
  }),
  /** Login action */
  login: createMockAuditLog({
    id: 4,
    entityType: 'Session',
    entityId: null,
    action: 'LOGIN',
    changes: null,
  }),
  /** Audit log with all null optional fields */
  minimal: createMockAuditLog({
    id: 5,
    entityId: null,
    userId: null,
    username: null,
    ipAddress: null,
    changes: null,
    metadata: null,
  }),
};

// ============================================================================
// Quotation Fixtures
// ============================================================================

/**
 * Factory function to create a mock LineItem.
 */
export function createMockLineItem(overrides?: Partial<LineItem>): LineItem {
  return {
    id: 1,
    productId: 100,
    productSku: 'SKU-001',
    productName: 'Test Product',
    sequence: 1,
    quantity: 10,
    unitPrice: 50000,
    lineTotal: 500000,
    notes: null,
    ...overrides,
  };
}

/**
 * Factory function to create a mock Quotation.
 */
export function createMockQuotation(overrides?: Partial<Quotation>): Quotation {
  return {
    id: 1,
    projectId: 1,
    projectName: 'Test Project',
    jobCode: 'WK22025-000001-20250101',
    version: 1,
    status: 'DRAFT' as QuotationStatus,
    quotationDate: '2025-01-15',
    validityDays: 30,
    expiryDate: '2025-02-14',
    totalAmount: 1500000,
    notes: null,
    createdById: 1,
    createdByName: 'Test User',
    submittedAt: null,
    approvedAt: null,
    approvedById: null,
    approvedByName: null,
    rejectionReason: null,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    lineItems: [createMockLineItem()],
    ...overrides,
  };
}

/**
 * Pre-configured quotation fixtures.
 */
export const mockQuotations = {
  draft: createMockQuotation({ id: 1, status: 'DRAFT' }),
  pending: createMockQuotation({ id: 2, status: 'PENDING', submittedAt: '2025-01-15T10:00:00Z' }),
  approved: createMockQuotation({
    id: 3,
    status: 'APPROVED',
    submittedAt: '2025-01-15T10:00:00Z',
    approvedAt: '2025-01-16T10:00:00Z',
    approvedById: 2,
    approvedByName: 'Approver User',
  }),
  rejected: createMockQuotation({
    id: 4,
    status: 'REJECTED',
    submittedAt: '2025-01-15T10:00:00Z',
    rejectionReason: 'Price too high',
  }),
};

/**
 * Factory function to create a mock ApprovalLevel.
 */
export function createMockApprovalLevel(overrides?: Partial<ApprovalLevel>): ApprovalLevel {
  return {
    levelOrder: 1,
    levelName: '팀장',
    expectedApproverUserId: 10,
    expectedApproverName: 'Team Lead',
    decision: 'PENDING' as ApprovalStatus,
    decidedByUserId: null,
    decidedByName: null,
    decidedAt: null,
    comments: null,
    ...overrides,
  };
}

/**
 * Factory function to create a mock Approval.
 */
export function createMockApproval(overrides?: Partial<Approval>): Approval {
  return {
    id: 1,
    entityType: 'QUOTATION',
    entityId: 1,
    entityDescription: 'Quotation #1',
    currentLevel: 1,
    totalLevels: 2,
    status: 'PENDING' as ApprovalStatus,
    submittedById: 1,
    submittedByName: 'Submitter User',
    submittedAt: '2025-01-15T10:00:00Z',
    completedAt: null,
    createdAt: '2025-01-15T10:00:00Z',
    levels: [
      createMockApprovalLevel({ levelOrder: 1, levelName: '팀장' }),
      createMockApprovalLevel({
        levelOrder: 2,
        levelName: '부서장',
        expectedApproverUserId: 20,
        expectedApproverName: 'Dept Head',
      }),
    ],
    ...overrides,
  };
}

/**
 * Pre-configured approval fixtures.
 */
export const mockApprovals = {
  pending: createMockApproval(),
  approved: createMockApproval({
    id: 2,
    status: 'APPROVED',
    completedAt: '2025-01-16T10:00:00Z',
    levels: [
      createMockApprovalLevel({
        levelOrder: 1,
        decision: 'APPROVED',
        decidedByUserId: 10,
        decidedByName: 'Team Lead',
        decidedAt: '2025-01-15T14:00:00Z',
      }),
      createMockApprovalLevel({
        levelOrder: 2,
        decision: 'APPROVED',
        decidedByUserId: 20,
        decidedByName: 'Dept Head',
        decidedAt: '2025-01-16T10:00:00Z',
      }),
    ],
  }),
  rejected: createMockApproval({
    id: 3,
    status: 'REJECTED',
    completedAt: '2025-01-15T15:00:00Z',
    levels: [
      createMockApprovalLevel({
        levelOrder: 1,
        decision: 'REJECTED',
        decidedByUserId: 10,
        decidedByName: 'Team Lead',
        decidedAt: '2025-01-15T15:00:00Z',
        comments: 'Rejected reason',
      }),
    ],
  }),
};

/**
 * Factory function to create a mock ApprovalHistory.
 */
export function createMockApprovalHistory(
  overrides?: Partial<ApprovalHistory>
): ApprovalHistory {
  return {
    id: 1,
    levelOrder: 1,
    levelName: '팀장',
    action: 'SUBMITTED',
    actorId: 1,
    actorName: 'Submitter User',
    comments: null,
    createdAt: '2025-01-15T10:00:00Z',
    ...overrides,
  };
}

/**
 * Factory function to create a mock ChainLevel.
 */
export function createMockChainLevel(overrides?: Partial<ChainLevel>): ChainLevel {
  return {
    id: 1,
    levelOrder: 1,
    levelName: '팀장',
    approverUserId: 10,
    approverUserName: 'Team Lead',
    isRequired: true,
    ...overrides,
  };
}

/**
 * Factory function to create a mock ChainTemplate.
 */
export function createMockChainTemplate(overrides?: Partial<ChainTemplate>): ChainTemplate {
  return {
    id: 1,
    entityType: 'QUOTATION',
    name: 'Quotation Approval Chain',
    description: 'Default approval chain for quotations',
    isActive: true,
    levels: [
      createMockChainLevel({ id: 1, levelOrder: 1, levelName: '팀장' }),
      createMockChainLevel({
        id: 2,
        levelOrder: 2,
        levelName: '부서장',
        approverUserId: 20,
        approverUserName: 'Dept Head',
      }),
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Factory function to create a mock ProductListItem.
 */
export function createMockProduct(overrides?: Partial<ProductListItem>): ProductListItem {
  return {
    id: 1,
    sku: 'SKU-001',
    name: 'Test Product',
    description: 'A test product description',
    productTypeId: 1,
    productTypeName: 'Electronics',
    baseUnitPrice: 50000,
    unit: 'EA',
    isActive: true,
    ...overrides,
  };
}

/**
 * Pre-configured product fixtures.
 */
export const mockProducts = {
  active: createMockProduct(),
  inactive: createMockProduct({ id: 2, sku: 'SKU-002', name: 'Inactive Product', isActive: false }),
  withoutPrice: createMockProduct({
    id: 3,
    sku: 'SKU-003',
    name: 'Custom Product',
    baseUnitPrice: null,
  }),
};

// ============================================================================
// Re-exports
// ============================================================================

/**
 * Re-export types for convenience in test files
 */
export type { User, RoleName, AuthState };

export type { UserDetails };
