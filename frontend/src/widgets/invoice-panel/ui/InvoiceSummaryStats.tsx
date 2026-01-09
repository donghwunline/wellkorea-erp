/**
 * Invoice Summary Stats Component
 *
 * Displays summary statistics for invoices in a 4-column grid.
 */

import { useMemo } from 'react';
import { Card } from '@/shared/ui';
import type { InvoiceSummary } from '@/entities/invoice';
import { invoiceRules } from '@/entities/invoice';

export interface InvoiceSummaryStatsProps {
  readonly invoices: readonly InvoiceSummary[];
}

export function InvoiceSummaryStats({ invoices }: InvoiceSummaryStatsProps) {
  const stats = useMemo(() => invoiceRules.calculateStats(invoices), [invoices]);

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card className="p-4">
        <div className="text-sm text-steel-400">Total Invoices</div>
        <div className="mt-1 text-2xl font-bold text-white">{stats.count}</div>
        {stats.overdueCount > 0 && (
          <div className="mt-1 text-xs text-red-400">
            {stats.overdueCount} overdue
          </div>
        )}
      </Card>
      <Card className="p-4">
        <div className="text-sm text-steel-400">Total Amount</div>
        <div className="mt-1 text-2xl font-bold text-copper-400">
          {invoiceRules.formatAmount(stats.totalAmount)}
        </div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-steel-400">Total Paid</div>
        <div className="mt-1 text-2xl font-bold text-green-500">
          {invoiceRules.formatAmount(stats.totalPaid)}
        </div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-steel-400">Outstanding</div>
        <div
          className={`mt-1 text-2xl font-bold ${
            stats.outstanding > 0 ? 'text-yellow-500' : 'text-green-500'
          }`}
        >
          {invoiceRules.formatAmount(stats.outstanding)}
        </div>
      </Card>
    </div>
  );
}
