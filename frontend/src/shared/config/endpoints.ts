/**
 * API endpoint path constants.
 *
 * Centralizes all API endpoint paths for:
 * - Easy maintenance and updates
 * - Consistent path usage across services
 * - Type-safe endpoint references
 */

// ============================================================================
// Auth Endpoints
// ============================================================================

export const AUTH_ENDPOINTS = {
  /** POST /auth/login - Authenticate user */
  LOGIN: '/auth/login',
  /** POST /auth/logout - Logout user */
  LOGOUT: '/auth/logout',
  /** GET /auth/me - Get current user info */
  ME: '/auth/me',
  /** POST /auth/refresh - Refresh access token */
  REFRESH: '/auth/refresh',
} as const;

// ============================================================================
// User Endpoints
// ============================================================================

export const USER_ENDPOINTS = {
  /** Base path for user operations */
  BASE: '/users',

  /** GET/PUT/DELETE /users/:id */
  byId: (id: number) => `/users/${id}`,
  /** PUT /users/:id/roles */
  roles: (id: number) => `/users/${id}/roles`,
  /** PUT /users/:id/password */
  password: (id: number) => `/users/${id}/password`,
  /** POST /users/:id/activate */
  activate: (id: number) => `/users/${id}/activate`,
  /** GET/PUT /users/:id/customers */
  customers: (id: number) => `/users/${id}/customers`,
} as const;

// ============================================================================
// Audit Endpoints
// ============================================================================

export const AUDIT_ENDPOINTS = {
  /** Base path for audit operations */
  BASE: '/audit',

  /** GET /audit/:id */
  byId: (id: number) => `/audit/${id}`,
} as const;

// ============================================================================
// Project Endpoints
// ============================================================================

export const PROJECT_ENDPOINTS = {
  /** Base path for project operations */
  BASE: '/projects',

  /** GET/PUT/DELETE /projects/:id */
  byId: (id: number) => `/projects/${id}`,
  /** GET /projects/jobcode/:jobCode */
  byJobCode: (jobCode: string) => `/projects/jobcode/${jobCode}`,
} as const;

// ============================================================================
// Quotation Endpoints
// ============================================================================

export const QUOTATION_ENDPOINTS = {
  /** Base path for quotation operations */
  BASE: '/quotations',

  /** GET/PUT /quotations/:id */
  byId: (id: number) => `/quotations/${id}`,
  /** POST /quotations/:id/submit - Submit for approval */
  submit: (id: number) => `/quotations/${id}/submit`,
  /** POST /quotations/:id/versions - Create new version */
  versions: (id: number) => `/quotations/${id}/versions`,
  /** POST /quotations/:id/pdf - Generate PDF */
  pdf: (id: number) => `/quotations/${id}/pdf`,
  /** POST /quotations/:id/send-revision-notification - Send email notification */
  sendNotification: (id: number) => `/quotations/${id}/send-revision-notification`,
} as const;

// ============================================================================
// Approval Endpoints
// ============================================================================

export const APPROVAL_ENDPOINTS = {
  /** Base path for approval operations */
  BASE: '/approvals',

  /** GET /approvals/:id */
  byId: (id: number) => `/approvals/${id}`,
  /** POST /approvals/:id/approve */
  approve: (id: number) => `/approvals/${id}/approve`,
  /** POST /approvals/:id/reject */
  reject: (id: number) => `/approvals/${id}/reject`,
  /** GET /approvals/:id/history */
  history: (id: number) => `/approvals/${id}/history`,
} as const;

// ============================================================================
// Admin Approval Chain Endpoints
// ============================================================================

export const APPROVAL_CHAIN_ENDPOINTS = {
  /** Base path for admin approval chain operations */
  BASE: '/admin/approval-chains',

  /** GET /admin/approval-chains/:id */
  byId: (id: number) => `/admin/approval-chains/${id}`,
  /** PUT /admin/approval-chains/:id/levels */
  levels: (id: number) => `/admin/approval-chains/${id}/levels`,
} as const;

// ============================================================================
// Product Endpoints
// ============================================================================

