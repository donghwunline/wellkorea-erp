/**
 * Record Payment Modal
 *
 * Inline modal for recording a payment against an invoice.
 * Avoids navigation to preserve user context.
 */

import { useCallback, useState } from 'react';
import {
  Button,
  FormField,
  Input,
  Modal,
  ModalActions,
} from '@/shared/ui';
import {
  type InvoiceSummary,
  type PaymentMethod,
  invoiceRules,
  getPaymentMethodOptions,
} from '@/entities/invoice';
import { useRecordPayment } from '@/features/payment/record';

export interface RecordPaymentModalProps {
  readonly invoice: InvoiceSummary;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

/** Get today's date in YYYY-MM-DD format */
function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function RecordPaymentModal({
  invoice,
  isOpen,
  onClose,
  onSuccess,
}: RecordPaymentModalProps) {
  // Form state
  const [paymentDate, setPaymentDate] = useState(getTodayISO());
  const [amount, setAmount] = useState(invoice.remainingBalance.toString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const paymentMethodOptions = getPaymentMethodOptions(true); // Korean labels

  const { mutate: recordPayment, isPending } = useRecordPayment({
    onSuccess: () => {
      handleClose();
      onSuccess?.();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleClose = useCallback(() => {
    // Reset form
    setPaymentDate(getTodayISO());
    setAmount(invoice.remainingBalance.toString());
    setPaymentMethod('BANK_TRANSFER');
    setReferenceNumber('');
    setNotes('');
    setError(null);
    onClose();
  }, [invoice.remainingBalance, onClose]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const amountNum = parseFloat(amount);

      // Validate
      if (!paymentDate) {
        setError('Payment date is required');
        return;
      }

      if (isNaN(amountNum) || amountNum <= 0) {
        setError('Amount must be greater than 0');
        return;
      }

      if (amountNum > invoice.remainingBalance) {
        setError(`Amount cannot exceed remaining balance (${invoiceRules.formatAmount(invoice.remainingBalance)})`);
        return;
      }

      recordPayment({
        invoiceId: invoice.id,
        paymentDate,
        amount: amountNum,
        paymentMethod,
        referenceNumber: referenceNumber || null,
        notes: notes || null,
      });
    },
    [invoice, paymentDate, amount, paymentMethod, referenceNumber, notes, recordPayment]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`결제 등록 - Invoice #${invoice.invoiceNumber}`}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-900/50 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <FormField label="Payment Date" required>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              disabled={isPending}
            />
          </FormField>

          <FormField label="Amount" required>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={0}
              max={invoice.remainingBalance}
              step={1}
              required
              disabled={isPending}
            />
            <p className="mt-1 text-xs text-steel-500">
              Max: {invoiceRules.formatAmount(invoice.remainingBalance)}
            </p>
          </FormField>

          <FormField label="Payment Method" required>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-md border border-steel-600 bg-steel-800 px-3 py-2 text-sm text-white focus:border-copper-500 focus:outline-none focus:ring-1 focus:ring-copper-500"
              disabled={isPending}
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
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Transaction ID, check number, etc."
              disabled={isPending}
            />
          </FormField>

          <FormField label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              rows={2}
              className="w-full rounded-md border border-steel-600 bg-steel-800 px-3 py-2 text-sm text-white placeholder-steel-500 focus:border-copper-500 focus:outline-none focus:ring-1 focus:ring-copper-500"
              disabled={isPending}
            />
          </FormField>
        </div>

        <ModalActions>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Recording...' : 'Record Payment'}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
