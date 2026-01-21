/**
 * AR Customer Table Widget
 *
 * Displays outstanding amounts by customer.
 *
 * FSD Architecture:
 * - Widget layer: Composite UI combining entity data with visual representation
 * - Uses entities/invoice for AR report data
 */

import { useTranslation } from 'react-i18next';
import { Card, Table, Icon } from '@/shared/ui';
import type { CustomerAR } from '@/entities/invoice';
import { arReportRules } from '@/entities/invoice';

interface ARCustomerTableProps {
  customers: CustomerAR[];
  loading?: boolean;
}

export function ARCustomerTable({ customers, loading = false }: ARCustomerTableProps) {
  const { t } = useTranslation('widgets');

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-copper-500" />
        </div>
      </Card>
    );
  }

  // Sort by outstanding amount descending
  const sortedCustomers = [...customers].sort(
    (a, b) => b.totalOutstanding - a.totalOutstanding
  );

  // Calculate total for percentage
  const total = customers.reduce((sum, c) => sum + c.totalOutstanding, 0);

  if (sortedCustomers.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">{t('arCustomerTable.title')}</h3>
        <div className="py-8 text-center">
          <Icon name="users" className="mx-auto mb-3 h-10 w-10 text-steel-600" />
          <p className="text-sm text-steel-400">{t('arCustomerTable.empty')}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{t('arCustomerTable.title')}</h3>
        <span className="text-sm text-steel-400">{t('arCustomerTable.customerCount', { count: sortedCustomers.length })}</span>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>{t('arCustomerTable.table.customer')}</Table.HeaderCell>
            <Table.HeaderCell className="text-right">{t('arCustomerTable.table.invoices')}</Table.HeaderCell>
            <Table.HeaderCell className="text-right">{t('arCustomerTable.table.outstanding')}</Table.HeaderCell>
            <Table.HeaderCell className="text-right">{t('arCustomerTable.table.percentOfTotal')}</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {sortedCustomers.map((customer) => {
            const percentage = arReportRules.getBucketPercentage(
              customer.totalOutstanding,
              total
            );
            return (
              <Table.Row key={customer.customerId}>
                <Table.Cell className="font-medium text-white">
                  {customer.customerName}
                </Table.Cell>
                <Table.Cell className="text-right text-steel-400">
                  {customer.invoiceCount}
                </Table.Cell>
                <Table.Cell className="text-right font-mono text-copper-400">
                  {arReportRules.formatCurrency(customer.totalOutstanding)}
                </Table.Cell>
                <Table.Cell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-2 w-16 overflow-hidden rounded-full bg-steel-700">
                      <div
                        className="h-full bg-copper-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-sm text-steel-400">
                      {percentage}%
                    </span>
                  </div>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </Card>
  );
}
