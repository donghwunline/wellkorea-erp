/**
 * AccountsPayable Entity Public API
 *
 * Exports: domain models, query factory, UI components
 * NOT exported: mappers, internal API functions (get-*.ts)
 *
 * Note: Status is CALCULATED from payments, not stored.
 */

// ============================================================================
// Model - Domain types and business rules
// ============================================================================

export type { CalculatedAPStatus } from './model/accounts-payable-status';
export { APStatusConfigs, getAPStatusConfig } from './model/accounts-payable-status';

export type {
  AccountsPayable,
  AccountsPayableDetail,
  AccountsPayableSummary,
  APAgingSummary,
} from './model/accounts-payable';
export { accountsPayableRules } from './model/accounts-payable';

export type { VendorPayment } from './model/vendor-payment';

// ============================================================================
// API - Query factory
// ============================================================================

export { accountsPayableQueries } from './api/accounts-payable.queries';

// ============================================================================
// API - Command functions
// ============================================================================

export type {
  VendorPaymentMethod,
  RecordPaymentInput,
  RecordPaymentResult,
} from './api/record-payment';
export { recordPayment } from './api/record-payment';

// ============================================================================
// UI - Display components
// ============================================================================

export { AccountsPayableStatusBadge } from './ui/AccountsPayableStatusBadge';
export { AccountsPayableTable } from './ui/AccountsPayableTable';
export { VendorPaymentHistoryTable } from './ui/VendorPaymentHistoryTable';
