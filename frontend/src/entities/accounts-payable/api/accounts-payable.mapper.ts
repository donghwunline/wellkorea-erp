/**
 * AccountsPayable mapper - transforms API responses to domain models.
 * INTERNAL: Not exported from entity public API.
 */

import type { CalculatedAPStatus } from '../model/accounts-payable-status';
import type { AccountsPayable, APAgingSummary } from '../model/accounts-payable';

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
