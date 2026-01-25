/**
 * Invoice entity public API.
 *
 * Exports:
 * - Model types and business rules
 * - Query factory for data fetching
 * - Command functions for mutations
 * - UI components for display
 */

// Model types and rules
export type { Invoice, InvoiceSummary, InvoiceLineItem, Payment } from './model/invoice';
export { invoiceRules } from './model/invoice';

export type { InvoiceStatus } from './model/invoice-status';
export {
  invoiceStatusConfig,
  getStatusLabel,
  getStatusColor,
  canTransitionTo,
  canReceivePayment,
} from './model/invoice-status';

export type { PaymentMethod } from './model/payment-method';
export {
  paymentMethodConfig,
  getPaymentMethodLabel,
  getPaymentMethodOptions,
} from './model/payment-method';

// Query factory
export { invoiceQueries } from './api/invoice.queries';

// AR Report
export type { ARReport, ARInvoice, CustomerAR } from './api/ar-report';
export { arReportQueries, arReportRules } from './api/ar-report';

// Command functions
export { createInvoice } from './api/create-invoice';
export type { CreateInvoiceInput, CreateInvoiceLineItemInput } from './api/create-invoice';

export {
  issueInvoice,
  cancelInvoice,
  recordPayment,
  updateInvoiceNotes,
} from './api/invoice-actions';
export type { IssueInvoiceInput, RecordPaymentInput } from './api/invoice-actions';

// UI components
export { InvoiceStatusBadge } from './ui/InvoiceStatusBadge';
export { InvoiceTable } from './ui/InvoiceTable';
export { InvoiceCard } from './ui/InvoiceCard';
export { PaymentHistoryTable } from './ui/PaymentHistoryTable';