export const PRODUCT_ENDPOINTS = {
  /** Base path for product operations */
  BASE: '/products',

  /** GET /products/:id */
  byId: (id: number) => `/products/${id}`,
  /** GET /products/types - Get all product types */
  types: '/products/types',
} as const;

// ============================================================================
// Service Category Endpoints (Catalog)
// ============================================================================

export const SERVICE_CATEGORY_ENDPOINTS = {
  /** Base path for service category operations */
  BASE: '/service-categories',

  /** GET/PUT/DELETE /service-categories/:id */
  byId: (id: number) => `/service-categories/${id}`,
  /** GET /service-categories/all - Get all categories for dropdown */
  all: '/service-categories/all',
  /** GET /service-categories/:id/offerings - Get vendor offerings for category */
  offerings: (id: number) => `/service-categories/${id}/offerings`,
  /** GET /service-categories/:id/offerings/current - Get current offerings */
  currentOfferings: (id: number) => `/service-categories/${id}/offerings/current`,
  /** POST/PUT/DELETE /service-categories/offerings/:id */
  offering: (id: number) => `/service-categories/offerings/${id}`,
  /** POST /service-categories/offerings - Create offering */
  createOffering: '/service-categories/offerings',
} as const;

// ============================================================================
// Company Endpoints
// ============================================================================

export const COMPANY_ENDPOINTS = {
  /** Base path for company operations */
  BASE: '/companies',

  /** GET/PUT/DELETE /companies/:id */
  byId: (id: number) => `/companies/${id}`,
  /** POST /companies/:id/roles - Add role to company */
  roles: (id: number) => `/companies/${id}/roles`,
  /** DELETE /companies/:id/roles/:roleId - Remove role from company */
  role: (id: number, roleId: number) => `/companies/${id}/roles/${roleId}`,
} as const;

// ============================================================================
// Work Progress Endpoints (Production Tracking)
// ============================================================================

export const WORK_PROGRESS_ENDPOINTS = {
  /** Base path for work progress operations */
  BASE: '/work-progress',

  /** GET/DELETE /work-progress/:id */
  byId: (id: number) => `/work-progress/${id}`,
  /** PUT /work-progress/:sheetId/steps/:stepId */
  step: (sheetId: number, stepId: number) => `/work-progress/${sheetId}/steps/${stepId}`,
  /** GET /work-progress/project/:projectId/summary */
  projectSummary: (projectId: number) => `/work-progress/project/${projectId}/summary`,
  /** GET /work-progress/project/:projectId/outsourced */
  outsourcedSteps: (projectId: number) => `/work-progress/project/${projectId}/outsourced`,
} as const;

// ============================================================================
// Task Flow Endpoints (DAG-based task progress)
// ============================================================================

export const TASK_FLOW_ENDPOINTS = {
  /** Base path for task flow operations */
  /** GET /task-flows?projectId={projectId} - Query with projectId parameter */
  BASE: '/task-flows',

  /** GET/PUT /task-flows/:id */
  byId: (id: number) => `/task-flows/${id}`,
} as const;

// ============================================================================
// Delivery Endpoints
// ============================================================================

export const DELIVERY_ENDPOINTS = {
  /** Base path for delivery operations */
  /** GET /deliveries?projectId={projectId}&status={status} - List deliveries with optional filters */
  /** POST /deliveries?projectId={projectId} - Create delivery for a project */
  BASE: '/deliveries',

  /** GET /deliveries/:id - Get delivery detail */
  byId: (id: number) => `/deliveries/${id}`,
  /** POST /deliveries/:id/delivered - Mark as delivered */
  markDelivered: (id: number) => `/deliveries/${id}/delivered`,
  /** POST /deliveries/:id/returned - Mark as returned */
  markReturned: (id: number) => `/deliveries/${id}/returned`,
  /** POST /deliveries/:id/reassign?quotationId={quotationId} - Reassign to different quotation */
  reassign: (id: number) => `/deliveries/${id}/reassign`,
  /** GET /deliveries/:id/statement - Generate delivery statement PDF */
  statement: (id: number) => `/deliveries/${id}/statement`,
} as const;
