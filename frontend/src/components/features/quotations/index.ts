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
  APPROVAL_STATUS_LABELS,
  QUOTATION_STATUS_BADGE_VARIANTS,
  formatQuotationDate,
  formatQuotationCurrency,
} from './quotationUtils';
export { ProductSelector, type ProductSelectorProps } from './ProductSelector';
export { ApprovalRequestCard, type ApprovalRequestCardProps } from './ApprovalRequestCard';
export { ApprovalRejectModal, type ApprovalRejectModalProps } from './ApprovalRejectModal';
export {
  EmailNotificationModal,
  type EmailNotificationModalProps,
} from './EmailNotificationModal';

// Hooks
export {
  useQuotationActions,
  type UseQuotationActionsReturn,
  useApprovalActions,
  type UseApprovalActionsReturn,
  useProjectSearch,
  type UseProjectSearchReturn,
  useApprovalList,
  type UseApprovalListParams,
  type UseApprovalListReturn,
  useApprovalChainConfig,
  type UseApprovalChainConfigReturn,
  useProjectDetails,
  type UseProjectDetailsReturn,
} from './hooks';
