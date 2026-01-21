/**
 * Invoice Detail Page
 *
 * Displays invoice details, line items, payments, and actions.
 * Allows issuing, cancelling, and recording payments.
 *
 * Route: /invoices/:id
 *
 * FSD Architecture:
 * - Page layer: URL params + layout assembly
 * - Uses entities/invoice for query hooks and UI
 * - Uses features/invoice for mutations (issue, cancel)
 * - Uses features/payment for recording payments
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Icon,
  LoadingState,
  PageHeader,
  Table,
  Modal,
  FormField,
  Input,
} from '@/shared/ui';
import {
  invoiceQueries,
  InvoiceStatusBadge,
  PaymentHistoryTable,
  invoiceRules,
  getPaymentMethodOptions,
  type PaymentMethod,
} from '@/entities/invoice';
import { useIssueInvoice } from '@/features/invoice/issue';
import { useCancelInvoice } from '@/features/invoice/cancel';
import { useRecordPayment } from '@/features/payment/record';
import { formatDate, formatDateTime, formatCurrency } from '@/shared/lib/formatting';
import { useAuth } from '@/entities/auth';

// Payment form state
interface PaymentFormState {
  paymentDate: string;
  amount: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  notes: string;
}

const defaultPaymentForm: PaymentFormState = {
  paymentDate: new Date().toISOString().split('T')[0],
  amount: '',
  paymentMethod: 'BANK_TRANSFER',
  referenceNumber: '',
  notes: '',
};

export function InvoiceDetailPage() {
  const { t } = useTranslation('invoices');
  const { t: tCommon } = useTranslation('common');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const invoiceId = Number(id);
  const { hasAnyRole } = useAuth();

  // Check permissions
  const canManageInvoices = hasAnyRole(['ROLE_ADMIN', 'ROLE_FINANCE']);

  // Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(defaultPaymentForm);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch invoice detail
  const {
    data: invoice,
    isLoading,
    error: fetchError,
    refetch,
  } = useQuery(invoiceQueries.detail(invoiceId));

  // Mutations
  const { mutate: issueInvoice, isPending: isIssuing } = useIssueInvoice({
    onSuccess: () => {
      refetch();
    },
    onError: (err) => {
      setFormError(err.message);
    },
  });

  const { mutate: cancelInvoice, isPending: isCancelling } = useCancelInvoice({
    onSuccess: () => {
      setShowCancelConfirm(false);
      refetch();
    },
    onError: (err) => {
      setFormError(err.message);
    },
  });

  const { mutate: recordPayment, isPending: isRecordingPayment } = useRecordPayment({
    onSuccess: () => {
      setShowPaymentModal(false);
      setPaymentForm(defaultPaymentForm);
      refetch();
    },
    onError: (err) => {
      setFormError(err.message);
    },
  });

  // Handle issue invoice
  const handleIssue = useCallback(() => {
    setFormError(null);
    issueInvoice(invoiceId);
  }, [invoiceId, issueInvoice]);

  // Handle cancel invoice
  const handleCancel = useCallback(() => {
    setFormError(null);
    cancelInvoice(invoiceId);
  }, [invoiceId, cancelInvoice]);

  // Handle payment form change
  const handlePaymentFormChange = useCallback(
    (field: keyof PaymentFormState, value: string) => {
      setPaymentForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Handle payment submit
  const handlePaymentSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);

      const amount = parseFloat(paymentForm.amount);
      if (isNaN(amount) || amount <= 0) {
        setFormError(t('validation.invalidAmount'));
        return;
      }

      if (!paymentForm.paymentDate) {
        setFormError(t('validation.paymentDateRequired'));
        return;
      }

      // Check if payment exceeds remaining balance
      if (invoice && amount > invoice.remainingBalance) {
        setFormError(
          t('validation.exceedsBalance', { amount: formatCurrency(amount), balance: formatCurrency(invoice.remainingBalance) })
        );
        return;
      }

      recordPayment({
        invoiceId,
        paymentDate: paymentForm.paymentDate,
        amount,
        paymentMethod: paymentForm.paymentMethod,
        referenceNumber: paymentForm.referenceNumber || null,
        notes: paymentForm.notes || null,
      });
    },
    [invoiceId, paymentForm, invoice, recordPayment, t]
  );

  // Open payment modal with pre-filled remaining balance
  const openPaymentModal = useCallback(() => {
    if (invoice) {
      setPaymentForm({
        ...defaultPaymentForm,
        amount: invoice.remainingBalance.toString(),
      });
    }
    setShowPaymentModal(true);
    setFormError(null);
  }, [invoice]);

  // Payment method options
  const paymentMethodOptions = getPaymentMethodOptions(true).map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Card>
          <LoadingState message={t('view.loading')} />
        </Card>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Alert variant="error">{t('view.loadError')}: {fetchError.message}</Alert>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/invoices')}>
          {t('actions.backToList')}
        </Button>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Alert variant="error">{t('view.notFound')}</Alert>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/invoices')}>
          {t('actions.backToList')}
        </Button>
      </div>
    );
  }

  const paymentProgress = invoiceRules.getPaymentProgress(invoice);

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title
          title={invoice.invoiceNumber}
          description={`${t('fields.project')}: ${invoice.jobCode}`}
        />
        <PageHeader.Actions>
          <Button variant="ghost" onClick={() => navigate('/invoices')}>
            {t('actions.backToList')}
          </Button>
          {canManageInvoices && invoiceRules.canIssue(invoice) && (
            <Button onClick={handleIssue} disabled={isIssuing}>
              {isIssuing ? t('actions.issuing') : t('actions.issue')}
            </Button>
          )}
          {canManageInvoices && invoiceRules.canReceivePayment(invoice) && (
            <Button onClick={openPaymentModal}>
              <Icon name="plus" className="mr-2 h-4 w-4" />
              {t('actions.recordPayment')}
            </Button>
          )}
          {canManageInvoices && invoiceRules.canCancel(invoice) && (
            <Button variant="danger" onClick={() => setShowCancelConfirm(true)}>
              {t('actions.cancel')}
            </Button>
          )}
        </PageHeader.Actions>
      </PageHeader>

      {/* Error Alert */}
      {formError && (
        <Alert variant="error" className="mb-6" onClose={() => setFormError(null)}>
          {formError}
        </Alert>
      )}

      {/* Invoice Info Card */}
      <Card className="mb-6 p-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <div>
            <div className="text-sm text-steel-400">{t('fields.status')}</div>
            <div className="mt-1">
              <InvoiceStatusBadge status={invoice.status} />
            </div>
          </div>
          <div>
            <div className="text-sm text-steel-400">{t('fields.issueDate')}</div>
            <div className="mt-1 text-white">{formatDate(invoice.issueDate)}</div>
          </div>
          <div>
            <div className="text-sm text-steel-400">{t('fields.dueDate')}</div>
            <div className={`mt-1 ${invoice.isOverdue ? 'text-red-400' : 'text-white'}`}>
              {formatDate(invoice.dueDate)}
              {invoice.isOverdue && (
                <span className="ml-2 text-xs">({t('view.daysOverdue', { days: invoice.daysOverdue })})</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-sm text-steel-400">{t('fields.project')}</div>
            <div className="mt-1">
              <Link
                to={`/projects/${invoice.projectId}`}
                className="text-copper-400 hover:underline"
              >
                {invoice.jobCode}
              </Link>
            </div>
          </div>
        </div>

        {/* Payment Progress */}
        <div className="mt-6 border-t border-steel-700 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-steel-400">{t('view.paymentProgress')}</span>
            <span className="text-steel-300">{paymentProgress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-steel-700">
            <div
              className={`h-full transition-all ${
                paymentProgress === 100 ? 'bg-green-500' : 'bg-copper-500'
              }`}
              style={{ width: `${paymentProgress}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-green-400">
              {t('view.paid')}: {invoiceRules.formatAmount(invoice.totalPaid)}
            </span>
            <span className="text-yellow-400">
              {t('view.remaining')}: {invoiceRules.formatAmount(invoice.remainingBalance)}
            </span>
          </div>
        </div>

        {/* Aging */}
        {invoice.remainingBalance > 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Icon name="clock" className="h-4 w-4 text-steel-500" />
            <span className="text-steel-400">{t('view.aging')}:</span>
            <span
              className={`font-medium text-${invoiceRules.getAgingBucketColor(invoice.agingBucket)}-400`}
            >
              {invoice.agingBucket}
            </span>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-4 border-t border-steel-700 pt-4">
            <div className="text-sm text-steel-400">{t('fields.notes')}</div>
            <div className="mt-1 text-steel-300">{invoice.notes}</div>
          </div>
        )}

        {/* Timestamps */}
        <div className="mt-4 border-t border-steel-700 pt-4 text-xs text-steel-500">
          {tCommon('fields.createdBy')} {invoice.createdByName}, {formatDateTime(invoice.createdAt)} | {tCommon('fields.updatedAt')}:{' '}
          {formatDateTime(invoice.updatedAt)}
        </div>
      </Card>

      {/* Amounts Card */}
      <Card className="mb-6 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">{t('view.amounts')}</h3>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <div>
            <div className="text-sm text-steel-400">{t('fields.subtotal')}</div>
            <div className="mt-1 font-mono text-lg text-white">
              {invoiceRules.formatAmount(invoice.totalBeforeTax)}
            </div>
          </div>
          <div>
            <div className="text-sm text-steel-400">{t('fields.tax')} ({invoice.taxRate}%)</div>
            <div className="mt-1 font-mono text-lg text-white">
              {invoiceRules.formatAmount(invoice.totalTax)}
            </div>
          </div>
          <div>
            <div className="text-sm text-steel-400">{t('fields.total')}</div>
            <div className="mt-1 font-mono text-lg font-bold text-copper-400">
              {invoiceRules.formatAmount(invoice.totalAmount)}
            </div>
          </div>
          <div>
            <div className="text-sm text-steel-400">{t('fields.balanceDue')}</div>
            <div
              className={`mt-1 font-mono text-lg font-bold ${
                invoice.remainingBalance > 0 ? 'text-yellow-400' : 'text-green-400'
              }`}
            >
              {invoiceRules.formatAmount(invoice.remainingBalance)}
            </div>
          </div>
        </div>
      </Card>

      {/* Line Items Card */}
      <Card className="mb-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{t('view.lineItems')}</h3>
          <span className="text-steel-400">{t('view.items', { count: invoice.lineItems.length })}</span>
        </div>

        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>{t('lineItems.product')}</Table.HeaderCell>
              <Table.HeaderCell>SKU</Table.HeaderCell>
              <Table.HeaderCell className="text-right">{t('lineItems.quantity')}</Table.HeaderCell>
              <Table.HeaderCell className="text-right">{t('lineItems.unitPrice')}</Table.HeaderCell>
              <Table.HeaderCell className="text-right">{t('lineItems.amount')}</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {invoice.lineItems.map((item) => (
              <Table.Row key={item.id}>
                <Table.Cell className="font-medium text-white">{item.productName}</Table.Cell>
                <Table.Cell className="text-steel-400">{item.productSku || '-'}</Table.Cell>
                <Table.Cell className="text-right">{item.quantityInvoiced}</Table.Cell>
                <Table.Cell className="text-right font-mono">
                  {formatCurrency(item.unitPrice)}
                </Table.Cell>
                <Table.Cell className="text-right font-mono font-medium text-copper-400">
                  {formatCurrency(item.lineTotal)}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
          <tfoot>
            <tr className="border-t border-steel-700">
              <td colSpan={4} className="px-4 py-3 text-right font-medium text-white">
                {t('fields.total')}:
              </td>
              <td className="px-4 py-3 text-right font-mono font-bold text-copper-400">
                {invoiceRules.formatAmount(invoice.totalBeforeTax)}
              </td>
            </tr>
          </tfoot>
        </Table>
      </Card>

      {/* Payment History Card */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{t('view.paymentHistory')}</h3>
          <span className="text-steel-400">{t('view.payments', { count: invoice.payments.length })}</span>
        </div>

        <PaymentHistoryTable
          payments={invoice.payments}
          emptyMessage={t('view.noPayments')}
        />
      </Card>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={t('payment.record.title')}
      >
        <form onSubmit={handlePaymentSubmit}>
          <div className="space-y-4">
            <FormField label={t('payment.record.date')} required>
              <Input
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) => handlePaymentFormChange('paymentDate', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </FormField>

            <FormField label={t('payment.record.amount')} required>
              <Input
                type="number"
                value={paymentForm.amount}
                onChange={(e) => handlePaymentFormChange('amount', e.target.value)}
                min={0}
                max={invoice.remainingBalance}
                step="1"
                placeholder={t('payment.record.amount')}
                required
              />
              <p className="mt-1 text-xs text-steel-500">
                {t('payment.record.remainingBalance', { amount: invoiceRules.formatAmount(invoice.remainingBalance) })}
              </p>
            </FormField>

            <FormField label={t('payment.record.method')} required>
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => handlePaymentFormChange('paymentMethod', e.target.value)}
                className="w-full rounded-md border border-steel-600 bg-steel-800 px-3 py-2 text-sm text-white focus:border-copper-500 focus:outline-none focus:ring-1 focus:ring-copper-500"
              >
                {paymentMethodOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label={t('payment.record.reference')}>
              <Input
                type="text"
                value={paymentForm.referenceNumber}
                onChange={(e) => handlePaymentFormChange('referenceNumber', e.target.value)}
                placeholder={t('payment.record.referenceHint')}
              />
            </FormField>

            <FormField label={t('payment.record.notes')}>
              <textarea
                value={paymentForm.notes}
                onChange={(e) => handlePaymentFormChange('notes', e.target.value)}
                placeholder={t('payment.record.notesHint')}
                rows={2}
                className="w-full rounded-md border border-steel-600 bg-steel-800 px-3 py-2 text-sm text-white placeholder-steel-500 focus:border-copper-500 focus:outline-none focus:ring-1 focus:ring-copper-500"
              />
            </FormField>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setShowPaymentModal(false)}>
              {tCommon('buttons.cancel')}
            </Button>
            <Button type="submit" disabled={isRecordingPayment}>
              {isRecordingPayment ? t('payment.record.recording') : t('payment.record.submit')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title={t('cancel.title')}
      >
        <div className="mb-6">
          <p className="text-steel-300">
            {t('cancel.confirm', { number: invoice.invoiceNumber })}
          </p>
          <p className="mt-2 text-sm text-steel-500">{t('cancel.warning')}</p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowCancelConfirm(false)}>
            {t('actions.keepInvoice')}
          </Button>
          <Button variant="danger" onClick={handleCancel} disabled={isCancelling}>
            {isCancelling ? t('actions.cancelling') : t('actions.cancel')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
