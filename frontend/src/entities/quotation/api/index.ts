/**
 * Quotation API barrel export.
 */

// DTOs
export type {
  CommandResult,
  LineItemDTO,
  QuotationDetailsDTO,
  LineItemRequestDTO,
  CreateQuotationRequestDTO,
  UpdateQuotationRequestDTO,
  QuotationListParamsDTO,
} from './quotation.dto';

// Mappers
export { lineItemMapper, quotationMapper } from './quotation.mapper';

// Command mappers and input types
export type {
  CreateQuotationInput,
  UpdateQuotationInput,
  LineItemInput,
} from './quotation.command-mapper';
export { quotationCommandMapper } from './quotation.command-mapper';

// API functions
export { quotationApi } from './quotation.api';
