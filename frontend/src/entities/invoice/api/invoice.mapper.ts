/**
 * Invoice API response types and mappers.
 * Response types are internal - not exported from entity barrel.
 */

import type {
  Invoice,
  InvoiceLineItem,
  InvoiceSummary,
  Payment,
} from '../model/invoice';
import type { InvoiceStatus } from '../model/invoice-status';
import type { PaymentMethod } from '../model/payment-method';

/**
 * Command result for write operations.
 */
export interface CommandResult {
  id: number;
  message: string;
}

/**
 * Payment command result.
 */
export interface PaymentCommandResult {
  id: number | null;
  invoiceId: number;
  remainingBalance: number;
  message: string;
}

/**
 * Line item response from backend.
 */
interface InvoiceLineItemResponse {
  id: number;
  productId: number;
  productName: string;
  productSku: string | null;
  quantityInvoiced: number;
  unitPrice: number;
  lineTotal: number;
}

/**
 * Payment response from backend.
 */
interface PaymentResponse {
  id: number;
  invoiceId: number;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentMethodLabel: string;
  referenceNumber: string | null;
  notes: string | null;
  recordedById: number;
  recordedByName: string;
  createdAt: string;
}

/**
 * Invoice detail response from backend (InvoiceDetailView).
 */
export interface InvoiceDetailResponse {
  id: number;
  projectId: number;
  jobCode: string;
  deliveryId: number | null;
  invoiceNumber: string;
  issueDate: string;
  status: InvoiceStatus;
  statusLabelKo: string;
  totalBeforeTax: number;
  taxRate: number;
  totalTax: number;
  totalAmount: number;
  totalPaid: number;
  remainingBalance: number;
  dueDate: string;
  notes: string | null;
  createdById: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  issuedToCustomerDate: string | null;
  isOverdue: boolean;
  daysOverdue: number;
  agingBucket: string;
  lineItems: InvoiceLineItemResponse[];
  payments: PaymentResponse[];
}

/**
 * Invoice summary response from backend (InvoiceSummaryView).
 */
export interface InvoiceSummaryResponse {
  id: number;
  projectId: number;
  jobCode: string;
  invoiceNumber: string;
  issueDate: string;
  status: InvoiceStatus;
  statusLabelKo: string;
  totalAmount: number;
  totalPaid: number;
  remainingBalance: number;
  dueDate: string;
  isOverdue: boolean;
  agingBucket: string;
  lineItemCount: number;
  paymentCount: number;
}

/**
 * Mappers for converting API responses to domain models.
 */
export const invoiceMapper = {
  /**
   * Map line item response to domain model.
   */
  toLineItem(response: InvoiceLineItemResponse): InvoiceLineItem {
    return {
      id: response.id,
      productId: response.productId,
      productName: response.productName,
      productSku: response.productSku,
      quantityInvoiced: response.quantityInvoiced,
      unitPrice: response.unitPrice,
      lineTotal: response.lineTotal,
    };
  },

  /**
   * Map payment response to domain model.
   */
  toPayment(response: PaymentResponse): Payment {
    return {
      id: response.id,
      invoiceId: response.invoiceId,
      paymentDate: response.paymentDate,
      amount: response.amount,
      paymentMethod: response.paymentMethod,
      paymentMethodLabel: response.paymentMethodLabel,
      referenceNumber: response.referenceNumber,
      notes: response.notes,
      recordedById: response.recordedById,
      recordedByName: response.recordedByName,
      createdAt: response.createdAt,
    };
  },

  /**
   * Map detail response to Invoice domain model.
   */
  toDomain(response: InvoiceDetailResponse): Invoice {
    return {
      id: response.id,
      projectId: response.projectId,
      jobCode: response.jobCode,
      deliveryId: response.deliveryId,
      invoiceNumber: response.invoiceNumber,
      issueDate: response.issueDate,
      status: response.status,
      statusLabel: response.statusLabelKo,
      totalBeforeTax: response.totalBeforeTax,
      taxRate: response.taxRate,
      totalTax: response.totalTax,
      totalAmount: response.totalAmount,
      totalPaid: response.totalPaid,
      remainingBalance: response.remainingBalance,
      dueDate: response.dueDate,
      notes: response.notes,
      createdById: response.createdById,
      createdByName: response.createdByName,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      issuedToCustomerDate: response.issuedToCustomerDate,
      isOverdue: response.isOverdue,
      daysOverdue: response.daysOverdue,
      agingBucket: response.agingBucket,
      lineItems: response.lineItems.map(invoiceMapper.toLineItem),
      payments: response.payments.map(invoiceMapper.toPayment),
    };
  },

  /**
   * Map summary response to InvoiceSummary domain model.
   */
  toSummary(response: InvoiceSummaryResponse): InvoiceSummary {
    return {
      id: response.id,
      projectId: response.projectId,
      jobCode: response.jobCode,
      invoiceNumber: response.invoiceNumber,
      issueDate: response.issueDate,
      status: response.status,
      statusLabel: response.statusLabelKo,
      totalAmount: response.totalAmount,
      totalPaid: response.totalPaid,
      remainingBalance: response.remainingBalance,
      dueDate: response.dueDate,
      isOverdue: response.isOverdue,
      agingBucket: response.agingBucket,
      lineItemCount: response.lineItemCount,
      paymentCount: response.paymentCount,
    };
  },
};
