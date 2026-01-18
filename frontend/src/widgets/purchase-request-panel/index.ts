/**
 * Purchase Request Panel Widget - Public API.
 *
 * Composite widget for displaying purchase request information
 * and managing RFQ (Request for Quotation) workflow.
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

export {
  PurchaseRequestDetailModal,
  type PurchaseRequestDetailModalProps,
  type SendRfqData,
} from './ui/PurchaseRequestDetailModal';

export {
  SendRfqModal,
  type SendRfqModalProps,
} from './ui/SendRfqModal';
