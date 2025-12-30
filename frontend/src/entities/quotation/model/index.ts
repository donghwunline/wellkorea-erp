/**
 * Quotation model barrel export.
 *
 * Exports all domain types, enums, and business rules.
 */

// Status types and helpers
export {
  QuotationStatus,
  QuotationStatusConfig,
  getStatusLabel,
  getStatusColor,
} from './quotation-status';
export type { StatusConfig } from './quotation-status';

// Line item types and rules
export type { LineItem } from './line-item';
export { lineItemRules } from './line-item';

// Quotation types and rules
export type { Quotation, QuotationListItem } from './quotation';
export { quotationRules } from './quotation';

// Command types and validation
export type {
  LineItemCommand,
  CreateQuotationCommand,
  UpdateQuotationCommand,
} from './quotation-command';
export { quotationValidation } from './quotation-command';
