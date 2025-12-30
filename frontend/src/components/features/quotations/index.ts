/**
 * Quotation feature components barrel export.
 *
 * Note: Many components have been migrated to FSD layers:
 * - QuotationDetailsPanel → @/widgets/quotation-details-panel
 * - EmailNotificationModal → @/features/quotation/notify
 * - useQuotationActions → @/features/quotation (various hooks)
 * - useProjectDetails → @/entities/project (useProject hook)
 * - quotationUtils → @/entities/quotation (quotationRules, formatters)
 */

// Legacy components (to be migrated to FSD layers)
export { QuotationTable, type QuotationTableProps } from './QuotationTable';
export { QuotationForm, type QuotationFormProps } from './QuotationForm';
export { ProductSelector, type ProductSelectorProps, type LineItemWithName } from './ProductSelector';

// Legacy hooks (to be migrated to FSD layers)
export { useProjectSearch, type UseProjectSearchReturn } from './hooks';
