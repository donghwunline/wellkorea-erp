/**
 * Quotation services barrel export.
 * Exports all quotation-related services and types.
 */

// Services
export { quotationService } from './quotationService';
export { approvalService } from './approvalService';
export { approvalChainService } from './approvalChainService';
export { productService } from './productService';

// Types
export type {
  // CQRS command result
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
} from './types';

// Status labels and colors
export {
  QUOTATION_STATUS_LABELS,
  QUOTATION_STATUS_COLORS,
  APPROVAL_STATUS_LABELS,
} from './types';
