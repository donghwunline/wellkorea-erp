/**
 * Quotation feature components barrel export.
 */

// Feature components
export { QuotationTable, type QuotationTableProps } from './QuotationTable';
export { QuotationForm, type QuotationFormProps } from './QuotationForm';
export { QuotationDetailsPanel, type QuotationDetailsPanelProps } from './QuotationDetailsPanel';
export { QuotationInfoCard, type QuotationInfoCardProps } from './QuotationInfoCard';
export {
  QUOTATION_STATUS_LABELS,
  QUOTATION_STATUS_BADGE_VARIANTS,
  formatQuotationDate,
  formatQuotationCurrency,
} from './quotationUtils';
export { ProductSelector, type ProductSelectorProps, type LineItemWithName } from './ProductSelector';
export { EmailNotificationModal, type EmailNotificationModalProps } from './EmailNotificationModal';

// Hooks
export {
  useQuotationActions,
  type UseQuotationActionsReturn,
  useProjectSearch,
  type UseProjectSearchReturn,
  useProjectDetails,
  type UseProjectDetailsReturn,
} from './hooks';
