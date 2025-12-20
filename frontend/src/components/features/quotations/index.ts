/**
 * Quotation feature components barrel export.
 */

// Feature components
export { QuotationTable, type QuotationTableProps } from './QuotationTable';
export { QuotationForm, type QuotationFormProps } from './QuotationForm';
export { ProductSelector, type ProductSelectorProps } from './ProductSelector';
export { ApprovalRequestCard, type ApprovalRequestCardProps } from './ApprovalRequestCard';
export { ApprovalRejectModal, type ApprovalRejectModalProps } from './ApprovalRejectModal';

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
