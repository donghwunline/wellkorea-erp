/**
 * Invoice Detail Modal
 *
 * Modal for viewing invoice details with payment recording and actions.
 * Preserves user context by staying on the project page.
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  FormField,
  Icon,
  Input,
  LoadingState,
  Modal,
  ModalActions,
  Table,
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

export interface InvoiceDetailModalProps {
  /** Invoice ID to display */
  readonly invoiceId: number;
  /** Whether modal is open */
  readonly isOpen: boolean;
  /** Callback when modal should close */
  readonly onClose: () => void;
  /** Optional callback after successful action */
  readonly onSuccess?: () => void;
}

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

export function InvoiceDetailModal({
  invoiceId,
  isOpen,
  onClose,
  onSuccess,
}: InvoiceDetailModalProps) {
  const { t } = useTranslation('widgets');
  const { hasAnyRole } = useAuth();

  // Check permissions
  const canManageInvoices = hasAnyRole(['ROLE_ADMIN', 'ROLE_FINANCE']);

  // Modal state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(defaultPaymentForm);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch invoice detail
  const {
    data: invoice,
    isLoading,
    error: fetchError,
    refetch,
  } = useQuery({
    ...invoiceQueries.detail(invoiceId),
    enabled: isOpen && invoiceId > 0,
  });

  // Mutations
  const { mutate: issueInvoice, isPending: isIssuing } = useIssueInvoice({
    onSuccess: () => {
      refetch();
      onSuccess?.();
    },
    onError: err => {
      setFormError(err.message);
    },
  });

  const { mutate: cancelInvoice, isPending: isCancelling } = useCancelInvoice({
    onSuccess: () => {
      setShowCancelConfirm(false);
      refetch();
      onSuccess?.();
    },
    onError: err => {
      setFormError(err.message);
    },
  });

  const { mutate: recordPayment, isPending: isRecordingPayment } = useRecordPayment({
    onSuccess: () => {
      setShowPaymentForm(false);
      setPaymentForm(defaultPaymentForm);
      refetch();
      onSuccess?.();
    },
    onError: err => {
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
      setPaymentForm(prev => ({ ...prev, [field]: value }));
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
        setFormError(t('invoiceDetailModal.validation.invalidAmount'));
        return;
      }

      if (!paymentForm.paymentDate) {
        setFormError(t('invoiceDetailModal.validation.enterPaymentDate'));
        return;
      }

      // Check if payment exceeds remaining balance
      if (invoice && amount > invoice.remainingBalance) {
        setFormError(
          t('invoiceDetailModal.validation.exceedsBalance', { amount: formatCurrency(amount), remaining: formatCurrency(invoice.remainingBalance) })
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
    [invoiceId, paymentForm, invoice, recordPayment]
  );

  // Open payment form with pre-filled remaining balance
  const openPaymentForm = useCallback(() => {
    if (invoice) {
      setPaymentForm({
        ...defaultPaymentForm,
        amount: invoice.remainingBalance.toString(),
      });
    }
    setShowPaymentForm(true);
    setFormError(null);
  }, [invoice]);

  // Payment method options
  const paymentMethodOptions = getPaymentMethodOptions(true).map(opt => ({
    value: opt.value,
    label: opt.label,
  }));

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('invoiceDetailModal.title')} size="lg">
        <LoadingState message={t('invoiceDetailModal.loading')} />
      </Modal>
    );
  }

  if (fetchError) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('invoiceDetailModal.title')} size="lg">
        <Alert variant="error">{t('invoiceDetailModal.loadError', { error: fetchError.message })}</Alert>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            {t('invoiceDetailModal.close')}
          </Button>
        </ModalActions>
      </Modal>
    );
  }

  if (!invoice) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('invoiceDetailModal.title')} size="lg">
        <Alert variant="error">{t('invoiceDetailModal.notFound')}</Alert>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            {t('invoiceDetailModal.close')}
          </Button>
        </ModalActions>
      </Modal>
    );
  }

  const paymentProgress = invoiceRules.getPaymentProgress(invoice);

  // Cancel Confirmation View
  if (showCancelConfirm) {
    return (
      <Modal isOpen={isOpen} onClose={() => setShowCancelConfirm(false)} title={t('invoiceDetailModal.cancelConfirm.title')}>
        <div className="mb-6">
          <p className="text-steel-300">
            {t('invoiceDetailModal.cancelConfirm.message', { invoiceNumber: invoice.invoiceNumber })}
          </p>
          <p className="mt-2 text-sm text-steel-500">{t('invoiceDetailModal.cancelConfirm.warning')}</p>
        </div>
        <ModalActions>
          <Button variant="secondary" onClick={() => setShowCancelConfirm(false)}>
            {t('invoiceDetailModal.cancelConfirm.keep')}
          </Button>
          <Button variant="danger" onClick={handleCancel} disabled={isCancelling}>
            {isCancelling ? t('invoiceDetailModal.cancelling') : t('invoiceDetailModal.cancelConfirm.confirm')}
          </Button>
        </ModalActions>
      </Modal>
    );
  }

  // Payment Form View
  if (showPaymentForm) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={() => setShowPaymentForm(false)}
        title={t('invoiceDetailModal.paymentForm.title')}
        size="sm"
      >
        {formError && (
          <Alert variant="error" className="mb-4" onClose={() => setFormError(null)}>
            {formError}
          </Alert>
        )}

        <form onSubmit={handlePaymentSubmit}>
          <div className="space-y-4">
            <FormField label={t('invoiceDetailModal.paymentForm.paymentDate')} required>
              <Input
                type="date"
                value={paymentForm.paymentDate}
                onChange={e => handlePaymentFormChange('paymentDate', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </FormField>

            <FormField label={t('invoiceDetailModal.paymentForm.amount')} required>
              <Input
                type="number"
                value={paymentForm.amount}
                onChange={e => handlePaymentFormChange('amount', e.target.value)}
                min={0}
                max={invoice.remainingBalance}
                step="1"
                placeholder={t('invoiceDetailModal.paymentForm.amountPlaceholder')}
                required
              />
              <p className="mt-1 text-xs text-steel-500">
                {t('invoiceDetailModal.paymentForm.remainingBalance', { amount: invoiceRules.formatAmount(invoice.remainingBalance) })}
              </p>
            </FormField>

            <FormField label={t('invoiceDetailModal.paymentForm.paymentMethod')} required>
              <select
                value={paymentForm.paymentMethod}
                onChange={e => handlePaymentFormChange('paymentMethod', e.target.value)}
                className="w-full rounded-md border border-steel-600 bg-steel-800 px-3 py-2 text-sm text-white focus:border-copper-500 focus:outline-none focus:ring-1 focus:ring-copper-500"
              >
                {paymentMethodOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label={t('invoiceDetailModal.paymentForm.referenceNumber')}>
              <Input
                type="text"
                value={paymentForm.referenceNumber}
                onChange={e => handlePaymentFormChange('referenceNumber', e.target.value)}
                placeholder={t('invoiceDetailModal.paymentForm.referencePlaceholder')}
              />
            </FormField>

            <FormField label={t('invoiceDetailModal.paymentForm.notes')}>
              <textarea
                value={paymentForm.notes}
                onChange={e => handlePaymentFormChange('notes', e.target.value)}
                placeholder={t('invoiceDetailModal.paymentForm.notesPlaceholder')}
                rows={2}
                className="w-full rounded-md border border-steel-600 bg-steel-800 px-3 py-2 text-sm text-white placeholder-steel-500 focus:border-copper-500 focus:outline-none focus:ring-1 focus:ring-copper-500"
              />
            </FormField>
          </div>

          <ModalActions>
            <Button type="button" variant="secondary" onClick={() => setShowPaymentForm(false)}>
              {t('invoiceDetailModal.cancel')}
            </Button>
            <Button type="submit" disabled={isRecordingPayment}>
              {isRecordingPayment ? t('invoiceDetailModal.recording') : t('invoiceDetailModal.recordPayment')}
            </Button>
          </ModalActions>
        </form>
      </Modal>
    );
  }

  // Main Invoice Detail View
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={invoice.invoiceNumber}
      size="lg"
    >
      {/* Error Alert */}
      {formError && (
        <Alert variant="error" className="mb-4" onClose={() => setFormError(null)}>
          {formError}
        </Alert>
      )}

      {/* Invoice Info */}
      <Card className="mb-4 border-steel-700 bg-steel-800/50 p-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <div className="text-xs text-steel-400">{t('invoiceDetailModal.fields.status')}</div>
            <div className="mt-1">
              <InvoiceStatusBadge status={invoice.status} />
            </div>
          </div>
          <div>
            <div className="text-xs text-steel-400">{t('invoiceDetailModal.fields.issueDate')}</div>
            <div className="mt-1 text-sm text-white">{formatDate(invoice.issueDate)}</div>
          </div>
          <div>
            <div className="text-xs text-steel-400">{t('invoiceDetailModal.fields.dueDate')}</div>
            <div
              className={`mt-1 text-sm ${invoice.isOverdue ? 'text-red-400' : 'text-white'}`}
            >
              {formatDate(invoice.dueDate)}
              {invoice.isOverdue && (
                <span className="ml-1 text-xs">({t('invoiceDetailModal.daysOverdue', { days: invoice.daysOverdue })})</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-steel-400">{t('invoiceDetailModal.fields.jobCode')}</div>
            <div className="mt-1 text-sm text-copper-400">{invoice.jobCode}</div>
          </div>
        </div>

        {/* Payment Progress */}
        <div className="mt-4 border-t border-steel-700 pt-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-steel-400">{t('invoiceDetailModal.paymentProgress')}</span>
            <span className="text-steel-300">{paymentProgress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-steel-700">
            <div
              className={`h-full transition-all ${
                paymentProgress === 100 ? 'bg-green-500' : 'bg-copper-500'
              }`}
              style={{ width: `${paymentProgress}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs">
            <span className="text-green-400">
              {t('invoiceDetailModal.paid', { amount: invoiceRules.formatAmount(invoice.totalPaid) })}
            </span>
            <span className="text-yellow-400">
              {t('invoiceDetailModal.remaining', { amount: invoiceRules.formatAmount(invoice.remainingBalance) })}
            </span>
          </div>
        </div>
      </Card>

      {/* Amounts */}
      <Card className="mb-4 border-steel-700 bg-steel-800/50 p-4">
        <h4 className="mb-3 text-sm font-semibold text-white">{t('invoiceDetailModal.sections.amounts')}</h4>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <div className="text-xs text-steel-400">{t('invoiceDetailModal.amounts.subtotal')}</div>
            <div className="mt-1 font-mono text-sm text-white">
              {invoiceRules.formatAmount(invoice.totalBeforeTax)}
            </div>
          </div>
          <div>
            <div className="text-xs text-steel-400">{t('invoiceDetailModal.amounts.tax', { rate: invoice.taxRate })}</div>
            <div className="mt-1 font-mono text-sm text-white">
              {invoiceRules.formatAmount(invoice.totalTax)}
            </div>
          </div>
          <div>
            <div className="text-xs text-steel-400">{t('invoiceDetailModal.amounts.total')}</div>
            <div className="mt-1 font-mono text-sm font-bold text-copper-400">
              {invoiceRules.formatAmount(invoice.totalAmount)}
            </div>
          </div>
          <div>
            <div className="text-xs text-steel-400">{t('invoiceDetailModal.amounts.balanceDue')}</div>
            <div
              className={`mt-1 font-mono text-sm font-bold ${
                invoice.remainingBalance > 0 ? 'text-yellow-400' : 'text-green-400'
              }`}
            >
              {invoiceRules.formatAmount(invoice.remainingBalance)}
            </div>
          </div>
        </div>
      </Card>

      {/* Line Items */}
      <Card className="mb-4 border-steel-700 bg-steel-800/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-white">{t('invoiceDetailModal.sections.lineItems')}</h4>
          <span className="text-xs text-steel-400">{t('invoiceDetailModal.itemCount', { count: invoice.lineItems.length })}</span>
        </div>

        <div className="max-h-48 overflow-y-auto">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{t('invoiceDetailModal.lineItems.product')}</Table.HeaderCell>
                <Table.HeaderCell className="text-right">{t('invoiceDetailModal.lineItems.qty')}</Table.HeaderCell>
                <Table.HeaderCell className="text-right">{t('invoiceDetailModal.lineItems.unitPrice')}</Table.HeaderCell>
                <Table.HeaderCell className="text-right">{t('invoiceDetailModal.lineItems.total')}</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {invoice.lineItems.map(item => (
                <Table.Row key={item.id}>
                  <Table.Cell className="text-white">{item.productName}</Table.Cell>
                  <Table.Cell className="text-right">{item.quantityInvoiced}</Table.Cell>
                  <Table.Cell className="text-right font-mono">
                    {formatCurrency(item.unitPrice)}
                  </Table.Cell>
                  <Table.Cell className="text-right font-mono text-copper-400">
                    {formatCurrency(item.lineTotal)}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      </Card>

      {/* Payment History */}
      <Card className="mb-4 border-steel-700 bg-steel-800/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-white">{t('invoiceDetailModal.sections.paymentHistory')}</h4>
          <span className="text-xs text-steel-400">{t('invoiceDetailModal.paymentCount', { count: invoice.payments.length })}</span>
        </div>

        <div className="max-h-32 overflow-y-auto">
          <PaymentHistoryTable
            payments={invoice.payments}
            emptyMessage={t('invoiceDetailModal.noPayments')}
          />
        </div>
      </Card>

      {/* Timestamps */}
      <div className="mb-4 text-xs text-steel-500">
        {t('invoiceDetailModal.metadata', { createdBy: invoice.createdByName, createdAt: formatDateTime(invoice.createdAt), updatedAt: formatDateTime(invoice.updatedAt) })}
      </div>

      {/* Actions */}
      <ModalActions align="between">
        <div className="flex gap-2">
          {canManageInvoices && invoiceRules.canIssue(invoice) && (
            <Button onClick={handleIssue} disabled={isIssuing} size="sm">
              {isIssuing ? t('invoiceDetailModal.issuing') : t('invoiceDetailModal.issueInvoice')}
            </Button>
          )}
          {canManageInvoices && invoiceRules.canReceivePayment(invoice) && (
            <Button onClick={openPaymentForm} size="sm">
              <Icon name="plus" className="mr-1 h-3 w-3" />
              {t('invoiceDetailModal.recordPayment')}
            </Button>
          )}
          {canManageInvoices && invoiceRules.canCancel(invoice) && (
            <Button
              variant="danger"
              onClick={() => setShowCancelConfirm(true)}
              size="sm"
            >
              {t('invoiceDetailModal.cancelInvoice')}
            </Button>
          )}
        </div>
        <Button variant="secondary" onClick={onClose}>
          {t('invoiceDetailModal.close')}
        </Button>
      </ModalActions>
    </Modal>
  );
}
