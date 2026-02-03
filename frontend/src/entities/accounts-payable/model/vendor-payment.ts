/**
 * VendorPayment domain model.
 *
 * Represents a payment made toward an accounts payable obligation.
 * Dates are stored as ISO strings for React Query cache serialization.
 */

import type { VendorPaymentMethod } from '../api/record-payment';

/**
 * VendorPayment domain model (plain interface).
 * All properties are readonly to enforce immutability.
 */
export interface VendorPayment {
  readonly id: number;
  readonly accountsPayableId: number;
  readonly paymentDate: string; // ISO date
  readonly amount: number;
  readonly paymentMethod: VendorPaymentMethod;
  readonly referenceNumber: string | null;
  readonly notes: string | null;
  readonly recordedById: number;
  readonly recordedByName: string;
  readonly createdAt: string; // ISO datetime
}
