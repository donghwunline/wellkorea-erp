/**
 * AccountsPayable mapper - transforms API responses to domain models.
 * INTERNAL: Not exported from entity public API.
 */

import type { VendorPaymentMethod } from './record-payment';
import type { CalculatedAPStatus } from '../model/accounts-payable-status';
import type { AccountsPayable, AccountsPayableDetail, APAgingSummary } from '../model/accounts-payable';
import type { VendorPayment } from '../model/vendor-payment';

/**
 * API response type for accounts payable.
 */
export interface AccountsPayableResponse {
  id: number;
  // Disbursement cause fields
  causeType: string;
  causeId: number;
  causeReferenceNumber: string;
  // Vendor info
  vendorId: number;
  vendorName: string;
  totalAmount: number;
  currency: string;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  // Calculated fields
  totalPaid: number;
  remainingBalance: number;
  isOverdue: boolean;
  daysOverdue: number;
  agingBucket: string;
  calculatedStatus: CalculatedAPStatus;
}

/**
 * API response type for AP aging summary.
 */
export interface APAgingSummaryResponse {
  agingBucket: string;
  count: number;
  totalAmount: number;
  totalPaid: number;
  remainingBalance: number;
}

/**
 * API response type for vendor payment.
 */
export interface VendorPaymentResponse {
  id: number;
  accountsPayableId: number;
  paymentDate: string;
  amount: number;
  paymentMethod: VendorPaymentMethod;
  referenceNumber: string | null;
  notes: string | null;
  recordedById: number;
  recordedByName: string;
  createdAt: string;
}

/**
 * API response type for accounts payable detail with payments.
 */
export interface AccountsPayableDetailResponse extends AccountsPayableResponse {
  payments: VendorPaymentResponse[];
}

/**
 * Map API response to AccountsPayable domain model.
 */
export function mapToAccountsPayable(response: AccountsPayableResponse): AccountsPayable {
  return {
    id: response.id,
    causeType: response.causeType,
    causeId: response.causeId,
    causeReferenceNumber: response.causeReferenceNumber,
    vendorId: response.vendorId,
    vendorName: response.vendorName,
    totalAmount: response.totalAmount,
    currency: response.currency,
    dueDate: response.dueDate,
    notes: response.notes,
    createdAt: response.createdAt,
    totalPaid: response.totalPaid,
    remainingBalance: response.remainingBalance,
    isOverdue: response.isOverdue,
    daysOverdue: response.daysOverdue,
    agingBucket: response.agingBucket,
    calculatedStatus: response.calculatedStatus,
  };
}

/**
 * Map API response to APAgingSummary domain model.
 */
export function mapToAPAgingSummary(response: APAgingSummaryResponse): APAgingSummary {
  return {
    agingBucket: response.agingBucket,
    count: response.count,
    totalAmount: response.totalAmount,
    totalPaid: response.totalPaid,
    remainingBalance: response.remainingBalance,
  };
}

/**
 * Map API response to VendorPayment domain model.
 */
export function mapToVendorPayment(response: VendorPaymentResponse): VendorPayment {
  return {
    id: response.id,
    accountsPayableId: response.accountsPayableId,
    paymentDate: response.paymentDate,
    amount: response.amount,
    paymentMethod: response.paymentMethod,
    referenceNumber: response.referenceNumber,
    notes: response.notes,
    recordedById: response.recordedById,
    recordedByName: response.recordedByName,
    createdAt: response.createdAt,
  };
}

/**
 * Map API response to AccountsPayableDetail domain model.
 */
export function mapToAccountsPayableDetail(response: AccountsPayableDetailResponse): AccountsPayableDetail {
  return {
    id: response.id,
    causeType: response.causeType,
    causeId: response.causeId,
    causeReferenceNumber: response.causeReferenceNumber,
    vendorId: response.vendorId,
    vendorName: response.vendorName,
    totalAmount: response.totalAmount,
    currency: response.currency,
    dueDate: response.dueDate,
    notes: response.notes,
    createdAt: response.createdAt,
    totalPaid: response.totalPaid,
    remainingBalance: response.remainingBalance,
    isOverdue: response.isOverdue,
    daysOverdue: response.daysOverdue,
    agingBucket: response.agingBucket,
    calculatedStatus: response.calculatedStatus,
    payments: response.payments.map(mapToVendorPayment),
  };
}
