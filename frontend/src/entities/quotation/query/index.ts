/**
 * Quotation query barrel export.
 *
 * Exports all TanStack Query hooks and utilities for quotation data.
 */

// Query keys for cache management
export { quotationQueryKeys } from './query-keys';

// Query functions for reuse in prefetch/ensureQueryData
export { quotationQueryFns, type PaginatedQuotations, type QuotationListParams } from './query-fns';

// Query hooks
export { useQuotation, type UseQuotationOptions } from './use-quotation';
export { useQuotations, type UseQuotationsOptions, type UseQuotationsParams } from './use-quotations';
