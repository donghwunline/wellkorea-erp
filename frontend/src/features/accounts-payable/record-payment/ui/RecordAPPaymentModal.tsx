/**
 * Record AP Payment Modal
 *
 * Modal for recording a payment against an accounts payable (vendor payment).
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  FormField,
  Input,
  Modal,
  ModalActions,
} from '@/shared/ui';
import {
  type AccountsPayable,
  type VendorPaymentMethod,
  accountsPayableRules,
} from '@/entities/accounts-payable';
import { useRecordAPPayment } from '../model/use-record-ap-payment';

export interface RecordAPPaymentModalProps {
  readonly ap: AccountsPayable;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

/** Get today's date in YYYY-MM-DD format */
function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

const PAYMENT_METHODS: VendorPaymentMethod[] = [
  'BANK_TRANSFER',
  'CHECK',
  'CASH',
  'PROMISSORY_NOTE',
  'OTHER',
];

export function RecordAPPaymentModal({
  ap,
  isOpen,
  onClose,
  onSuccess,
}: RecordAPPaymentModalProps) {
  const { t } = useTranslation('purchasing');

  // Form state
  const [paymentDate, setPaymentDate] = useState(getTodayISO());
  const [amount, setAmount] = useState(ap.remainingBalance.toString());
  const [paymentMethod, setPaymentMethod] = useState<VendorPaymentMethod>('BANK_TRANSFER');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { mutate: recordPayment, isPending } = useRecordAPPayment({
    onSuccess: () => {
      handleClose();
      onSuccess?.();
    },
    onError: err => {
      setError(err.message);
    },
  });

  const handleClose = useCallback(() => {
    // Reset form
    setPaymentDate(getTodayISO());
    setAmount(ap.remainingBalance.toString());
    setPaymentMethod('BANK_TRANSFER');
    setReferenceNumber('');
    setNotes('');
    setError(null);
    onClose();
  }, [ap.remainingBalance, onClose]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const amountNum = parseFloat(amount);

      // Validate
      if (!paymentDate) {
        setError(t('accountsPayable.paymentModal.paymentDateRequired'));
        return;
      }

      if (isNaN(amountNum) || amountNum <= 0) {
        setError(t('accountsPayable.paymentModal.amountInvalid'));
        return;
      }

      if (amountNum > ap.remainingBalance) {
        setError(t('accountsPayable.paymentModal.amountExceedsBalance'));
        return;
      }

      recordPayment({
        apId: ap.id,
        input: {
          paymentDate,
          amount: amountNum,
          paymentMethod,
          referenceNumber: referenceNumber || undefined,
          notes: notes || undefined,
        },
      });
    },
    [ap.id, ap.remainingBalance, paymentDate, amount, paymentMethod, referenceNumber, notes, recordPayment, t]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('accountsPayable.paymentModal.title')}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Summary section */}
          <div className="rounded-md bg-steel-800 p-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-steel-400">{t('accountsPayable.paymentModal.vendor')}:</span>
              <span className="text-white">{ap.vendorName}</span>
              <span className="text-steel-400">{t('accountsPayable.paymentModal.referenceNo')}:</span>
              <span className="text-white">{ap.causeReferenceNumber}</span>
              <span className="text-steel-400">{t('accountsPayable.paymentModal.totalAmount')}:</span>
              <span className="text-white">{accountsPayableRules.formatTotalAmount(ap)}</span>
              <span className="text-steel-400">{t('accountsPayable.paymentModal.totalPaid')}:</span>
              <span className="text-white">{accountsPayableRules.formatTotalPaid(ap)}</span>
              <span className="text-steel-400">{t('accountsPayable.paymentModal.remainingBalance')}:</span>
              <span className="font-semibold text-copper-400">
                {accountsPayableRules.formatRemainingBalance(ap)}
              </span>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-900/50 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <FormField label={t('accountsPayable.paymentModal.paymentDate')} required>
            <Input
              type="date"
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              required
              disabled={isPending}
            />
          </FormField>

          <FormField label={t('accountsPayable.paymentModal.amount')} required>
            <Input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min={0}
              max={ap.remainingBalance}
              step={1}
              required
              disabled={isPending}
            />
            <p className="mt-1 text-xs text-steel-500">
              {t('accountsPayable.paymentModal.remainingBalance')}: {accountsPayableRules.formatRemainingBalance(ap)}
            </p>
          </FormField>

          <FormField label={t('accountsPayable.paymentModal.paymentMethod')} required>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as VendorPaymentMethod)}
              className="w-full rounded-md border border-steel-600 bg-steel-800 px-3 py-2 text-sm text-white focus:border-copper-500 focus:outline-none focus:ring-1 focus:ring-copper-500"
              disabled={isPending}
            >
              {PAYMENT_METHODS.map(method => (
                <option key={method} value={method}>
                  {t(`accountsPayable.paymentMethod.${method}`)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label={t('accountsPayable.paymentModal.referenceNumber')}>
            <Input
              type="text"
              value={referenceNumber}
              onChange={e => setReferenceNumber(e.target.value)}
              placeholder={t('accountsPayable.paymentModal.referenceNumberPlaceholder')}
              disabled={isPending}
            />
          </FormField>

          <FormField label={t('accountsPayable.paymentModal.notes')}>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('accountsPayable.paymentModal.notesPlaceholder')}
              rows={2}
              className="w-full rounded-md border border-steel-600 bg-steel-800 px-3 py-2 text-sm text-white placeholder-steel-500 focus:border-copper-500 focus:outline-none focus:ring-1 focus:ring-copper-500"
              disabled={isPending}
            />
          </FormField>
        </div>

        <ModalActions>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
            {t('accountsPayable.paymentModal.cancel')}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? t('accountsPayable.paymentModal.submitting')
              : t('accountsPayable.paymentModal.submit')}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
