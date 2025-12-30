/**
 * Quotation services barrel export.
 * Exports all quotation-related services and types.
 *
 * @deprecated This module is being replaced by FSD-Lite architecture.
 *
 * **Migration guide:**
 *
 * ```typescript
 * // OLD (deprecated)
 * import { quotationService, type QuotationDetails } from '@/services/quotations';
 *
 * // NEW (FSD-Lite)
 * import { useQuotation, useQuotations, type Quotation, quotationRules } from '@/entities/quotation';
 * import { useCreateQuotation } from '@/features/quotation/create';
 * import { useUpdateQuotation } from '@/features/quotation/update';
 * import { useSubmitQuotation } from '@/features/quotation/submit';
 * ```
 *
 * This module will be removed once all consumers are migrated.
 */

// Services
export { quotationService } from './quotationService';
export { approvalService } from './approvalService';
export { approvalChainService } from './approvalChainService';

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
} from './types';

// Status labels and colors
export {
  QUOTATION_STATUS_LABELS,
  QUOTATION_STATUS_COLORS,
  APPROVAL_STATUS_LABELS,
} from './types';
