/**
 * Invoice table component for listing invoices.
 * Read-only display - actions delegated via callbacks.
 */

import { Table, Icon } from '@/shared/ui';
import type { InvoiceSummary } from '../model/invoice';
import { invoiceRules } from '../model/invoice';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { formatDate } from '@/shared/lib/formatting';

interface InvoiceTableProps {
  invoices: InvoiceSummary[];
  onRowClick?: (invoice: InvoiceSummary) => void;
  /** Render custom actions for each row */
  renderActions?: (invoice: InvoiceSummary) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
}

export function InvoiceTable({
  invoices,
  onRowClick,
  renderActions,
  loading = false,
  emptyMessage = 'No invoices found.',
}: InvoiceTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copper-500" />
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="py-12 text-center">
        <Icon name="document" className="mx-auto mb-4 h-12 w-12 text-steel-600" />
        <p className="text-steel-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Invoice #</Table.HeaderCell>
          <Table.HeaderCell>Job Code</Table.HeaderCell>
          <Table.HeaderCell>Issue Date</Table.HeaderCell>
          <Table.HeaderCell>Due Date</Table.HeaderCell>
          <Table.HeaderCell>Status</Table.HeaderCell>
          <Table.HeaderCell className="text-right">Total</Table.HeaderCell>
          <Table.HeaderCell className="text-right">Paid</Table.HeaderCell>
          <Table.HeaderCell className="text-right">Balance</Table.HeaderCell>
          {renderActions && <Table.HeaderCell className="w-20">Actions</Table.HeaderCell>}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {invoices.map(invoice => (
          <Table.Row
            key={invoice.id}
            onClick={onRowClick ? () => onRowClick(invoice) : undefined}
            className={`
              ${onRowClick ? 'cursor-pointer hover:bg-steel-800/50' : ''}
              ${invoice.isOverdue ? 'bg-red-900/10' : ''}
            `}
          >
            <Table.Cell className="font-mono text-copper-400">
              {invoice.invoiceNumber}
            </Table.Cell>
            <Table.Cell className="font-mono text-steel-300">
              {invoice.jobCode}
            </Table.Cell>
            <Table.Cell>{formatDate(invoice.issueDate)}</Table.Cell>
            <Table.Cell>
              <span className={invoice.isOverdue ? 'text-red-400' : ''}>
                {formatDate(invoice.dueDate)}
              </span>
            </Table.Cell>
            <Table.Cell>
              <InvoiceStatusBadge status={invoice.status} />
            </Table.Cell>
            <Table.Cell className="text-right font-mono">
              {invoiceRules.formatAmount(invoice.totalAmount)}
            </Table.Cell>
            <Table.Cell className="text-right font-mono text-green-400">
              {invoiceRules.formatAmount(invoice.totalPaid)}
            </Table.Cell>
            <Table.Cell className="text-right font-mono">
              <span className={invoice.remainingBalance > 0 ? 'text-yellow-400' : 'text-green-400'}>
                {invoiceRules.formatAmount(invoice.remainingBalance)}
              </span>
            </Table.Cell>
            {renderActions && (
              <Table.Cell onClick={e => e.stopPropagation()}>
                {renderActions(invoice)}
              </Table.Cell>
            )}
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}
