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
        setFormError('Please enter a valid payment amount');
        return;
      }

      if (!paymentForm.paymentDate) {
        setFormError('Please enter a payment date');
        return;
      }

      // Check if payment exceeds remaining balance
      if (invoice && amount > invoice.remainingBalance) {
        setFormError(
          `Payment amount (${formatCurrency(amount)}) exceeds remaining balance (${formatCurrency(invoice.remainingBalance)})`
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
          <LoadingState message="Loading invoice details..." />
        </Card>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Alert variant="error">Failed to load invoice: {fetchError.message}</Alert>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/invoices')}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Alert variant="error">Invoice not found</Alert>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/invoices')}>
          Back to Invoices
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
          description={`Tax Invoice for Job Code: ${invoice.jobCode}`}
        />
        <PageHeader.Actions>
          <Button variant="ghost" onClick={() => navigate('/invoices')}>
            Back to List
          </Button>
          {canManageInvoices && invoiceRules.canIssue(invoice) && (
            <Button onClick={handleIssue} disabled={isIssuing}>
              {isIssuing ? 'Issuing...' : 'Issue Invoice'}
            </Button>
          )}
          {canManageInvoices && invoiceRules.canReceivePayment(invoice) && (
            <Button onClick={openPaymentModal}>
              <Icon name="plus" className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          )}
          {canManageInvoices && invoiceRules.canCancel(invoice) && (
            <Button variant="danger" onClick={() => setShowCancelConfirm(true)}>
              Cancel Invoice
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
            <div className="text-sm text-steel-400">Status</div>
            <div className="mt-1">
              <InvoiceStatusBadge status={invoice.status} />
            </div>
          </div>
          <div>
            <div className="text-sm text-steel-400">Issue Date</div>
            <div className="mt-1 text-white">{formatDate(invoice.issueDate)}</div>
          </div>
          <div>
            <div className="text-sm text-steel-400">Due Date</div>
            <div className={`mt-1 ${invoice.isOverdue ? 'text-red-400' : 'text-white'}`}>
              {formatDate(invoice.dueDate)}
              {invoice.isOverdue && (
                <span className="ml-2 text-xs">({invoice.daysOverdue} days overdue)</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-sm text-steel-400">Project</div>
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
            <span className="text-steel-400">Payment Progress</span>
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
              Paid: {invoiceRules.formatAmount(invoice.totalPaid)}
            </span>
            <span className="text-yellow-400">
              Remaining: {invoiceRules.formatAmount(invoice.remainingBalance)}
            </span>
          </div>
        </div>

        {/* Aging */}
        {invoice.remainingBalance > 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Icon name="clock" className="h-4 w-4 text-steel-500" />
            <span className="text-steel-400">Aging:</span>
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
            <div className="text-sm text-steel-400">Notes</div>
            <div className="mt-1 text-steel-300">{invoice.notes}</div>
          </div>
        )}

        {/* Timestamps */}
        <div className="mt-4 border-t border-steel-700 pt-4 text-xs text-steel-500">
          Created by {invoice.createdByName} on {formatDateTime(invoice.createdAt)} | Updated:{' '}
          {formatDateTime(invoice.updatedAt)}
        </div>
      </Card>

      {/* Amounts Card */}
      <Card className="mb-6 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Invoice Amounts</h3>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <div>
            <div className="text-sm text-steel-400">Subtotal</div>
            <div className="mt-1 font-mono text-lg text-white">
              {invoiceRules.formatAmount(invoice.totalBeforeTax)}
            </div>
          </div>
          <div>
            <div className="text-sm text-steel-400">Tax ({invoice.taxRate}%)</div>
            <div className="mt-1 font-mono text-lg text-white">
              {invoiceRules.formatAmount(invoice.totalTax)}
            </div>
          </div>
          <div>
            <div className="text-sm text-steel-400">Total</div>
            <div className="mt-1 font-mono text-lg font-bold text-copper-400">
              {invoiceRules.formatAmount(invoice.totalAmount)}
            </div>
          </div>
          <div>
            <div className="text-sm text-steel-400">Balance Due</div>
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
          <h3 className="text-lg font-semibold text-white">Line Items</h3>
          <span className="text-steel-400">{invoice.lineItems.length} items</span>
        </div>

        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Product</Table.HeaderCell>
              <Table.HeaderCell>SKU</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Quantity</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Unit Price</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Line Total</Table.HeaderCell>
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
                Total:
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
          <h3 className="text-lg font-semibold text-white">Payment History</h3>
          <span className="text-steel-400">{invoice.payments.length} payments</span>
        </div>

        <PaymentHistoryTable
          payments={invoice.payments}
          emptyMessage="No payments have been recorded for this invoice."
        />
      </Card>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Payment"
      >
        <form onSubmit={handlePaymentSubmit}>
          <div className="space-y-4">
            <FormField label="Payment Date" required>
              <Input
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) => handlePaymentFormChange('paymentDate', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </FormField>

            <FormField label="Amount" required>
              <Input
                type="number"
                value={paymentForm.amount}
                onChange={(e) => handlePaymentFormChange('amount', e.target.value)}
                min={0}
                max={invoice.remainingBalance}
                step="1"
                placeholder="Enter payment amount"
                required
              />
              <p className="mt-1 text-xs text-steel-500">
                Remaining balance: {invoiceRules.formatAmount(invoice.remainingBalance)}
              </p>
            </FormField>

            <FormField label="Payment Method" required>
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

            <FormField label="Reference Number">
              <Input
                type="text"
                value={paymentForm.referenceNumber}
                onChange={(e) => handlePaymentFormChange('referenceNumber', e.target.value)}
                placeholder="e.g., Check number, transaction ID"
              />
            </FormField>

            <FormField label="Notes">
              <textarea
                value={paymentForm.notes}
                onChange={(e) => handlePaymentFormChange('notes', e.target.value)}
                placeholder="Optional notes about this payment"
                rows={2}
                className="w-full rounded-md border border-steel-600 bg-steel-800 px-3 py-2 text-sm text-white placeholder-steel-500 focus:border-copper-500 focus:outline-none focus:ring-1 focus:ring-copper-500"
              />
            </FormField>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isRecordingPayment}>
              {isRecordingPayment ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title="Cancel Invoice"
      >
        <div className="mb-6">
          <p className="text-steel-300">
            Are you sure you want to cancel invoice <strong>{invoice.invoiceNumber}</strong>?
          </p>
          <p className="mt-2 text-sm text-steel-500">This action cannot be undone.</p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowCancelConfirm(false)}>
            Keep Invoice
          </Button>
          <Button variant="danger" onClick={handleCancel} disabled={isCancelling}>
            {isCancelling ? 'Cancelling...' : 'Yes, Cancel Invoice'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
