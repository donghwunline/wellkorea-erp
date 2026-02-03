/**
 * Vendor payment history table component.
 * Displays list of payments for an accounts payable record.
 * Payment method labels are handled via i18n.
 */

import { useTranslation } from 'react-i18next';
import { Icon, Table } from '@/shared/ui';
import { Money } from '@/shared/lib/formatting/money';
import { formatDate } from '@/shared/lib/formatting';
import type { VendorPayment } from '../model/vendor-payment';

interface VendorPaymentHistoryTableProps {
  payments: readonly VendorPayment[];
  currency?: string;
  loading?: boolean;
  emptyMessage?: string;
}

export function VendorPaymentHistoryTable({
  payments,
  currency = 'KRW',
  loading = false,
  emptyMessage,
}: VendorPaymentHistoryTableProps) {
  const { t } = useTranslation('entities');
  const defaultEmptyMessage = t('accountsPayable.paymentHistoryTable.empty');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-copper-500" />
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="py-8 text-center">
        <Icon name="cash" className="mx-auto mb-3 h-10 w-10 text-steel-600" />
        <p className="text-steel-400 text-sm">{emptyMessage ?? defaultEmptyMessage}</p>
      </div>
    );
  }

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>{t('accountsPayable.paymentHistoryTable.headers.date')}</Table.HeaderCell>
          <Table.HeaderCell>{t('accountsPayable.paymentHistoryTable.headers.method')}</Table.HeaderCell>
          <Table.HeaderCell className="text-right">{t('accountsPayable.paymentHistoryTable.headers.amount')}</Table.HeaderCell>
          <Table.HeaderCell>{t('accountsPayable.paymentHistoryTable.headers.reference')}</Table.HeaderCell>
          <Table.HeaderCell>{t('accountsPayable.paymentHistoryTable.headers.recordedBy')}</Table.HeaderCell>
          <Table.HeaderCell>{t('accountsPayable.paymentHistoryTable.headers.notes')}</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {payments.map(payment => (
          <Table.Row key={payment.id}>
            <Table.Cell>{formatDate(payment.paymentDate)}</Table.Cell>
            <Table.Cell>
              {t(`accountsPayable.paymentMethod.${payment.paymentMethod}`)}
            </Table.Cell>
            <Table.Cell className="text-right font-mono text-green-400">
              {Money.format(payment.amount, { currency })}
            </Table.Cell>
            <Table.Cell className="font-mono text-steel-400">
              {payment.referenceNumber || '-'}
            </Table.Cell>
            <Table.Cell>{payment.recordedByName}</Table.Cell>
            <Table.Cell className="text-steel-400 max-w-xs truncate">
              {payment.notes || '-'}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}
