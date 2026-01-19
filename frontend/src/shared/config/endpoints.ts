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
  /** DELETE /companies/:id/roles/:roleType - Remove role from company */
  role: (id: number, roleType: string) => `/companies/${id}/roles/${roleType}`,
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
// Blueprint Attachment Endpoints
// ============================================================================

export const BLUEPRINT_ENDPOINTS = {
  /** List all attachments for a flow: GET /task-flows/:flowId/attachments */
  byFlow: (flowId: number) => `/task-flows/${flowId}/attachments`,
  /** List attachments for a node: GET /task-flows/:flowId/nodes/:nodeId/attachments */
  byNode: (flowId: number, nodeId: string) =>
    `/task-flows/${flowId}/nodes/${nodeId}/attachments`,
  /** List all attachments for a project: GET /projects/:projectId/attachments */
  byProject: (projectId: number) => `/projects/${projectId}/attachments`,
  /** Get presigned upload URL: POST /task-flows/:flowId/nodes/:nodeId/attachments/upload-url */
  uploadUrl: (flowId: number, nodeId: string) =>
    `/task-flows/${flowId}/nodes/${nodeId}/attachments/upload-url`,
  /** Register attachment after upload: POST /task-flows/:flowId/nodes/:nodeId/attachments/register */
  register: (flowId: number, nodeId: string) =>
    `/task-flows/${flowId}/nodes/${nodeId}/attachments/register`,
  /** Get attachment metadata: GET /blueprints/:id */
  byId: (id: number) => `/blueprints/${id}`,
  /** Get presigned download URL: GET /blueprints/:id/url */
  url: (id: number) => `/blueprints/${id}/url`,
  /** Delete attachment: DELETE /blueprints/:id */
  delete: (id: number) => `/blueprints/${id}`,
} as const;

// ============================================================================
// Delivery Endpoints
// ============================================================================

export const DELIVERY_ENDPOINTS = {
  /** Base path for delivery operations */
  /** GET /deliveries?projectId={projectId}&status={status} - List deliveries with optional filters */
  /** POST /deliveries - Create delivery (quotationId in request body) */
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

// ============================================================================
// Material Endpoints
// ============================================================================

export const MATERIAL_ENDPOINTS = {
  /** Base path for material operations */
  /** GET /materials - List materials with pagination */
  /** POST /materials - Create material */
  BASE: '/materials',

  /** GET/PUT/DELETE /materials/:id */
  byId: (id: number) => `/materials/${id}`,
  /** GET /materials/all - Get all materials for dropdown */
  all: '/materials/all',
  /** GET /materials/categories - List material categories */
  categories: '/materials/categories',
  /** GET /materials/categories/all - Get all categories for dropdown */
  allCategories: '/materials/categories/all',
  /** GET/PUT/DELETE /materials/categories/:id */
  category: (id: number) => `/materials/categories/${id}`,

  // ========== VENDOR MATERIAL OFFERINGS ==========

  /** GET /materials/:id/offerings/current - Get current vendor offerings for a material */
  currentOfferings: (materialId: number) => `/materials/${materialId}/offerings/current`,
  /** GET /materials/:id/offerings - Get all vendor offerings for a material (paginated) */
  offerings: (materialId: number) => `/materials/${materialId}/offerings`,
  /** POST /materials/offerings - Create vendor material offering */
  createOffering: '/materials/offerings',
  /** GET/PUT/DELETE /materials/offerings/:id */
  offering: (id: number) => `/materials/offerings/${id}`,
  /** PUT /materials/offerings/:id/preferred - Set vendor offering as preferred */
  setPreferred: (id: number) => `/materials/offerings/${id}/preferred`,
} as const;

// ============================================================================
// Purchase Request Endpoints
// ============================================================================

export const PURCHASE_REQUEST_ENDPOINTS = {
  /** Base path for purchase request operations */
  /** GET /purchase-requests - List purchase requests */
  BASE: '/purchase-requests',

  /** POST /purchase-requests/service - Create service purchase request */
  SERVICE: '/purchase-requests/service',
  /** POST /purchase-requests/material - Create material purchase request */
  MATERIAL: '/purchase-requests/material',

  /** GET/PUT /purchase-requests/:id */
  byId: (id: number) => `/purchase-requests/${id}`,
  /** POST /purchase-requests/:id/send-rfq - Send RFQ to vendors */
  sendRfq: (id: number) => `/purchase-requests/${id}/send-rfq`,
  /** POST /purchase-requests/:id/record-reply - Record vendor reply */
  recordReply: (id: number) => `/purchase-requests/${id}/record-reply`,
  /** POST /purchase-requests/:id/mark-no-response - Mark vendor as non-responsive */
  markNoResponse: (id: number) => `/purchase-requests/${id}/mark-no-response`,
  /** POST /purchase-requests/:id/select-vendor - Select vendor for the request */
  selectVendor: (id: number) => `/purchase-requests/${id}/select-vendor`,
  /** POST /purchase-requests/:id/reject-rfq - Reject vendor quote */
  rejectRfq: (id: number) => `/purchase-requests/${id}/reject-rfq`,
  /** DELETE /purchase-requests/:id - Cancel purchase request */
  cancel: (id: number) => `/purchase-requests/${id}`,
} as const;

// ============================================================================
// Purchase Order Endpoints
// ============================================================================

export const PURCHASE_ORDER_ENDPOINTS = {
  /** Base path for purchase order operations */
  /** GET /purchase-orders - List purchase orders */
  /** POST /purchase-orders - Create purchase order from RFQ item */
  BASE: '/purchase-orders',

  /** GET/PUT /purchase-orders/:id */
  byId: (id: number) => `/purchase-orders/${id}`,
  /** POST /purchase-orders/:id/send - Send PO to vendor */
  send: (id: number) => `/purchase-orders/${id}/send`,
  /** POST /purchase-orders/:id/confirm - Vendor confirmed */
  confirm: (id: number) => `/purchase-orders/${id}/confirm`,
  /** POST /purchase-orders/:id/receive - Mark as received */
  receive: (id: number) => `/purchase-orders/${id}/receive`,
  /** DELETE /purchase-orders/:id - Cancel purchase order */
  cancel: (id: number) => `/purchase-orders/${id}`,
} as const;
