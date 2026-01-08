/**
 * Invoice card component for displaying invoice summary.
 */

import { Card, Icon } from '@/shared/ui';
import type { Invoice } from '../model/invoice';
import { invoiceRules } from '../model/invoice';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { formatDate } from '@/shared/lib/formatting';

interface InvoiceCardProps {
  invoice: Invoice;
  onViewDetails?: () => void;
}

export function InvoiceCard({ invoice, onViewDetails }: InvoiceCardProps) {
  const paymentProgress = invoiceRules.getPaymentProgress(invoice);

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-mono text-lg text-copper-400">
            {invoice.invoiceNumber}
          </h3>
          <p className="text-sm text-steel-400">Job: {invoice.jobCode}</p>
        </div>
        <InvoiceStatusBadge status={invoice.status} />
      </div>

      {/* Amounts */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-steel-400">Before Tax</span>
          <span className="font-mono">
            {invoiceRules.formatAmount(invoice.totalBeforeTax)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-steel-400">Tax ({invoice.taxRate}%)</span>
          <span className="font-mono">
            {invoiceRules.formatAmount(invoice.totalTax)}
          </span>
        </div>
        <div className="flex justify-between font-semibold border-t border-steel-700 pt-2">
          <span>Total</span>
          <span className="font-mono">
            {invoiceRules.formatAmount(invoice.totalAmount)}
          </span>
        </div>
      </div>

      {/* Payment Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-steel-400">Payment Progress</span>
          <span className="text-steel-300">{paymentProgress}%</span>
        </div>
        <div className="h-2 bg-steel-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              paymentProgress === 100 ? 'bg-green-500' : 'bg-copper-500'
            }`}
            style={{ width: `${paymentProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-green-400">
            Paid: {invoiceRules.formatAmount(invoice.totalPaid)}
          </span>
          <span className="text-yellow-400">
            Balance: {invoiceRules.formatAmount(invoice.remainingBalance)}
          </span>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <span className="text-steel-500">Issue Date</span>
          <p>{formatDate(invoice.issueDate)}</p>
        </div>
        <div>
          <span className="text-steel-500">Due Date</span>
          <p className={invoice.isOverdue ? 'text-red-400' : ''}>
            {formatDate(invoice.dueDate)}
            {invoice.isOverdue && (
              <span className="ml-2 text-xs">
                ({invoice.daysOverdue} days overdue)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Aging Bucket */}
      {invoice.remainingBalance > 0 && (
        <div className="flex items-center gap-2 text-sm mb-4">
          <Icon name="clock" className="h-4 w-4 text-steel-500" />
          <span className="text-steel-400">Aging:</span>
          <span
            className={`font-medium text-${invoiceRules.getAgingBucketColor(invoice.agingBucket)}-400`}
          >
            {invoice.agingBucket}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-steel-500 border-t border-steel-700 pt-3">
        <span>
          {invoice.lineItems.length} items · {invoice.payments.length} payments
        </span>
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="text-copper-400 hover:text-copper-300"
          >
            View Details →
          </button>
        )}
      </div>
    </Card>
  );
}
