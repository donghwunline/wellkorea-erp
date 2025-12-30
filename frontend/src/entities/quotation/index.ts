/**
 * Quotation Entity - Public API.
 *
 * Exports all public types, rules, hooks, and UI components
 * for the quotation domain.
 *
 * FSD Layer: entities
 * Can import from: shared
 * Cannot import from: features, widgets, pages
 */

// Domain Model - Types and Business Rules
export type {
  LineItem,
  Quotation,
  CreateQuotationCommand,
  UpdateQuotationCommand,
  LineItemCommand,
} from './model';

export {
  QuotationStatus,
  QuotationStatusConfig,
  getStatusLabel,
  getStatusColor,
  lineItemRules,
  quotationRules,
  quotationValidation,
} from './model';

// API Layer - DTOs, Mappers, API functions
export type {
  CreateQuotationInput,
  UpdateQuotationInput,
  LineItemInput,
} from './api';

export {
  quotationApi,
  quotationMapper,
  quotationCommandMapper,
} from './api';

// Query Layer - TanStack Query hooks
export type {
  UseQuotationOptions,
  UseQuotationsOptions,
  UseQuotationsParams,
  PaginatedQuotations,
  QuotationListParams,
} from './query';

export {
  quotationQueryKeys,
  quotationQueryFns,
  useQuotation,
  useQuotations,
} from './query';

// UI Layer - Display components
export type {
  QuotationStatusBadgeProps,
  QuotationCardProps,
  QuotationTableProps,
} from './ui';

export {
  QuotationStatusBadge,
  QuotationCard,
  QuotationTable,
} from './ui';
