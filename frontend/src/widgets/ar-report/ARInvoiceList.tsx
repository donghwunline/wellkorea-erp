/**
 * AR Invoice List Widget
 *
 * Displays list of invoices in the AR report with aging information.
 *
 * FSD Architecture:
 * - Widget layer: Composite UI combining entity data with visual representation
 * - Uses entities/invoice for AR report data
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Icon, FilterBar, Badge } from '@/shared/ui';
import type { ARInvoice } from '@/entities/invoice';
import { arReportRules, InvoiceStatusBadge } from '@/entities/invoice';
import { formatDate } from '@/shared/lib/formatting';

interface ARInvoiceListProps {
  invoices: ARInvoice[];
  loading?: boolean;
}

type AgingFilter = 'all' | 'current' | '30' | '60' | '90+';
type SortField = 'dueDate' | 'amount' | 'daysOverdue' | 'customer';
type SortOrder = 'asc' | 'desc';

const AGING_OPTIONS = [
  { value: 'all', label: 'All Invoices' },
  { value: 'current', label: 'Current' },
  { value: '30', label: '1-30 Days' },
  { value: '60', label: '31-60 Days' },
  { value: '90+', label: '60+ Days' },
];

export function ARInvoiceList({ invoices, loading = false }: ARInvoiceListProps) {
  const navigate = useNavigate();
  const [agingFilter, setAgingFilter] = useState<AgingFilter>('all');
  const [sortField, setSortField] = useState<SortField>('daysOverdue');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filter and sort invoices
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    // Apply aging filter
    if (agingFilter !== 'all') {
      result = result.filter((inv) => {
        switch (agingFilter) {
          case 'current':
            return inv.agingBucket === 'Current';
          case '30':
            return inv.agingBucket === '30 Days';
          case '60':
            return inv.agingBucket === '60 Days';
          case '90+':
            return inv.agingBucket === '90+ Days';
          default:
            return true;
        }
      });
    }

    // Apply sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'dueDate':
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'amount':
          comparison = a.remainingBalance - b.remainingBalance;
          break;
        case 'daysOverdue':
          comparison = a.daysOverdue - b.daysOverdue;
          break;
        case 'customer':
          comparison = a.customerName.localeCompare(b.customerName);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [invoices, agingFilter, sortField, sortOrder]);

  // Handle sort change
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(field);
        setSortOrder('desc');
      }
    },
    [sortField, sortOrder]
  );

  // Handle row click
  const handleRowClick = useCallback(
    (invoice: ARInvoice) => {
      navigate(`/invoices/${invoice.id}`);
    },
    [navigate]
  );

  // Render sort indicator - using CSS rotation for ascending since chevron-up doesn't exist
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return (
      <Icon
        name="chevron-down"
        className={`ml-1 inline h-3 w-3 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
      />
    );
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-copper-500" />
        </div>
      </Card>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Outstanding Invoices</h3>
        <div className="py-8 text-center">
          <Icon name="check-circle" className="mx-auto mb-3 h-10 w-10 text-green-500" />
          <p className="text-sm text-steel-400">No outstanding invoices</p>
          <p className="mt-1 text-xs text-steel-500">All invoices have been paid</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Outstanding Invoices</h3>
        <span className="text-sm text-steel-400">
          {filteredInvoices.length} of {invoices.length} invoices
        </span>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <FilterBar>
          <FilterBar.Field label="Aging">
            <FilterBar.Select
              options={AGING_OPTIONS}
              value={agingFilter}
              onValueChange={(v) => setAgingFilter(v as AgingFilter)}
            />
          </FilterBar.Field>
        </FilterBar>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-steel-700">
              <th className="px-4 py-3 text-left text-sm font-medium text-steel-400">
                Invoice
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-left text-sm font-medium text-steel-400 hover:text-white"
                onClick={() => handleSort('customer')}
              >
                Customer
                {renderSortIndicator('customer')}
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-left text-sm font-medium text-steel-400 hover:text-white"
                onClick={() => handleSort('dueDate')}
              >
                Due Date
                {renderSortIndicator('dueDate')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-steel-400">Status</th>
              <th
                className="cursor-pointer px-4 py-3 text-right text-sm font-medium text-steel-400 hover:text-white"
                onClick={() => handleSort('amount')}
              >
                Balance
                {renderSortIndicator('amount')}
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-right text-sm font-medium text-steel-400 hover:text-white"
                onClick={() => handleSort('daysOverdue')}
              >
                Days Overdue
                {renderSortIndicator('daysOverdue')}
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-steel-400">Aging</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => {
              const severity = arReportRules.getSeverity(invoice.daysOverdue);
              const bucketColor = arReportRules.getBucketColor(invoice.agingBucket);

              return (
                <tr
                  key={invoice.id}
                  className="cursor-pointer border-b border-steel-800 hover:bg-steel-800/50"
                  onClick={() => handleRowClick(invoice)}
                >
                  <td className="px-4 py-3">
                    <div className="font-mono text-copper-400">{invoice.invoiceNumber}</div>
                    <div className="text-xs text-steel-500">{invoice.jobCode}</div>
                  </td>
                  <td className="px-4 py-3 text-white">{invoice.customerName}</td>
                  <td className="px-4 py-3">
                    <div
                      className={
                        invoice.daysOverdue > 0 ? 'text-red-400' : 'text-steel-300'
                      }
                    >
                      {formatDate(invoice.dueDate)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <InvoiceStatusBadge status={invoice.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-yellow-400">
                    {arReportRules.formatCurrency(invoice.remainingBalance)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {invoice.daysOverdue > 0 ? (
                      <span
                        className={`font-medium ${
                          severity === 'critical'
                            ? 'text-red-400'
                            : severity === 'high'
                              ? 'text-orange-400'
                              : severity === 'medium'
                                ? 'text-yellow-400'
                                : 'text-steel-400'
                        }`}
                      >
                        {invoice.daysOverdue} days
                      </span>
                    ) : (
                      <span className="text-green-400">On time</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant={
                        bucketColor === 'green'
                          ? 'success'
                          : bucketColor === 'yellow'
                            ? 'warning'
                            : bucketColor === 'orange' || bucketColor === 'red'
                              ? 'danger'
                              : 'steel'
                      }
                    >
                      {invoice.agingBucket}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
