/**
 * Quotation service types.
 *
 * API DTOs matching backend QuotationResponse, ApprovalRequestResponse, and related DTOs.
 */

import type { Paginated } from '@/api/types';

// ============================================================================
// CQRS Command Result Types
// ============================================================================

/**
 * Generic command result from CQRS command endpoints.
 * Command operations return only the entity ID - clients fetch fresh data via query endpoints.
 */
export interface CommandResult {
  id: number;
  message: string;
}

// ============================================================================
// Quotation Types
// ============================================================================

/**
 * Quotation lifecycle status.
 */
export type QuotationStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED';

/**
 * Quotation status display labels (Korean).
 */
export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  DRAFT: '작성중',
  PENDING: '결재중',
  APPROVED: '승인됨',
  SENT: '발송완료',
  ACCEPTED: '수락됨',
  REJECTED: '반려됨',
};

/**
 * Quotation status badge colors.
 */
export const QUOTATION_STATUS_COLORS: Record<
  QuotationStatus,
  'gray' | 'yellow' | 'blue' | 'cyan' | 'green' | 'red'
> = {
  DRAFT: 'gray',
  PENDING: 'yellow',
  APPROVED: 'blue',
  SENT: 'cyan',
  ACCEPTED: 'green',
  REJECTED: 'red',
};

/**
 * Line item in a quotation.
 */
export interface QuotationLineItem {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  sequence: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes: string | null;
}

/**
 * Full quotation details from API response.
 */
export interface QuotationDetails {
  id: number;
  projectId: number;
  projectName: string;
  jobCode: string;
  version: number;
  status: QuotationStatus;
  quotationDate: string; // ISO date string
  validityDays: number;
  expiryDate: string; // ISO date string
  totalAmount: number;
  notes: string | null;
  createdById: number;
  createdByName: string;
  submittedAt: string | null; // ISO datetime string
  approvedAt: string | null; // ISO datetime string
  approvedById: number | null;
  approvedByName: string | null;
  rejectionReason: string | null;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
  lineItems: QuotationLineItem[] | null;
}

/**
 * Line item request for creating/updating quotation.
 */
export interface LineItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

/**
 * Request DTO for creating a new quotation.
 */
export interface CreateQuotationRequest {
  projectId: number;
  validityDays?: number;
  notes?: string;
  lineItems: LineItemRequest[];
}

/**
 * Request DTO for updating an existing quotation.
 */
export interface UpdateQuotationRequest {
  validityDays?: number;
  notes?: string;
  lineItems: LineItemRequest[];
}

/**
 * Query parameters for listing quotations.
 */
export interface QuotationListParams {
  page?: number;
  size?: number;
  status?: QuotationStatus;
  projectId?: number;
}

/**
 * Paginated quotation list response.
 */
export type PaginatedQuotations = Paginated<QuotationDetails>;

// ============================================================================
// Approval Types
// ============================================================================

/**
 * Approval status.
 */
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * Approval status display labels (Korean).
 */
export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  PENDING: '대기중',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
};

/**
 * Entity type for approvals.
 */
export type EntityType = 'QUOTATION' | 'PURCHASE_ORDER';

/**
 * Level decision in an approval request.
 * Note: No id field - decisions are identified by levelOrder within the request.
 */
export interface LevelDecision {
  levelOrder: number;
  levelName: string;
  expectedApproverUserId: number;
  expectedApproverName: string;
  decision: ApprovalStatus;
  decidedByUserId: number | null;
  decidedByName: string | null;
  decidedAt: string | null;
  comments: string | null;
}

/**
 * Approval request details from API response.
 */
export interface ApprovalDetails {
  id: number;
  entityType: EntityType;
  entityId: number;
  entityDescription: string | null;
  currentLevel: number;
  totalLevels: number;
  status: ApprovalStatus;
  submittedById: number;
  submittedByName: string;
  submittedAt: string; // ISO datetime string
  completedAt: string | null; // ISO datetime string
  createdAt: string; // ISO datetime string
  levels: LevelDecision[] | null;
}

/**
 * Approval history entry.
 */
export interface ApprovalHistoryEntry {
  id: number;
  levelOrder: number | null;
  levelName: string | null;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  actorId: number;
  actorName: string;
  comments: string | null;
  createdAt: string; // ISO datetime string
}

/**
 * Request DTO for approving.
 */
export interface ApproveRequest {
  comments?: string;
}

/**
 * Request DTO for rejecting.
 */
export interface RejectRequest {
  reason: string;
  comments?: string;
}

/**
 * Query parameters for listing approvals.
 */
export interface ApprovalListParams {
  page?: number;
  size?: number;
  entityType?: EntityType;
  status?: ApprovalStatus;
  myPending?: boolean;
}

/**
 * Paginated approval list response.
 */
export type PaginatedApprovals = Paginated<ApprovalDetails>;

// ============================================================================
// Approval Chain Types
// ============================================================================

/**
 * Approval chain level.
 */
export interface ChainLevel {
  id: number;
  levelOrder: number;
  levelName: string;
  approverUserId: number;
  approverUserName: string;
  isRequired: boolean;
}

/**
 * Approval chain template.
 */
export interface ChainTemplate {
  id: number;
  entityType: EntityType;
  name: string;
  description: string | null;
  isActive: boolean;
  levels: ChainLevel[];
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

/**
 * Request DTO for updating chain levels.
 */
export interface ChainLevelRequest {
  levelOrder: number;
  levelName: string;
  approverUserId: number;
  isRequired: boolean;
}

/**
 * Request DTO for updating chain levels.
 */
export interface UpdateChainLevelsRequest {
  levels: ChainLevelRequest[];
}

// ============================================================================
// Product Types
// ============================================================================

/**
 * Product search result.
 */
export interface ProductSearchResult {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  productTypeName: string | null;
  baseUnitPrice: number | null;
  unit: string | null;
  isActive: boolean;
}

/**
 * Query parameters for searching products.
 */
export interface ProductSearchParams {
  query?: string;
  typeId?: number;
  page?: number;
  size?: number;
}

/**
 * Paginated product search response.
 */
export type PaginatedProducts = Paginated<ProductSearchResult>;
