/**
 * AR (Accounts Receivable) Report API.
 */

import { httpClient } from '@/shared/api';
import { queryOptions } from '@tanstack/react-query';
import type { InvoiceStatus } from '../model/invoice-status';

const AR_REPORT_ENDPOINT = '/reports/ar';

/**
 * AR Invoice entry in the report.
 */
export interface ARInvoice {
  id: number;
  invoiceNumber: string;
  projectId: number;
  jobCode: string;
  customerId: number | null;
  customerName: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  totalAmount: number;
  totalPaid: number;
  remainingBalance: number;
  daysOverdue: number;
  agingBucket: string;
}

/**
 * Customer AR summary.
 */
export interface CustomerAR {
  customerId: number;
  customerName: string;
  totalOutstanding: number;
  invoiceCount: number;
}

/**
 * AR Report response from backend.
 */
export interface ARReport {
  totalOutstanding: number;
  currentAmount: number;
  days30Amount: number;
  days60Amount: number;
  days90PlusAmount: number;
  totalInvoices: number;
  currentCount: number;
  days30Count: number;
  days60Count: number;
  days90PlusCount: number;
  byCustomer: CustomerAR[];
  invoices: ARInvoice[];
}

/**
 * Fetch AR aging report.
 */
export async function getARReport(): Promise<ARReport> {
  return httpClient.get<ARReport>(AR_REPORT_ENDPOINT);
}

/**
 * Query factory for AR report.
 */
export const arReportQueries = {
  /**
   * Base query key.
   */
  all: () => ['reports', 'ar'] as const,

  /**
   * Query options for fetching AR report.
   */
  report: () =>
    queryOptions({
      queryKey: arReportQueries.all(),
      queryFn: getARReport,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }),
};

/**
 * AR Report business rules.
 */
export const arReportRules = {
  /**
   * Get total percentage for an aging bucket.
   */
  getBucketPercentage(bucketAmount: number, totalAmount: number): number {
    if (totalAmount === 0) return 0;
    return Math.round((bucketAmount / totalAmount) * 100);
  },

  /**
   * Get color for aging bucket.
   */
  getBucketColor(bucket: string): 'green' | 'yellow' | 'orange' | 'red' | 'gray' {
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
   * Format currency.
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  },

  /**
   * Get severity level based on days overdue.
   */
  getSeverity(daysOverdue: number): 'low' | 'medium' | 'high' | 'critical' {
    if (daysOverdue <= 0) return 'low';
    if (daysOverdue <= 30) return 'medium';
    if (daysOverdue <= 60) return 'high';
    return 'critical';
  },
};
