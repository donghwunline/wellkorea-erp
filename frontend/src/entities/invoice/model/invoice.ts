/**
 * Invoice domain model and business rules.
 */

import type { InvoiceStatus } from './invoice-status';
import type { PaymentMethod } from './payment-method';

/**
 * Invoice line item - represents a product on an invoice.
 */
export interface InvoiceLineItem {
  readonly id: number;
  readonly productId: number;
  readonly productName: string;
  readonly productSku: string | null;
  readonly quantityInvoiced: number;
  readonly unitPrice: number;
  readonly lineTotal: number;
}

/**
 * Payment record for an invoice.
 */
export interface Payment {
  readonly id: number;
  readonly invoiceId: number;
  readonly paymentDate: string; // ISO date string
  readonly amount: number;
  readonly paymentMethod: PaymentMethod;
  readonly paymentMethodLabel: string;
  readonly referenceNumber: string | null;
  readonly notes: string | null;
  readonly recordedById: number;
  readonly recordedByName: string;
  readonly createdAt: string;
}

/**
 * Invoice summary for list views.
 */
export interface InvoiceSummary {
  readonly id: number;
  readonly projectId: number;
  readonly jobCode: string;
  readonly invoiceNumber: string;
  readonly issueDate: string;
  readonly status: InvoiceStatus;
  readonly statusLabel: string;
  readonly totalAmount: number;
  readonly totalPaid: number;
  readonly remainingBalance: number;
  readonly dueDate: string;
  readonly isOverdue: boolean;
  readonly agingBucket: string;
  readonly lineItemCount: number;
  readonly paymentCount: number;
}

/**
 * Full invoice entity with all details.
 */
export interface Invoice {
  readonly id: number;
  readonly projectId: number;
  readonly jobCode: string;
  readonly deliveryId: number | null;
  readonly invoiceNumber: string;
  readonly issueDate: string;
  readonly status: InvoiceStatus;
  readonly statusLabel: string;
  readonly totalBeforeTax: number;
  readonly taxRate: number;
  readonly totalTax: number;
  readonly totalAmount: number;
  readonly totalPaid: number;
  readonly remainingBalance: number;
  readonly dueDate: string;
  readonly notes: string | null;
  readonly createdById: number;
  readonly createdByName: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly issuedToCustomerDate: string | null;
  readonly isOverdue: boolean;
  readonly daysOverdue: number;
  readonly agingBucket: string;
  readonly lineItems: InvoiceLineItem[];
  readonly payments: Payment[];
}

/**
 * Business rules for invoice domain.
 */
export const invoiceRules = {
  /**
   * Check if invoice can be edited.
   */
  canEdit(invoice: Invoice | InvoiceSummary): boolean {
    return invoice.status === 'DRAFT';
  },

  /**
   * Check if invoice can be issued.
   */
  canIssue(invoice: Invoice | InvoiceSummary): boolean {
    return invoice.status === 'DRAFT';
  },

  /**
   * Check if invoice can receive payments.
   */
  canReceivePayment(invoice: Invoice | InvoiceSummary): boolean {
    return ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status);
  },

  /**
   * Check if invoice can be cancelled.
   */
  canCancel(invoice: Invoice | InvoiceSummary): boolean {
    return ['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(
      invoice.status
    );
  },

  /**
   * Check if invoice is fully paid.
   */
  isPaid(invoice: Invoice | InvoiceSummary): boolean {
    return invoice.status === 'PAID';
  },

  /**
   * Check if invoice is overdue.
   */
  isOverdue(invoice: Invoice | InvoiceSummary): boolean {
    return invoice.isOverdue || invoice.status === 'OVERDUE';
  },

  /**
   * Check if invoice is in terminal state.
   */
  isTerminal(invoice: Invoice | InvoiceSummary): boolean {
    return invoice.status === 'PAID' || invoice.status === 'CANCELLED';
  },

  /**
   * Get payment progress percentage.
   */
  getPaymentProgress(invoice: Invoice | InvoiceSummary): number {
    if (invoice.totalAmount === 0) return 0;
    return Math.min(
      100,
      Math.round((invoice.totalPaid / invoice.totalAmount) * 100)
    );
  },

  /**
   * Format currency amount.
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  },

  /**
   * Get aging bucket color.
   */
  getAgingBucketColor(
    bucket: string
  ): 'green' | 'yellow' | 'orange' | 'red' | 'gray' {
    switch (bucket) {
      case 'Current':
        return 'green';
      case '30 Days':
        return 'yellow';
      case '60 Days':
        return 'orange';
      case '90+ Days':
        return 'red';
      default:
        return 'gray';
    }
  },

  /**
   * Calculate aggregate statistics for a collection of invoices.
   * Excludes cancelled invoices from all calculations.
   */
  calculateStats(invoices: readonly InvoiceSummary[]) {
    const activeInvoices = invoices.filter((inv) => inv.status !== 'CANCELLED');

    return {
      count: activeInvoices.length,
      totalAmount: activeInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      totalPaid: activeInvoices.reduce((sum, inv) => sum + inv.totalPaid, 0),
      outstanding: activeInvoices.reduce((sum, inv) => sum + inv.remainingBalance, 0),
      overdueCount: activeInvoices.filter((inv) => inv.isOverdue).length,
    };
  },
};
